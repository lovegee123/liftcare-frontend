// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, RequireAuth } from "./auth";
import "./App.css";

import Layout from "./Layout";

// Auth pages
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";

// Dashboard
import Dashboard from "./pages/main.jsx";

// Master data
import Customers from "./pages/customers.jsx";
import Buildings from "./pages/buildings.jsx";
import Elevators from "./pages/elevators.jsx";
import Technicians from "./pages/technicians.jsx";

// Contracts & Finance
import Contracts from "./pages/contracts.jsx";
import Quotations from "./pages/quotations.jsx";
import Invoices from "./pages/invoices.jsx";
import Pricing from "./pages/price.jsx";

// Parts & Inventory
import Parts from "./pages/parts.jsx";

// Maintenance
import MaintenanceTemplates from "./pages/maintenanceTemplates.jsx";
import MaintenancePlans from "./pages/maintenancePlans.jsx";
import MaintenanceJobs from "./pages/maintenanceJobs.jsx";

// Portals
import TechnicianPortal from "./pages/TechnicianPortal.jsx";
import CustomerPortal from "./pages/CustomerPortal.jsx";

// Settings
import AccountPage from "./pages/AccountPage.jsx";
import ChangePasswordPage from "./pages/ChangePasswordPage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes with Layout */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            {/* Dashboard */}
            <Route index element={<Dashboard />} />

            {/* Master Data */}
            <Route path="customers" element={<Customers />} />
            <Route path="buildings" element={<Buildings />} />
            <Route path="elevators" element={<Elevators />} />
            <Route path="technicians" element={<Technicians />} />

            {/* Contracts & Finance */}
            <Route path="contracts" element={<Contracts />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="pricing" element={<Pricing />} />

            {/* Parts & Inventory */}
            <Route path="parts" element={<Parts />} />

            {/* Maintenance */}
            <Route
              path="maintenance/templates"
              element={<MaintenanceTemplates />}
            />
            <Route path="maintenance/plans" element={<MaintenancePlans />} />
            <Route path="maintenance/jobs" element={<MaintenanceJobs />} />

            {/* Portals */}
            <Route path="technician-portal" element={<TechnicianPortal />} />
            <Route path="customer-portal" element={<CustomerPortal />} />

            {/* Settings */}
            <Route path="settings/account" element={<AccountPage />} />
            <Route path="settings/password" element={<ChangePasswordPage />} />
          </Route>

          {/* Fallback ทุก path ที่ไม่รู้จัก → กลับไปหน้าแรก */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
