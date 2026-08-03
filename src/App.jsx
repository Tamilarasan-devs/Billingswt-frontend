import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './store/AuthContext';
import AuthLayout from './layouts/AuthLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import SplashScreen from './components/SplashScreen';
import LandingPage from './pages/LandingPage';

import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Billing from './pages/Billing';
import SalesHistory from './pages/SalesHistory';
import BarcodeGenerator from './pages/BarcodeGenerator';
import BusinessProfile from './pages/BusinessProfile';
import LicenseManager from './pages/LicenseManager';
import AdminUsers from './pages/AdminUsers';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <SplashScreen />;
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/new" element={<ProductForm />} />
        <Route path="/products/edit/:id" element={<ProductForm />} />
        <Route path="/barcodes" element={<BarcodeGenerator />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/billing/new" element={<Billing />} /> {/* Both point to the POS */}
        <Route path="/sales" element={<SalesHistory />} />
        <Route path="/profile" element={<BusinessProfile />} />
        <Route path="/admin/licenses" element={<LicenseManager />} />
        <Route path="/admin/users" element={<AdminUsers />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppContent() {
  const { loading: authLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1000); // Display splash screen for 1 second while auth loads in parallel

    return () => clearTimeout(timer);
  }, []);

  if (showSplash || authLoading) {
    return <SplashScreen />;
  }

  return (
    <>
      <Toaster position="top-right" />
      <AppRoutes />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
