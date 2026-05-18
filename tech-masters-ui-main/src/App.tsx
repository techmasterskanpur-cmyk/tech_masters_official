import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppProvider, useAuth } from "@/context/AppContext";
import ScrollToTop from "@/components/ScrollToTop";

// ── Critical path: eagerly loaded (small, renders first) ──────────────────────
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// ── Non-critical: lazy-loaded (downloaded only when user navigates there) ────
const Login           = lazy(() => import("./pages/Login"));
const Signup          = lazy(() => import("./pages/Signup"));
const ForgotPassword  = lazy(() => import("./pages/ForgotPassword"));
const ProductListing  = lazy(() => import("./pages/ProductListing"));
const ProductDetail   = lazy(() => import("./pages/ProductDetail"));
const Cart            = lazy(() => import("./pages/Cart"));
const Wishlist        = lazy(() => import("./pages/Wishlist"));
const Checkout        = lazy(() => import("./pages/Checkout"));
const PaymentStatus   = lazy(() => import("./pages/PaymentStatus"));
const ShippingPolicy  = lazy(() => import("./pages/ShippingPolicy"));
const TermsOfUse      = lazy(() => import("./pages/TermsOfUse"));
const PrivacyPolicy   = lazy(() => import("./pages/PrivacyPolicy"));
const AboutUs         = lazy(() => import("./pages/AboutUs"));

const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardProfile = lazy(() => import("./pages/dashboard/DashboardProfile"));
const DashboardOrders = lazy(() => import("./pages/dashboard/DashboardOrders"));
const DashboardAddresses = lazy(() => import("./pages/dashboard/DashboardAddresses"));
const OrderDetail = lazy(() => import("./pages/dashboard/OrderDetail"));

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Loader2 } from "lucide-react";

/**
 * QueryClient – production-tuned caching defaults.
 *   staleTime: how long cached data is considered fresh (no refetch).
 *   gcTime:    how long unused cache entries survive before garbage collection.
 *   retry:     exponential backoff on failure (2 retries max).
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            30_000,    // 30 s – don't refetch on every render
      gcTime:          5 * 60_000,    // 5 min – keep data in memory after unmount
      retry:                2,
      retryDelay:           (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      refetchOnWindowFocus: false,    // don't blast the backend when tab refocuses
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Navbar />
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
    <Footer />
  </div>
);

const ProtectedRoute = () => {
  const { user } = useAuth();

  const hasToken = !!localStorage.getItem("user");
  if (hasToken && !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};

const AdminRoute = () => {
  const { user } = useAuth();

  const userStored = localStorage.getItem("user");

  if (userStored && !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const ADMIN_EMAILS = [
    "alankritasthana12@gmail.com",
    "techmasterskanpur@gmail.com",
  ];

  const userEmail = user.email?.toLowerCase().trim();
  const isAuthorized = ADMIN_EMAILS.some(
    (email) => email.toLowerCase() === userEmail
  );

  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
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

              <Route path="/shipping" element={<ShippingPolicy />} />
              <Route path="/terms" element={<TermsOfUse />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/about" element={<AboutUs />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />}>
                  <Route index element={<DashboardProfile />} />
                  <Route path="orders" element={<DashboardOrders />} />
                  <Route path="orders/:orderId" element={<OrderDetail />} />
                  <Route path="addresses" element={<DashboardAddresses />} />
                </Route>
              </Route>

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
          </Suspense>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
