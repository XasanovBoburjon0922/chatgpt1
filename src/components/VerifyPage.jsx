"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function VerifyPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // Block re-verification
  const [fullName, setFullName] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const phoneNumberWithFormat = location.state?.phone || "+998 94 708 09 22";
  const phoneNumber = `+${phoneNumberWithFormat.replace(/[^\d]/g, "")}`;

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = useCallback(async () => {
    const enteredCode = code.join("");
    if (enteredCode.length !== 6 || isVerifying || isVerified) return;

    setIsVerifying(true);

    try {
      const response = await axios.post("https://imzo-ai.uzjoylar.uz/users/verify-code", {
        code: parseInt(enteredCode),
        phone_number: phoneNumber,
      });

      if (response.status === 200) {
        if (response.data && response.data.token) {
          localStorage.setItem("user_id", response.data.userInfo.id);
          localStorage.setItem("access_token", response.data.token);
          setIsVerified(true); // Block further verifications

          if (!response.data.userInfo.full_name) {
            setIsModalVisible(true);
          } else {
            login(response.data.userInfo, response.data.token);
            toast.success("Muvaffaqiyatli kirildi!");
            navigate("/");
          }
        } else if (response.data.valid === false) {
          toast.error("Kod noto'g'ri yoki muddati o'tgan!");
          setCode(["", "", "", "", "", ""]);
        }
      }
    } catch (error) {
      console.error("Verification error:", error);
      if (error.response?.status === 400) {
        toast.error("Kod noto'g'ri yoki muddati o'tgan!");
      } else if (error.response?.status === 429) {
        toast.error("Juda ko'p urinish. Biroz kuting.");
      } else if (error.response?.status >= 500) {
        toast.error("Server xatoligi. Keyinroq urinib ko'ring.");
      } else {
        toast.error("Internet aloqasini tekshiring.");
      }
      setCode(["", "", "", "", "", ""]);
    } finally {
      setIsVerifying(false);
    }
  }, [code, isVerifying, isVerified, phoneNumber, login, navigate]);

  useEffect(() => {
    const enteredCode = code.join("");
    if (enteredCode.length === 6 && !isVerifying && !isVerified) {
      handleVerify();
    }
  }, [code, isVerifying, isVerified, handleVerify]);

  const handleChange = (index, value, event) => {
    if (isVerifying || isModalVisible) return; // Block during verify or modal

    if (event.type === "paste") {
      const pastedData = event.clipboardData.getData("text").replace(/\D/g, "");
      if (pastedData.length === 6) {
        setCode(pastedData.split(""));
        document.getElementById(`code-input-5`)?.focus();
      } else {
        toast.error("Iltimos, 6 raqamli kodni kiriting!");
      }
      return;
    }

    const newCode = [...code];
    newCode[index] = value.replace(/\D/g, "").slice(0, 1);
    setCode(newCode);

    if (value && index < 5) {
      document.getElementById(`code-input-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (isVerifying || isModalVisible) return; // Block during verify or modal

    if (e.key === "Backspace" && !code[index] && index > 0) {
      document.getElementById(`code-input-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (event, index) => {
    if (isVerifying || isModalVisible) return; // Block during verify or modal
    event.preventDefault();
    handleChange(index, event.clipboardData.getData("text"), event);
  };

  const handleTelegramRedirect = () => {
    window.open("https://t.me/ai_imzo_bot", "_blank");
  };

  const handleResendCode = async () => {
    if (isVerifying || isVerified) return;
    try {
      setTimer(60);
      setCode(["", "", "", "", "", ""]);
      // await axios.post("https://imzo-ai.uzjoylar.uz/users/resend-code", {
      //   phone_number: phoneNumber,
      // });
      toast.success("Kod qayta yuborildi");
    } catch (error) {
      console.error("Resend code error:", error);
      toast.error("Kod qayta yuborishda xatolik");
    }
  };

  const handleModalOk = async () => {
    if (!fullName.trim()) {
      toast.error("Iltimos, ismingizni kiriting!");
      return;
    }
    try {
      const userId = localStorage.getItem("user_id");
      const token = localStorage.getItem("access_token");
      await axios.put(
        `https://imzo-ai.uzjoylar.uz/users/update?id=${userId}`,
        {
          full_name: fullName,
          phone_number: phoneNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Ism muvaffaqiyatli saqlandi!");
      setIsModalVisible(false);
      setFullName("");
      login({ id: userId, full_name: fullName, phone_number: phoneNumber }, token);
      navigate("/");
    } catch (error) {
      console.error("Error updating full name:", error);
      toast.error("Ismni saqlashda xatolik yuz berdi!");
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setFullName("");
    setIsVerified(false); // Allow retry if canceled
    localStorage.removeItem("user_id");
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-black/85 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="dark" />

        <button
          onClick={() => navigate("/login")}
          className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors duration-200"
          disabled={isVerifying || isModalVisible}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-black/85 rounded-2xl flex items-center justify-center shadow-lg">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold bg-black/85 from-blue-500 to-purple-600 bg-clip-text text-transparent">I</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Telefon raqamini tasdiqlang</h1>
          <p className="text-gray-400">
            <span className="text-white font-medium">{phoneNumberWithFormat}</span> raqamiga
            faollashtirish kodi bilan SMS yubordik.
          </p>
        </div>

        <div className="bg-black/25 rounded-2xl border border-gray-700/50 p-8 shadow-2xl">
          <div className="flex justify-center gap-3 mb-8">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-input-${index}`}
                type="text"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value, e)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={(e) => handlePaste(e, index)}
                maxLength={1}
                className="w-12 h-14 bg-gray-900/50 border border-gray-600 rounded-xl text-white text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-700 disabled:cursor-not-allowed"
                disabled={isVerifying || isModalVisible}
              />
            ))}
          </div>

          <button
            onClick={handleTelegramRedirect}
            disabled={isVerifying || isModalVisible}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all duration-200 mb-6"
          >
            Telegram orqali yuborish
          </button>

          <div className="text-center">
            {timer > 0 ? (
              <p className="text-gray-400">
                Kodni qayta yuborish <span className="font-mono text-white">{formatTime(timer)}</span>
              </p>
            ) : (
              <button
                onClick={handleResendCode}
                disabled={isVerifying || isVerified}
                className="text-blue-400 hover:text-blue-300 transition-colors duration-200 disabled:text-gray-600 disabled:cursor-not-allowed"
              >
                Kodni qayta yuborish
              </button>
            )}
          </div>

          {isVerifying && (
            <div className="mt-4 text-center">
              <p className="text-gray-400">Tekshirilmoqda...</p>
            </div>
          )}
        </div>

        {isModalVisible && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 w-full max-w-sm">
              <h3 className="text-xl font-bold text-white mb-4">Ismingizni kiriting</h3>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ism va familiyangizni kiriting"
                className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleModalCancel}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-3 rounded-xl transition-all duration-200"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleModalOk}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all duration-200"
                >
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyPage;