import { lazy, Suspense } from 'react';
import { createRootRoute, createRoute, createRouter, Outlet, Link, redirect, useNavigate } from '@tanstack/react-router';
import VueWrapper from './components/VueWrapper';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Register from './pages/Register';

const CatalogPage = lazy(() => import('remote_catalog/CatalogPage').then(m => ({ default: m.default })));
const DashboardMain = lazy(() => import('remote_dashboard/DashboardMain').then(m => ({ default: m.default })));

const rootRoute = createRootRoute({
  component: () => {
    const user = useAuthStore(state => state.user);
    const clearAuth = useAuthStore(state => state.clearAuth);
    const navigate = useNavigate();

    const handleLogout = () => {
      clearAuth();
      navigate({ to: '/login' });
    };

    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <span className="text-xl font-bold text-primary-600">MiCommerce</span>
                <nav className="ml-8 flex space-x-4">
                  <Link to="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium [&.active]:text-primary-600">Home</Link>
                  <Link to="/catalog" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium [&.active]:text-primary-600">Catalog</Link>
                  {user?.role === 'merchant' && (
                    <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium [&.active]:text-primary-600">Dashboard</Link>
                  )}
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                {user ? (
                  <>
                    <span className="text-sm text-gray-500">Hi, {user.name}</span>
                    <button onClick={handleLogout} className="text-sm font-medium text-red-600 hover:text-red-500 cursor-pointer">Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Login</Link>
                    <Link to="/register" className="btn-primary py-1.5 px-3 text-sm">Register</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>
      </div>
    );
  },
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <div className="text-center py-20">
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
        Welcome to <span className="text-primary-600">MiCommerce</span>
      </h1>
      <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
        A microfrontend e-commerce platform built with React, Vue, and Vite.
      </p>
      <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
        <div className="rounded-md shadow">
          <Link to="/catalog" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10">
            Shop Now
          </Link>
        </div>
      </div>
    </div>
  ),
});

const catalogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/catalog',
  component: () => (
    <Suspense fallback={<div className="flex justify-center p-8">Loading Catalog...</div>}>
      <VueWrapper vueComponent={CatalogPage} />
    </Suspense>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (!user || user.role !== 'merchant') {
      throw redirect({ to: '/login' });
    }
  },
  component: () => (
    <Suspense fallback={<div className="flex justify-center p-8">Loading Dashboard...</div>}>
      <DashboardMain />
    </Suspense>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: Register,
});

const routeTree = rootRoute.addChildren([indexRoute, catalogRoute, dashboardRoute, loginRoute, registerRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
