import React, { useState } from "react";
import { Layout, Input, Button, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";

const { Content } = Layout;
const { Title, Text } = Typography;

function LoginPage() {
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();

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

  return (
    <div className="flex justify-center items-center bg-gray-900 min-h-screen">
      <Layout className="bg-gray-800 shadow-lg p-8 rounded-lg w-full max-w-md">
        <Content>
          <div className="mb-6 text-center">
            <Title level={2} className="!text-white">Kirish</Title>
            <Text className="!text-gray-400">Telefon raqamingizni kiriting</Text>
          </div>
          <Input
            addonBefore="+998"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="-- --- -- --"
            className="!bg-gray-700 mb-6 !border-gray-600 !text-white placeholder:!text-gray-400"
            size="large"
          />
          <Button
            type="primary"
            block
            size="large"
            className="!bg-blue-600 hover:!bg-blue-700"
            onClick={handleLogin}
          >
            Davom etish
          </Button>
        </Content>
      </Layout>
    </div>
  );
}

export default LoginPage;