<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-gray-900">Product Catalog</h2>
      <div class="flex items-center space-x-4">
        <div class="relative flex items-center">
          <Input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search products..." 
            class="pl-10 pr-4 py-2 w-64"
          />
          <Search class="w-5 h-5 text-gray-400 absolute left-3 pointer-events-none" />
        </div>
        <button @click="cartStore.isCartOpen = true" class="relative p-2 text-gray-600 hover:text-primary-600 transition-colors">
          <ShoppingCart class="w-6 h-6" />
          <span v-if="cartStore.cartTotalItems > 0" class="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">{{ cartStore.cartTotalItems }}</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
    <div v-else-if="error" class="text-center py-12 text-red-500">{{ error }}</div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card v-for="product in filteredProducts" :key="product.id" hoverable class="flex flex-col h-full">
        <div class="h-48 bg-gray-100 rounded-md mb-4 flex items-center justify-center overflow-hidden">
          <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="object-cover w-full h-full" />
          <ShoppingBag v-else class="w-12 h-12 text-gray-400" />
        </div>
        <div class="flex-grow">
          <div class="text-xs font-bold text-primary-500 mb-1" v-if="product.category">{{ product.category.name }}</div>
          <h3 class="text-lg font-bold text-gray-900">{{ product.name }}</h3>
          <p class="text-sm text-gray-500 mt-1 line-clamp-2">{{ product.description }}</p>
        </div>
        <div class="mt-4 flex items-center justify-between">
          <span class="text-xl font-bold text-primary-600">${{ product.price.toFixed(2) }}</span>
          <Button size="sm" class="flex items-center space-x-1" @click="cartStore.addToCart(product)">
            <Plus class="w-4 h-4" />
            <span>Add</span>
          </Button>
        </div>
      </Card>
    </div>

    <!-- Cart Sidebar -->
    <div v-if="cartStore.isCartOpen" class="fixed inset-0 z-50 overflow-hidden">
      <div class="absolute inset-0 bg-black bg-opacity-50" @click="cartStore.isCartOpen = false"></div>
      <div class="absolute inset-y-0 right-0 max-w-full flex">
        <div class="w-screen max-w-md">
          <div class="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
            <div class="flex-1 py-6 overflow-y-auto px-4 sm:px-6">
              <div class="flex items-start justify-between">
                <h2 class="text-lg font-medium text-gray-900">Shopping cart</h2>
                <button @click="cartStore.isCartOpen = false" class="text-gray-400 hover:text-gray-500">
                  <X class="h-6 w-6" />
                </button>
              </div>

              <div class="mt-8">
                <div class="flow-root">
                  <ul v-if="cartStore.cart.length > 0" class="-my-6 divide-y divide-gray-200">
                    <li v-for="item in cartStore.cart" :key="item.product.id" class="py-6 flex">
                      <div class="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                        <img v-if="item.product.image_url" :src="item.product.image_url" class="w-full h-full object-cover" />
                        <ShoppingBag v-else class="w-8 h-8 text-gray-400" />
                      </div>
                      <div class="ml-4 flex-1 flex flex-col">
                        <div>
                          <div class="flex justify-between text-base font-medium text-gray-900">
                            <h3>{{ item.product.name }}</h3>
                            <p class="ml-4">${{ (item.product.price * item.quantity).toFixed(2) }}</p>
                          </div>
                        </div>
                        <div class="flex-1 flex items-end justify-between text-sm">
                          <div class="flex items-center space-x-2">
                            <button @click="cartStore.updateQuantity(item.product.id, -1)" class="p-1 text-gray-500 hover:bg-gray-100 rounded">-</button>
                            <p class="text-gray-500">Qty {{ item.quantity }}</p>
                            <button @click="cartStore.updateQuantity(item.product.id, 1)" class="p-1 text-gray-500 hover:bg-gray-100 rounded">+</button>
                          </div>
                          <button @click="cartStore.removeFromCart(item.product.id)" class="font-medium text-primary-600 hover:text-primary-500">Remove</button>
                        </div>
                      </div>
                    </li>
                  </ul>
                  <p v-else class="text-center text-gray-500 py-10">Your cart is empty.</p>
                </div>
              </div>
            </div>

            <div class="border-t border-gray-200 py-6 px-4 sm:px-6">
              <div class="flex justify-between text-base font-medium text-gray-900 mb-4">
                <p>Subtotal</p>
                <p>${{ cartStore.cartTotalPrice.toFixed(2) }}</p>
              </div>
              <Button @click="checkout" :disabled="cartStore.cart.length === 0 || cartStore.isCheckingOut" class="w-full py-3 flex justify-center items-center">
                <span v-if="cartStore.isCheckingOut">Processing...</span>
                <span v-else>Checkout with Xendit</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { Search, ShoppingBag, ShoppingCart, Plus, X } from 'lucide-vue-next';
import { useCartStore } from '../store/cartStore';
import Button from '@micommerce/shared-ui/vue/Button.vue';
import Card from '@micommerce/shared-ui/vue/Card.vue';
import Input from '@micommerce/shared-ui/vue/Input.vue';

const API_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:8080';

const products = ref([]);
const loading = ref(true);
const error = ref(null);
const searchQuery = ref('');

const cartStore = useCartStore();

const getAuthToken = () => localStorage.getItem('auth_token');

const fetchProducts = async () => {
  try {
    const response = await fetch(`${API_URL}/api/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    products.value = await response.json();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchProducts();
});

const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value;
  return products.value.filter(p => p.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

const checkout = async () => {
  const token = getAuthToken();
  if (!token) {
    alert("Please login first to checkout!");
    return;
  }

  cartStore.isCheckingOut = true;
  try {
    const payload = {
      cart_items: cartStore.cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      }))
    };

    const res = await fetch(`${API_URL}/api/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Checkout failed');

    // Clear cart in store
    cartStore.clearCart();
    
    // Redirect to Xendit Invoice
    window.location.href = data.invoice_url;
  } catch (err) {
    alert(err.message);
  } finally {
    cartStore.isCheckingOut = false;
  }
};
</script>
