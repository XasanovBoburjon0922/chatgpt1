import React, { useState, useEffect } from "react";
import { Layout, Input, Button, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authContext";

const { Content } = Layout;
const { Title, Text } = Typography;

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
      message.error("Please enter a valid 13-digit phone number.");
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[\s()-\.]/g, ""); 
    if (value.length <= 9) {
      let formattedValue = value;
      if (value.length > 2) {
        const firstPart = value.slice(0, 2); // 94
        const secondPart = value.slice(2, 5); // 708
        const thirdPart = value.slice(5, 7); // 09
        const fourthPart = value.slice(7, 9); // 22
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
    <div className="flex justify-center items-center bg-gray-900 px-4 min-h-screen">
      <Layout className="bg-gray-800 shadow-lg p-8 rounded-lg w-full max-w-md">
        <Content>
          <div className="mb-6 text-center">
            <Title level={2} className="!mb-2 !text-white">Kirish</Title>
            <Text className="!text-gray-400">
              Telefon raqamingizni kiriting va SMS orqali tasdiqlang
            </Text>
          </div>
          
          <div className="mb-6">
            <Input
              addonBefore={<span className="text-white">+998</span>}
              value={phone}
              onChange={handlePhoneChange}
              onKeyPress={handleKeyPress}
              placeholder="(94) 708-09-22"
              className="!bg-gray-700 !border-gray-600 !text-white placeholder:!text-gray-400"
              size="large"
              disabled={isLoading}
              style={{
                fontSize: '16px'
              }}
            />
            <Text className="block mt-1 !text-gray-500 text-xs">
              Misol: 94 708 09 22
            </Text>
          </div>
          
          <Button
            type="primary"
            block
            size="large"
            className="!bg-blue-600 hover:!bg-blue-700 !font-medium"
            onClick={handleLogin}
            loading={isLoading}
            disabled={phone.replace(/[\s()-\.]/g, "").length !== 9}
          >
            {isLoading ? "SMS yuborilmoqda..." : "Davom etish"}
          </Button>
          
          <div className="mt-6 text-center">
            <Text className="!text-gray-400 text-xs">
              Davom etish orqali siz{" "}
              <a href="#" className="!text-blue-400 hover:!text-blue-300">
                Foydalanish shartlari
              </a>{" "}
              va{" "}
              <a href="#" className="!text-blue-400 hover:!text-blue-300">
                Maxfiylik siyosati
              </a>
              ni qabul qilasiz.
            </Text>
          </div>
        </Content>
      </Layout>
    </div>
  );
}

export default LoginPage;