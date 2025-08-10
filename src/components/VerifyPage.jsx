"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Layout, Input, Button, Typography, message, Modal } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import axios from "axios";

const { Content } = Layout;
const { Title, Text } = Typography;

function VerifyPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
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
    if (enteredCode.length !== 6 || isVerifying) return;

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
          if (!response.data.userInfo.full_name) {
            setIsModalVisible(true);
          } else {
            login(response.data.userInfo, response.data.token);
            message.success("Muvaffaqiyatli kirildi!");
            navigate("/dashboard");
          }
        } else if (response.data.valid === false) {
          message.error("Kod noto'g'ri yoki muddati o'tgan!");
          setCode(["", "", "", "", "", ""]);
        }
      }
    } catch (error) {
      console.error("Verification error:", error);
      if (error.response?.status === 400) {
        message.error("Kod noto'g'ri yoki muddati o'tgan!");
      } else if (error.response?.status === 429) {
        message.error("Juda ko'p urinish. Biroz kuting.");
      } else if (error.response?.status >= 500) {
        message.error("Server xatoligi. Keyinroq urinib ko'ring.");
      } else {
        message.error("Internet aloqasini tekshiring.");
      }
      setCode(["", "", "", "", "", ""]);
    } finally {
      setIsVerifying(false);
    }
  }, [code, isVerifying, phoneNumber, login, navigate]);

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
        document.getElementById(`code-input-5`)?.focus();
        return;
      } else {
        message.error("Iltimos, 6 raqamli kodni kiriting!");
        return;
      }
    }

    const newCode = [...code];
    newCode[index] = value.replace(/\D/g, "").slice(0, 1);
    setCode(newCode);

    if (value && index < 5) {
      document.getElementById(`code-input-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      document.getElementById(`code-input-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (event, index) => {
    event.preventDefault();
    handleChange(index, event.clipboardData.getData("text"), event);
  };

  const handleTelegramRedirect = () => {
    window.open("https://t.me/imzoai_bot", "_blank");
  };

  const handleResendCode = async () => {
    try {
      setTimer(60);
      setCode(["", "", "", "", "", ""]);
      await axios.post("https://imzo-ai.uzjoylar.uz/users/resend-code", {
        phone_number: phoneNumber,
      });
      message.success("Kod qayta yuborildi");
    } catch (error) {
      console.error("Resend code error:", error);
      message.error("Kod qayta yuborishda xatolik");
    }
  };

  const handleModalOk = async () => {
    if (!fullName.trim()) {
      message.error("Iltimos, ismingizni kiriting!");
      return;
    }
    try {
      const userId = localStorage.getItem("user_id");
      await axios.put(`https://imzo-ai.uzjoylar.uz/users/update?id=${userId}`, {
        full_name: fullName,
        phone_number: phoneNumber,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      message.success("Ism muvaffaqiyatli saqlandi!");
      setIsModalVisible(false);
      login({ id: userId, full_name: fullName, phone_number: phoneNumber }, localStorage.getItem("access_token"));
      navigate("/dashboard");
    } catch (error) {
      console.error("Error updating full name:", error);
      message.error("Ismni saqlashda xatolik yuz berdi!");
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setFullName("");
    navigate("/login");
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex justify-center items-center bg-gray-900 px-4 min-h-screen">
      <Layout className="bg-gray-800 shadow-lg p-8 rounded-lg w-full max-w-md">
        <Content>
          <div className="mb-6 text-center">
            <Title level={2} className="!mb-4 !text-white">
              Telefon raqamini tasdiqlang
            </Title>
            <Text className="block !text-gray-400 text-center">
              <strong className="!text-white">{phoneNumberWithFormat}</strong> raqamiga
              faollashtirish kodi bilan SMS yubordik.
            </Text>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            {code.map((digit, index) => (
              <Input
                key={index}
                id={`code-input-${index}`}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value, e)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={(e) => handlePaste(e, index)}
                maxLength={1}
                className="!bg-gray-700 !border-gray-600 !font-bold !text-white !text-lg text-center"
                size="large"
                style={{
                  width: "45px",
                  height: "50px",
                  fontSize: "18px",
                  textAlign: "center",
                }}
                disabled={isVerifying}
              />
            ))}
          </div>

          <Button
            type="primary"
            block
            size="large"
            className="!bg-blue-600 hover:!bg-blue-700 !mb-4"
            onClick={handleTelegramRedirect}
            disabled={isVerifying}
          >
            Telegram orqali yuborish
          </Button>

          <div className="text-center">
            {timer > 0 ? (
              <Text className="!text-gray-400">
                Kodni qayta yuborish <span className="font-mono !text-white">{formatTime(timer)}</span>
              </Text>
            ) : (
              <Button
                type="link"
                className="!p-0 !text-blue-400 hover:!text-blue-300"
                onClick={handleResendCode}
                disabled={isVerifying}
              >
                Kodni qayta yuborish
              </Button>
            )}
          </div>

          {isVerifying && (
            <div className="mt-4 text-center">
              <Text className="!text-gray-400">Tekshirilmoqda...</Text>
            </div>
          )}

          <div className="mt-6 text-center">
            <Button
              type="text"
              className="!text-gray-400 hover:!text-white"
              onClick={() => navigate("/login")}
              disabled={isVerifying}
            >
              ← Orqaga qaytish
            </Button>
          </div>

          <Modal
            title="Ismingizni kiriting"
            open={isModalVisible}
            onOk={handleModalOk}
            onCancel={handleModalCancel}
            okText="Saqlash"
            cancelText="Bekor qilish"
            okButtonProps={{
              className: "!bg-blue-600 hover:!bg-blue-700",
            }}
            cancelButtonProps={{
              className: "!text-gray-400 hover:!text-white",
            }}
          >
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ism va familiyangizni kiriting"
              className="!bg-gray-700 !border-gray-600 !text-white placeholder:!text-gray-400"
              size="large"
            />
          </Modal>
        </Content>
      </Layout>
    </div>
  );
}

export default VerifyPage;