import ForgotPassword from "./pages/ForgotPassword";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppProvider, useAuth } from "@/context/AppContext";
import ScrollToTop from "@/components/ScrollToTop";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProductListing from "./pages/ProductListing";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import PaymentStatus from "./pages/PaymentStatus";
import Dashboard from "./pages/Dashboard";
import DashboardProfile from "./pages/dashboard/DashboardProfile";
import DashboardOrders from "./pages/dashboard/DashboardOrders";
import DashboardAddresses from "./pages/dashboard/DashboardAddresses";
import OrderDetail from "./pages/dashboard/OrderDetail";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";

import NotFound from "./pages/NotFound";

// ✅ ADDED LEGAL PAGES IMPORTS
import ShippingPolicy from "./pages/ShippingPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AboutUs from "./pages/AboutUs";

const queryClient = new QueryClient();

// ==========================================
// ✅ SECURITY GATEKEEPERS
// ==========================================

// 1. Blocks guests from seeing User Dashboard
const ProtectedRoute = () => {
  const { user, isAuthenticated } = useAuth();
  
  // If we have a token in localStorage but state isn't updated yet, wait.
  const hasToken = !!localStorage.getItem('user');
  if (hasToken && !user) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};

// 2. Strictly locks Admin Panel to your two specific emails
const AdminRoute = () => {
  const { user } = useAuth();
  
  // Check if we are still "Loading" the user from localStorage
  const userStored = localStorage.getItem('user');
  
  // If there's data in storage but React state is still null, show a loader
  if (userStored && !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  // Now perform the actual checks
  if (!user) {
    console.log("AdminRoute: No user session found. Redirecting...");
    return <Navigate to="/login" replace />;
  }
  
  const ADMIN_EMAILS = ['alankritasthana12@gmail.com', 'techmasterskanpur@gmail.com'];
  
  // Normalize emails to avoid case-sensitivity issues
  const userEmail = user.email?.toLowerCase().trim();
  const isAuthorized = ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail);

  if (!isAuthorized) {
    console.warn("Access Denied for:", user.email);
    return <Navigate to="/" replace />;
  }
  
  return <Outlet />;
};

// ==========================================

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/products" element={<ProductListing />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment/:status" element={<PaymentStatus />} />
            
            {/* ✅ FIXED LEGAL ROUTES TO MATCH YOUR FOOTER BUTTONS */}
            <Route path="/shipping" element={<ShippingPolicy />} />
            <Route path="/terms" element={<TermsOfUse />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/about" element={<AboutUs />} />
            
            {/* User Dashboard */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />}>
                <Route index element={<DashboardProfile />} />
                <Route path="orders" element={<DashboardOrders />} />
                <Route path="orders/:orderId" element={<OrderDetail />} />
                <Route path="addresses" element={<DashboardAddresses />} />
              </Route>
            </Route>

            {/* Admin Dashboard */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="orders" element={<AdminDashboard />} />
                <Route path="pending" element={<AdminDashboard />} />
                <Route path="delivered" element={<AdminDashboard />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;