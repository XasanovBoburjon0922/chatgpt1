"use client";

import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/authContext";
import LoginPage from "./components/LoginPage";
import DashboardPage from "./components/Dashboard";
import VerifyPage from "./components/VerifyPage";
import ApplicationFormPage from "./components/ApplicationFormPage";
import About from "./pages/About";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/" element={<DashboardPage />} />
        <Route path="/c/:chatId" element={<DashboardPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/document" element={<ApplicationFormPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;