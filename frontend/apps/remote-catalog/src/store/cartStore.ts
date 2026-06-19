import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: number;
  category?: {
    id: number;
    name: string;
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export const useCartStore = defineStore('cart', () => {
  const cart = ref<CartItem[]>([]);
  const isCartOpen = ref(false);
  const isCheckingOut = ref(false);

  // Initialize from localStorage
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    try {
      cart.value = JSON.parse(savedCart);
    } catch (e) {
      console.error('Failed to parse cart from localStorage', e);
    }
  }

  const saveCart = () => {
    localStorage.setItem('cart', JSON.stringify(cart.value));
  };

  const cartTotalItems = computed(() => {
    return cart.value.reduce((total, item) => total + item.quantity, 0);
  });

  const cartTotalPrice = computed(() => {
    return cart.value.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  });

  const addToCart = (product: Product) => {
    const existingItem = cart.value.find(item => item.product.id === product.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.value.push({ product, quantity: 1 });
    }
    saveCart();
    isCartOpen.value = true;
  };

  const updateQuantity = (productId: number, delta: number) => {
    const item = cart.value.find(i => i.product.id === productId);
    if (item) {
      item.quantity += delta;
      if (item.quantity <= 0) {
        removeFromCart(productId);
      } else {
        saveCart();
      }
    }
  };

  const removeFromCart = (productId: number) => {
    cart.value = cart.value.filter(i => i.product.id !== productId);
    saveCart();
  };

  const clearCart = () => {
    cart.value = [];
    saveCart();
  };

  return {
    cart,
    isCartOpen,
    isCheckingOut,
    cartTotalItems,
    cartTotalPrice,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart
  };
});
