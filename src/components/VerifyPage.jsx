"use client";

import React, { useState, useEffect } from "react";
import { Layout, Input, Button, Typography, message, Avatar } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const { Content } = Layout;
const { Title, Text } = Typography;

function VerifyPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60); 
  const navigate = useNavigate();
  const location = useLocation();
  const phoneNumberWithFormat = location.state?.phone || "+998 94 708 09 22"; 
  const phoneNumber = `+${phoneNumberWithFormat.replace(/[^\d]/g, "")}`; 
  const [userInfo, setUserInfo] = useState(null);

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

  useEffect(() => {
    const enteredCode = code.join("");
    if (enteredCode.length === 6) {
      handleVerify();
    }
  }, [code]); 

  const handleChange = (index, value) => {
    const newCode = [...code];
    newCode[index] = value.replace(/\D/g, "").slice(0, 1);
    setCode(newCode);

    if (value && index < 5) {
      document.getElementById(`code-input-${index + 1}`).focus();
    }
  };

  const handleTelegramRedirect = () => {
    window.open("https://t.me/imzoai_bot", "_blank"); 
  };

  const handleVerify = async () => {
    const enteredCode = code.join("");
    if (enteredCode.length === 6) {
      try {
        const response = await axios.post("http://35.154.102.246:5050/users/verify-code", {
          code: parseInt(enteredCode),
          phone_number: phoneNumber,
        });
        if (response.status === 200) {
          if (response.data) {
            localStorage.setItem("access_token", response.data.token.access_token);
            localStorage.setItem("refresh_token", response.data.token.refresh_token);
            setUserInfo(response.data.userInfo);
            message.success("Muvaffiqiyatli kirildi!");
            navigate("/dashboard"); 
          } else if (response.data.valid === false) {
            message.error("Kech qoldingiz, qayta tezroq kod kiriting!");
            setCode(["", "", "", "", "", ""]);
          }
        }
      } catch (error) {
        console.error("API Error:", error);
        message.error("Failed to verify code. Check your connection.");
      }
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getInitial = () => {
    if (userInfo?.full_name) {
      return userInfo.full_name.charAt(0).toUpperCase();
    }
    return "";
  };

  return (
    <div className="flex justify-center items-center bg-gray-900 min-h-screen">
      <Layout className="bg-gray-800 shadow-lg p-8 rounded-lg w-full max-w-md">
        <Content>
          <div className="mb-6 text-center">
            <Title level={2} className="!text-white">Telefon raqamini tasdiqlang</Title>
            <Text className="!text-gray-400">
              {phoneNumberWithFormat} raqamiga faollashtirish kodi bilan SMS yubordik.
            </Text>
          </div>
          <div className="flex justify-center gap-2 mb-6">
            {code.map((digit, index) => (
              <Input
                key={index}
                id={`code-input-${index}`}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                maxLength={1}
                className="!bg-gray-700 !border-gray-600 !text-white text-center"
                size="large"
              />
            ))}
          </div>
          <Button
            type="primary"
            block
            size="large"
            className="!bg-blue-600 hover:!bg-blue-700"
            onClick={handleTelegramRedirect}
          >
            Telegram orqali yuborish
          </Button>
          <div className="mt-4 text-gray-400 text-center">
            {timer > 0 ? (
              <Text>Kodni qayta yuborish {formatTime(timer)}</Text>
            ) : (
              <Text>Kodni qayta yuborish</Text>
            )}
          </div>
          {userInfo && (
            <div className="mt-6 text-center">
              <Avatar size={40} style={{ backgroundColor: "#1890ff" }}>
                {getInitial()}
              </Avatar>
            </div>
          )}
        </Content>
      </Layout>
    </div>
  );
}

export default VerifyPage;