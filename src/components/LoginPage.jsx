import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authContext";

function LoginPage() {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => {
    if (phone.trim()) {
      navigate("/verify", { state: { phone: `+998 ${phone}` } });
    } else {
      alert("Please enter a valid 9-digit phone number.");
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[\s()-\.]/g, ""); 
    if (value.length <= 9) {
      let formattedValue = value;
      if (value.length > 2) {
        const firstPart = value.slice(0, 2);
        const secondPart = value.slice(2, 5);
        const thirdPart = value.slice(5, 7);
        const fourthPart = value.slice(7, 9);
        formattedValue = `(${firstPart})`;
        if (secondPart) formattedValue += ` ${secondPart}`;
        if (thirdPart) formattedValue += `-${thirdPart}`;
        if (fourthPart) formattedValue += `-${fourthPart}`;
      }
      setPhone(formattedValue.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Icon Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">I</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Yooo, welcome back!</h1>
          <p className="text-gray-400">
            First time here? <span className="text-blue-400 hover:text-blue-300 cursor-pointer">Sign up for free</span>
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 shadow-2xl">
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-medium mb-3">
              Telefon raqamingiz
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 text-sm font-medium">+998</span>
              </div>
              <input
                type="text"
                value={phone}
                onChange={handlePhoneChange}
                onKeyPress={handleKeyPress}
                placeholder="(94) 708-09-22"
                className="w-full bg-gray-900/50 border border-gray-600 rounded-xl pl-16 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                disabled={isLoading}
              />
            </div>
            <p className="text-gray-500 text-xs mt-2">Misol: 94 708 09 22</p>
          </div>

          <button
            onClick={handleLogin}
            disabled={phone.replace(/[\s()-\.]/g, "").length !== 9 || isLoading}
            className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-900 disabled:text-gray-400 font-semibold py-4 rounded-xl transition-all duration-200 mb-6"
          >
            {isLoading ? "SMS yuborilmoqda..." : "Sign in"}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-xs">
            You acknowledge that you read, and agree, to our{" "}
            <span className="text-blue-400 hover:text-blue-300 cursor-pointer">Terms of Service</span>{" "}
            and our{" "}
            <span className="text-blue-400 hover:text-blue-300 cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;