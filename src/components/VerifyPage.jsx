"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/auth/auth-context";
import axios from "axios";
import { Loader2 } from 'lucide-react'; // Keeping lucide-react for icons as it's not a UI component library

export default function VerifyPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [fullName, setFullName] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { login } = useAuth();

  const phoneNumberWithFormat = searchParams.get("phone") || "+998 94 708 09 22";
  const phoneNumber = `+${phoneNumberWithFormat.replace(/[^\d]/g, "")}`;

  const inputRefs = useRef([]);

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
    if (enteredCode.length !== 6 || isVerifying) return;

    setIsVerifying(true);
    try {
      const response = await axios.post(
        "https://imzo-ai.uzjoylar.uz/users/verify-code",
        {
          code: parseInt(enteredCode),
          phone_number: phoneNumber,
        }
      );

      if (response.status === 200) {
        if (response.data && response.data.token) {
          const userInfo = response.data.userInfo;
          const accessToken = response.data.token.access_token;

          localStorage.setItem("user_id", userInfo.id);
          localStorage.setItem("access_token", accessToken);

          if (!userInfo.full_name) {
            setIsModalVisible(true);
          } else {
            login(userInfo, accessToken);
            toast({
              title: "Success",
              description: "Muvaffaqiyatli kirildi!",
            });
            if (userInfo.role === "admin") {
              router.push("/admin-dashboard");
            } else {
              router.push("/dashboard");
            }
          }
        } else if (response.data.valid === false) {
          toast({
            title: "Error",
            description: "Kod noto'g'ri yoki muddati o'tgan!",
            variant: "destructive",
          });
          setCode(["", "", "", "", "", ""]);
        }
      }
    } catch (error) {
      console.error("Verification error:", error);
      if (error.response?.status === 400) {
        toast({
          title: "Error",
          description: "Kod noto'g'ri yoki muddati o'tgan!",
          variant: "destructive",
        });
      } else if (error.response?.status === 429) {
        toast({
          title: "Error",
          description: "Juda ko'p urinish. Biroz kuting.",
          variant: "destructive",
        });
      } else if (error.response?.status >= 500) {
        toast({
          title: "Error",
          description: "Server xatoligi. Keyinroq urinib ko'ring.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Internet aloqasini tekshiring.",
          variant: "destructive",
        });
      }
      setCode(["", "", "", "", "", ""]);
    } finally {
      setIsVerifying(false);
    }
  }, [code, isVerifying, phoneNumber, login, router, toast]);

  useEffect(() => {
    const enteredCode = code.join("");
    if (enteredCode.length === 6 && !isVerifying) {
      handleVerify();
    }
  }, [code, isVerifying, handleVerify]);

  const handleChange = (index, value, event) => {
    if (event.type === "paste") {
      const pastedData = event.clipboardData.getData("text").replace(/\D/g, "");
      if (pastedData.length === 6) {
        setCode(pastedData.split(""));
        inputRefs.current[5]?.focus();
        return;
      } else {
        toast({
          title: "Error",
          description: "Iltimos, 6 raqamli kodni kiriting!",
          variant: "destructive",
        });
        return;
      }
    }
    const newCode = [...code];
    newCode[index] = value.replace(/\D/g, "").slice(0, 1);
    setCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event, index) => {
    event.preventDefault();
    handleChange(index, event.clipboardData.getData("text"), event);
  };

  const handleTelegramRedirect = () => {
    window.open("https://t.me/ai_imzo_bot", "_blank");
  };

  const handleResendCode = async () => {
    try {
      setTimer(60);
      setCode(["", "", "", "", "", ""]);
      await axios.post("https://imzo-ai.uzjoylar.uz/users/resend-code", {
        phone_number: phoneNumber,
      });
      toast({
        title: "Success",
        description: "Kod qayta yuborildi",
      });
    } catch (error) {
      console.error("Resend code error:", error);
      toast({
        title: "Error",
        description: "Kod qayta yuborishda xatolik",
        variant: "destructive",
      });
    }
  };

  const handleModalOk = async () => {
    if (!fullName.trim()) {
      toast({
        title: "Error",
        description: "Iltimos, ismingizni kiriting!",
        variant: "destructive",
      });
      return;
    }
    try {
      const userId = localStorage.getItem("user_id");
      const accessToken = localStorage.getItem("access_token");

      if (!userId || !accessToken) {
        toast({
          title: "Error",
          description: "User ID or Access Token not found.",
          variant: "destructive",
        });
        return;
      }

      const response = await axios.put(
        `https://imzo-ai.uzjoylar.uz/users/update?id=${userId}`,
        {
          full_name: fullName,
          phone_number: phoneNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 200) {
        toast({
          title: "Success",
          description: "Ism muvaffaqiyatli saqlandi!",
        });
        setIsModalVisible(false);
        const updatedUserInfo = {
          id: userId,
          full_name: fullName,
          phone_number: phoneNumber,
          role: response.data.role,
          wallet: response.data.wallet,
          created_at: response.data.created_at,
        };
        login(updatedUserInfo, accessToken);
        if (updatedUserInfo.role === "admin") {
          router.push("/admin-dashboard");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error updating full name:", error);
      toast({
        title: "Error",
        description: "Ismni saqlashda xatolik yuz berdi!",
        variant: "destructive",
      });
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setFullName("");
    router.push("/login");
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex justify-center items-center bg-gray-900 px-4 min-h-screen">
      <div className="bg-gray-800 shadow-lg p-8 rounded-lg w-full max-w-md">
        <div className="mb-6 text-center">
          <h2 className="mb-4 font-bold text-white text-2xl">
            Telefon raqamini tasdiqlang
          </h2>
          <p className="block text-gray-400 text-center">
            <strong className="text-white">{phoneNumberWithFormat}</strong> raqamiga
            faollashtirish kodi bilan SMS yubordik.
          </p>
        </div>
        <div className="flex justify-center gap-2 mb-6">
          {code.map((digit, index) => (
            <input
              key={index}
              id={`code-input-${index}`}
              ref={(el) => (inputRefs.current[index] = el)}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={(e) => handlePaste(e, index)}
              maxLength={1}
              className="bg-gray-700 disabled:opacity-50 border border-gray-600 focus:border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 !w-[45px] !h-[50px] font-bold text-white text-lg text-center disabled:cursor-not-allowed"
              disabled={isVerifying}
            />
          ))}
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 mb-4 px-4 py-3 rounded-md w-full font-semibold text-white text-lg disabled:cursor-not-allowed"
          onClick={handleTelegramRedirect}
          disabled={isVerifying}
        >
          Telegram orqali yuborish
        </button>
        <div className="text-center">
          {timer > 0 ? (
            <p className="text-gray-400">
              Kodni qayta yuborish{" "}
              <span className="font-mono text-white">{formatTime(timer)}</span>
            </p>
          ) : (
            <button
              className="disabled:opacity-50 text-blue-400 hover:text-blue-300 disabled:cursor-not-allowed"
              onClick={handleResendCode}
              disabled={isVerifying}
            >
              Kodni qayta yuborish
            </button>
          )}
        </div>
        {isVerifying && (
          <div className="flex justify-center items-center mt-4 text-center">
            <Loader2 className="mr-2 w-5 h-5 text-gray-400 animate-spin" />
            <p className="text-gray-400">Tekshirilmoqda...</p>
          </div>
        )}
        <div className="mt-6 text-center">
          <button
            className="disabled:opacity-50 text-gray-400 hover:text-white disabled:cursor-not-allowed"
            onClick={() => router.push("/login")}
            disabled={isVerifying}
          >
            ← Orqaga qaytish
          </button>
        </div>

        {isModalVisible && (
          <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
            <div className="bg-gray-800 shadow-lg p-6 border border-gray-700 rounded-lg w-full max-w-md text-white">
              <div className="mb-4">
                <h3 className="font-semibold text-white text-lg">Ismingizni kiriting</h3>
                <p className="text-gray-400 text-sm">
                  Iltimos, to'liq ism va familiyangizni kiriting.
                </p>
              </div>
              <div className="mb-4">
                <label htmlFor="fullName" className="block mb-2 font-medium text-gray-400 text-sm">
                  Ism
                </label>
                <input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ism va familiyangizni kiriting"
                  className="bg-gray-700 px-3 py-2 border border-gray-600 focus:border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-white placeholder:text-gray-400"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleModalCancel}
                  className="hover:bg-gray-700 px-4 py-2 rounded-md text-gray-400 hover:text-white"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleModalOk}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-white"
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
