/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Home from '@/src/pages/Home';
import Categories from '@/src/pages/Categories';
import Login from '@/src/pages/Login';
import Signup from '@/src/pages/Signup';
import ProductDetails from '@/src/pages/ProductDetails';
import Cart from '@/src/pages/Cart';
import Checkout from '@/src/pages/Checkout';
import TrackOrder from '@/src/pages/TrackOrder';
import Profile from '@/src/pages/Profile';
import AdminDashboard from '@/src/pages/admin/Dashboard';
import POS from '@/src/pages/admin/POS';
import Inventory from '@/src/pages/admin/Inventory';
import PageBuilder from '@/src/pages/admin/PageBuilder';
import DynamicPage from '@/src/pages/DynamicPage';
import SearchResults from '@/src/pages/SearchResults';
import HelpingCenter from '@/src/pages/HelpingCenter';
import Layout from '@/src/components/Layout';
import { AdminGuard } from '@/src/components/AdminGuard';
import { CartProvider } from '@/src/context/CartContext';

export default function App() {
  useEffect(() => {
    // UI Lockdown
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && e.key === 'I') || // Inspect
        (e.ctrlKey && e.shiftKey && e.key === 'J') || // Console
        (e.ctrlKey && e.key === 'u') // View Source
      ) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    
    // Disable image dragging
    const handleDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') {
        e.preventDefault();
      }
    };
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/p/:slug" element={<DynamicPage />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/helping" element={<HelpingCenter />} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminGuard><Outlet /></AdminGuard>}>
            <Route index element={<AdminDashboard />} />
            <Route path="pos" element={<POS />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="pages" element={<PageBuilder />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}
