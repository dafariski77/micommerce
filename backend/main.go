package main

import (
	"backend/handlers"
	"backend/middleware"
	"backend/models"
	"fmt"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func main() {
	// Load .env file (ignore error if not present, e.g. production)
	if err := godotenv.Load(); err != nil {
		log.Println("Note: No .env file found, using system environment variables")
	}

	dbHost := getEnv("DB_HOST", "localhost")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "postgres")
	dbName := getEnv("DB_NAME", "micommerce")
	dbPort := getEnv("DB_PORT", "5432")
	dbSslMode := getEnv("DB_SSLMODE", "disable")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s", dbHost, dbUser, dbPassword, dbName, dbPort, dbSslMode)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL. Error: %v", err)
	}

	// Auto Migrate
	db.AutoMigrate(&models.User{}, &models.Category{}, &models.Product{}, &models.Order{}, &models.OrderItem{})

	// Seed data if empty
	var count int64
	db.Model(&models.Category{}).Count(&count)
	if count == 0 {
		cat1 := models.Category{Name: "Electronics", Description: "Electronic devices"}
		cat2 := models.Category{Name: "Furniture", Description: "Home and office furniture"}
		db.Create(&[]models.Category{cat1, cat2})

		products := []models.Product{
			{Name: "Premium Wireless Headphones", Description: "High-quality noise-canceling headphones with 30-hour battery life.", Price: 299.99, ImageURL: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80", CategoryID: cat1.ID},
			{Name: "Ergonomic Office Chair", Description: "Adjustable ergonomic chair for comfortable all-day working.", Price: 199.50, ImageURL: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=500&q=80", CategoryID: cat2.ID},
		}
		db.Create(&products)
		log.Println("Seeded categories and products to database.")
	}

	authHandler := &handlers.AuthHandler{DB: db}
	catHandler := &handlers.CategoryHandler{DB: db}
	prodHandler := &handlers.ProductHandler{DB: db}
	checkoutHandler := &handlers.CheckoutHandler{DB: db}

	r := gin.Default()

	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	r.Use(cors.New(config))

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		api.GET("/categories", catHandler.GetCategories)
		api.GET("/products", prodHandler.GetProducts)

		api.POST("/xendit/webhook", checkoutHandler.Webhook)

		// Protected customer routes
		customer := api.Group("/")
		customer.Use(middleware.AuthMiddleware())
		{
			customer.POST("/checkout", checkoutHandler.CreateCheckout)
		}

		// Protected merchant routes
		merchant := api.Group("/")
		merchant.Use(middleware.AuthMiddleware(string(models.RoleMerchant)))
		{
			merchant.POST("/categories", catHandler.CreateCategory)
			merchant.DELETE("/categories/:id", catHandler.DeleteCategory)
			
			merchant.POST("/products", prodHandler.CreateProduct)
			merchant.PUT("/products/:id", prodHandler.UpdateProduct)
			merchant.DELETE("/products/:id", prodHandler.DeleteProduct)
		}
	}

	port := getEnv("PORT", "8080")
	log.Printf("Backend listening on port %s...\n", port)
	r.Run(":" + port)
}
