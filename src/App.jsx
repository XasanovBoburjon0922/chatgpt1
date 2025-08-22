"use client";

import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/authContext";
import LoginPage from "./components/LoginPage";
import DashboardPage from "./components/Dashboard";
import VerifyPage from "./components/VerifyPage";
import ProtectedRoute from "./route/ProtectedRoute";
import ApplicationFormPage from "./components/ApplicationFormPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/document"
          element={
            <ApplicationFormPage />
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;