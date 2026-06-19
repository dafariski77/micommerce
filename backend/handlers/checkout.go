package handlers

import (
	"backend/models"
	"context"
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	xendit "github.com/xendit/xendit-go/v4"
	"github.com/xendit/xendit-go/v4/invoice"
	"gorm.io/gorm"
)

type CheckoutHandler struct {
	DB *gorm.DB
}

type CheckoutInput struct {
	CartItems []struct {
		ProductID uint `json:"product_id" binding:"required"`
		Quantity  int  `json:"quantity" binding:"required,gt=0"`
	} `json:"cart_items" binding:"required,dive"`
}

func (h *CheckoutHandler) CreateCheckout(c *gin.Context) {
	var input CheckoutInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDFloat, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := uint(userIDFloat.(float64))

	var user models.User
	h.DB.First(&user, userID)

	// Calculate total and create order items
	var totalAmount float64
	var orderItems []models.OrderItem
	var invoiceItems []invoice.InvoiceItem

	for _, item := range input.CartItems {
		var product models.Product
		if err := h.DB.First(&product, item.ProductID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Product %d not found", item.ProductID)})
			return
		}

		itemTotal := product.Price * float64(item.Quantity)
		totalAmount += itemTotal

		orderItems = append(orderItems, models.OrderItem{
			ProductID: product.ID,
			Quantity:  item.Quantity,
			Price:     product.Price,
		})

		invoiceItems = append(invoiceItems, *invoice.NewInvoiceItem(
			product.Name,
			float32(product.Price),
			float32(item.Quantity),
		))
	}

	order := models.Order{
		UserID:      userID,
		TotalAmount: totalAmount,
		Status:      "PENDING",
		OrderItems:  orderItems,
	}

	if err := h.DB.Create(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	// Create Xendit Invoice
	xenditKey := os.Getenv("XENDIT_SECRET_KEY")
	if xenditKey == "" {
		// Mock implementation if key is missing
		order.XenditInvoice = "https://checkout.xendit.co/web/mock-invoice"
		order.InvoiceID = "mock-invoice-id"
		h.DB.Save(&order)
		c.JSON(http.StatusOK, gin.H{"invoice_url": order.XenditInvoice})
		return
	}

	xenditClient := xendit.NewClient(xenditKey)

	desc := "MiCommerce Order"
	req := xenditClient.InvoiceApi.CreateInvoice(context.Background()).
		CreateInvoiceRequest(invoice.CreateInvoiceRequest{
			ExternalId:  fmt.Sprintf("order-%d", order.ID),
			Amount:      float64(totalAmount),
			PayerEmail:  &user.Email,
			Description: &desc,
			Items:       invoiceItems,
		})

	resp, _, err := req.Execute()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Xendit invoice", "details": err.Error()})
		return
	}

	order.XenditInvoice = resp.InvoiceUrl
	order.InvoiceID = *resp.Id
	h.DB.Save(&order)

	c.JSON(http.StatusOK, gin.H{"invoice_url": order.XenditInvoice})
}

type XenditWebhookPayload struct {
	ExternalID string `json:"external_id"`
	Status     string `json:"status"`
}

func (h *CheckoutHandler) Webhook(c *gin.Context) {
	var payload XenditWebhookPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var orderID uint
	fmt.Sscanf(payload.ExternalID, "order-%d", &orderID)

	var order models.Order
	if err := h.DB.First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	if payload.Status == "PAID" || payload.Status == "SETTLED" {
		order.Status = "PAID"
	} else if payload.Status == "EXPIRED" {
		order.Status = "FAILED"
	}

	h.DB.Save(&order)
	c.JSON(http.StatusOK, gin.H{"status": "success"})
}
