import { useState } from 'react';
import { Package, TrendingUp, FolderTree, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@antigravity/shared-ui/react/Button';
import { Card } from '@antigravity/shared-ui/react/Card';
import { Input } from '@antigravity/shared-ui/react/Input';

interface Category {
  id: number;
  name: string;
  description: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: number;
  category: Category;
}

const API_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : 'http://localhost:8080';

const getAuthToken = () => localStorage.getItem('auth_token');

const fetchCategories = async (): Promise<Category[]> => {
  const res = await fetch(`${API_URL}/api/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
};

const fetchProducts = async (): Promise<Product[]> => {
  const res = await fetch(`${API_URL}/api/products`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
};

export default function DashboardMain() {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories'>('overview');
  const [newCatName, setNewCatName] = useState('');
  const [newProd, setNewProd] = useState({ name: '', price: 0, category_id: 0 });

  const queryClient = useQueryClient();

  // Queries
  const { data: categories = [], isLoading: isLoadingCategories, error: errorCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories
  });

  const { data: products = [], isLoading: isLoadingProducts, error: errorProducts } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create category');
      return data;
    },
    onSuccess: () => {
      setNewCatName('');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  const createProductMutation = useMutation({
    mutationFn: async (payload: { name: string; price: number; category_id: number }) => {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create product');
      return data;
    },
    onSuccess: () => {
      setNewProd({ name: '', price: 0, category_id: 0 });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete category');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete product');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    createCategoryMutation.mutate(newCatName);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.price || !newProd.category_id) return;
    createProductMutation.mutate(newProd);
  };

  const isLoading = isLoadingCategories || isLoadingProducts;
  const error = errorCategories || errorProducts;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        Error: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b border-gray-200 pb-4">
        <button
          className={`font-medium pb-2 transition-colors ${
            activeTab === 'overview' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`font-medium pb-2 transition-colors ${
            activeTab === 'products' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
        <button
          className={`font-medium pb-2 transition-colors ${
            activeTab === 'categories' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex items-center space-x-4" hoverable>
            <div className="p-3 bg-primary-100 text-primary-600 rounded-full">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">$24,500</p>
            </div>
          </Card>
          <Card className="flex items-center space-x-4" hoverable>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Products</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
          </Card>
          <Card className="flex items-center space-x-4" hoverable>
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
              <FolderTree className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-bold text-lg mb-4 text-gray-900">Add Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <Input
                type="text"
                placeholder="Category Name"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={createCategoryMutation.isPending}>
                {createCategoryMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </form>
          </Card>
          <Card>
            <h3 className="font-bold text-lg mb-4 text-gray-900">Categories List</h3>
            <ul className="divide-y divide-gray-100">
              {categories.map(cat => (
                <li key={cat.id} className="py-3 flex justify-between items-center">
                  <span className="text-gray-700 font-medium">{cat.name}</span>
                  <button
                    onClick={() => deleteCategoryMutation.mutate(cat.id)}
                    disabled={deleteCategoryMutation.isPending}
                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
              {categories.length === 0 && (
                <p className="text-center text-gray-500 py-6">No categories found.</p>
              )}
            </ul>
          </Card>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <h3 className="font-bold text-lg mb-4 text-gray-900">Add Product</h3>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <Input
                type="text"
                placeholder="Product Name"
                value={newProd.name}
                onChange={e => setNewProd({ ...newProd, name: e.target.value })}
                required
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Price"
                value={newProd.price || ''}
                onChange={e => setNewProd({ ...newProd, price: parseFloat(e.target.value) || 0 })}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newProd.category_id}
                  onChange={e => setNewProd({ ...newProd, category_id: parseInt(e.target.value) || 0 })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-3 py-2 border transition-colors bg-white text-gray-900"
                >
                  <option value={0} disabled>Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={createProductMutation.isPending}>
                {createProductMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </form>
          </Card>
          <Card className="md:col-span-2">
            <h3 className="font-bold text-lg mb-4 text-gray-900">Products List</h3>
            <ul className="divide-y divide-gray-100">
              {products.map(p => (
                <li key={p.id} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-medium text-gray-900">{p.name}</span>{' '}
                    <span className="text-gray-500 text-sm">({p.category?.name})</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-primary-600 font-bold">${p.price.toFixed(2)}</span>
                    <button
                      onClick={() => deleteProductMutation.mutate(p.id)}
                      disabled={deleteProductMutation.isPending}
                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
              {products.length === 0 && (
                <p className="text-center text-gray-500 py-6">No products found.</p>
              )}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
