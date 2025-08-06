"use client";

import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/authContext";
import LoginPage from "./components/LoginPage";
import DashboardPage from "./components/Dashboard";
import VerifyPage from "./components/VerifyPage";
import ProtectedRoute from "./route/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<DashboardPage />} /> 
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;