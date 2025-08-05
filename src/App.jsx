"use client";

import React from "react";
import LoginPage from "./components/LoginPage";
import DashboardPage from "./components/Dashboard";
import VerifyPage from "./components/VerifyPage";
import { Route, Routes } from "react-router-dom";

function App() {
  return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/" element={<DashboardPage />} /> 
      </Routes>
  );
}

export default App;