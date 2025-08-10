"use client";

import React, { useState, useEffect, useRef } from "react";
import { Layout, Input, Button, Typography, Select, Modal, Drawer } from "antd";
import {
  PaperClipOutlined,
  SearchOutlined,
  AudioOutlined,
  SendOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import axios from "axios";
import "../App.css";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/authContext";
import UserDropdown from "./userDropdown";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

i18n.use(initReactI18next).init({
  resources: {
    uz: {
      translation: {
        chatgpt: "Imzo Ai",
        login: "Kirish",
        signup: "Bepul ro'yxatdan o'tish",
        pdf: "PDF",
        uploadpdf: "PDF yuklash",
        askanything: "Har qanday savol bering",
        you: "Siz:",
        newchat: "Yangi chat",
        chathistory: "Chat tarixi",
        terms: "Shartlar",
        privacy: "Maxfiylik siyosati",
        agree: "Imzo Ai bilan xabar yuborish orqali siz bizning",
        loginRequired: "Savollar berish uchun avval login qiling",
        failedtocreatechatroom: "Yangi chat yaratishda xatolik",
        pleasecreatechatroom: "Iltimos yangi chat yarating",
        failedtosendmessage: "Xabar yuborishda xatolik",
        rateLimitError: "Siz juda ko'p so'rov yuboryapsiz. Biroz kuting.",
        serverError: "Server xatoligi yuz berdi. Keyinroq qayta urinib ko'ring.",
        networkError: "Internet aloqasini tekshiring.",
        enterName: "Ismingizni kiriting",
        save: "Saqlash",
        cancel: "Bekor qilish",
        nameRequired: "Iltimos, ismingizni kiriting!",
        nameUpdateError: "Ismni saqlashda xatolik yuz berdi!",
      },
    },
    ru: {
      translation: {
        chatgpt: "Imzo Ai",
        login: "Вход",
        signup: "Бесплатная регистрация",
        pdf: "PDF",
        uploadpdf: "Загрузить PDF",
        askanything: "Задайте любой вопрос",
        you: "Вы:",
        newchat: "Новый чат",
        chathistory: "История чатов",
        terms: "Условия",
        privacy: "Политика конфиденциальности",
        agree: "Отправляя сообщение Imzo Ai, вы соглашаетесь с нашими",
        loginRequired: "Для отправки вопросов сначала войдите в систему",
        failedtocreatechatroom: "Ошибка при создании нового чата",
        pleasecreatechatroom: "Пожалуйста, создайте новый чат",
        failedtosendmessage: "Ошибка при отправке сообщения",
        rateLimitError: "Слишком много запросов. Подождите немного.",
        serverError: "Произошла ошибка сервера. Попробуйте позже.",
        networkError: "Проверьте подключение к интернету.",
        enterName: "Введите ваше имя",
        save: "Сохранить",
        cancel: "Отмена",
        nameRequired: "Пожалуйста, введите ваше имя!",
        nameUpdateError: "Ошибка при сохранении имени!",
      },
    },
  },
  lng: "uz",
  fallbackLng: "uz",
  interpolation: {
    escapeValue: false,
  },
});

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const API_BASE_URL = "https://imzo-ai.uzjoylar.uz";

function Dashboard() {
  const { t } = useTranslation();
  const { isAuthenticated, user, login, refreshAccessToken } = useAuth();
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState([]);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newResponse, setNewResponse] = useState(null);
  const [displayedResponse, setDisplayedResponse] = useState({});
  const [userId] = useState(localStorage.getItem("user_id"));
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [fullName, setFullName] = useState("");
  const [isPdfDrawerVisible, setIsPdfDrawerVisible] = useState(false);
  const [isHistoryDrawerVisible, setIsHistoryDrawerVisible] = useState(false);
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const togglePdfDrawer = () => {
    setIsPdfDrawerVisible(!isPdfDrawerVisible);
  };

  const toggleHistoryDrawer = () => {
    setIsHistoryDrawerVisible(!isHistoryDrawerVisible);
  };

  useEffect(() => {
    if (isAuthenticated && user && !user.full_name) {
      setIsModalVisible(true);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await refreshAccessToken();
            return axios(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }

        if (error.response?.status === 429) {
          toast.error(t("rateLimitError"), { theme: "dark", position: "top-center" });
        } else if (!error.response) {
          toast.error(t("networkError"), { theme: "dark", position: "top-center" });
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [refreshAccessToken, t]);

  useEffect(() => {
    if (isAuthenticated && user?.full_name) {
      fetchChatRooms();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, displayedResponse]);

  useEffect(() => {
    if (newResponse?.request && newResponse?.response) {
      let currentText = "";
      const fullText = newResponse.response;
      const request = newResponse.request;
      let index = 0;

      const type = () => {
        if (index < fullText.length) {
          const step = Math.min(4 + Math.floor(Math.random() * 2), fullText.length - index);
          currentText += fullText.slice(index, index + step);
          setDisplayedResponse((prev) => ({ ...prev, [request]: currentText }));
          index += step;
          setTimeout(type, 30);
        } else {
          setNewResponse(null);
        }
      };
      type();
    }
  }, [newResponse]);

  const fetchChatRooms = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/chat/user_id?id=${userId}`);
      const { chat_rooms } = response.data;
      setConversations(chat_rooms.map((room) => ({ id: room.id, title: room.title })));
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async (roomId) => {
    if (!isAuthenticated || !user?.full_name) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/chat/message?id=${roomId}`);
      const history = response.data.chats || [];
      setChatHistory(history);
      setChatRoomId(roomId);
      setDisplayedResponse(
        history.reduce((acc, chat) => {
          if (chat.response) {
            acc[chat.request] = chat.response;
          }
          return acc;
        }, {})
      );
      setNewResponse(null);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    } finally {
      setLoading(false);
    }
  };

  const createChatRoom = async () => {
    if (!isAuthenticated || !user?.full_name) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/chat/room/create`, { user_id: userId });
      const newRoomId = response.data;
      await fetchChatRooms();
      setChatRoomId(newRoomId);
      setChatHistory([]);
      setDisplayedResponse({});
      setNewResponse(null);
    } catch (error) {
      console.error("Error creating chat room:", error);
      if (error.response?.status !== 401) {
        toast.error(t("failedtocreatechatroom"), { theme: "dark", position: "top-center" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !isAuthenticated || !user?.full_name) {
      if (!user?.full_name) {
        setIsModalVisible(true);
      }
      return;
    }

    if (!chatRoomId) {
      toast.error(t("pleasecreatechatroom"), { theme: "dark", position: "top-center" });
      return;
    }

    const newMessage = { request: message, response: null };
    setChatHistory([...chatHistory, newMessage]);
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/ask`, {
        chat_room_id: chatRoomId,
        request: message,
      });
      const requestId = response.data;

      const responseData = await pollForResponse(requestId);
      const updatedMessage = { request: message, response: responseData.responce };
      setChatHistory((prev) => [...prev.slice(0, -1), updatedMessage]);
      setNewResponse(updatedMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      if (error.response?.status === 500 && error.response.data?.error === "kunlik request limiti tugadi") {
        toast.error(error.response.data.error, { theme: "dark", position: "top-center" });
      } else if (error.response?.status !== 401) {
        toast.error(t("failedtosendmessage"), { theme: "dark", position: "top-center" });
      }
      setChatHistory((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const pollForResponse = async (requestId) => {
    const maxAttempts = 1000;
    const delay = 2000;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(`${API_BASE_URL}/get/responce?id=${requestId}`);
        if (response.status === 200 && response.data.responce) {
          return response.data;
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    throw new Error("Response not received in time");
  };

  const handleModalOk = async () => {
    if (!fullName.trim()) {
      toast.error(t("nameRequired"), { theme: "dark", position: "top-center" });
      return;
    }
    try {
      await axios.post(`https://imzo-ai.uzjoylar.uz/users/update?id=${userId}`, {
        full_name: fullName,
        phone_number: user.phone_number,
      });
      toast.success(t("save"), { theme: "dark", position: "top-center" });
      setIsModalVisible(false);
      login({ ...user, full_name: fullName }, localStorage.getItem("access_token"));
      setFullName("");
    } catch (error) {
      console.error("Error updating full name:", error);
      toast.error(t("nameUpdateError"), { theme: "dark", position: "top-center" });
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setFullName("");
    navigate("/login");
  };

  const TypingAnimation = () => (
    <div className="flex items-center space-x-2">
      <div className="bg-gray-300 rounded-full w-2.5 h-2.5 typing-dot"></div>
      <div className="bg-gray-300 rounded-full w-2.5 h-2.5 typing-dot"></div>
      <div className="bg-gray-300 rounded-full w-2.5 h-2.5 typing-dot"></div>
    </div>
  );

  const renderAssistantResponse = (responseText) => {
    if (!responseText) return null;

    const lines = responseText.split(/\n+/).filter((line) => line.trim());

    return lines.map((line, index) => {
      let formattedLine = line;
      formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      formattedLine = formattedLine.replace(/\*(.*?)\*/g, "<em>$1</em>");
      const isListItem = line.trim().startsWith("- ") || line.trim().startsWith("* ");
      if (isListItem) {
        formattedLine = formattedLine.replace(/^[-*]\s+/, "");
        return (
          <li key={index} className="ml-4 text-gray-200">
            <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
          </li>
        );
      }

      return (
        <p key={index} className="mb-2 text-gray-200">
          <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
        </p>
      );
    });
  };

  return (
    <div className="bg-gray-900 h-screen overflow-hidden">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover
        theme="dark"
        toastClassName="chatgpt-toast"
      />
      <div className="flex justify-between items-center bg-gray-800 px-4 py-3 border-gray-700 border-b">
        <div className="flex items-center space-x-2">
          <Button
            type="text"
            icon={<MenuOutlined />}
            className="md:!hidden !text-white"
            onClick={togglePdfDrawer}
          />
          <Title level={4} className="!mb-0 !text-white">
            {t("chatgpt")}
          </Title>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          {isAuthenticated ? (
            <UserDropdown />
          ) : (
            <Button
              type="primary"
              className="!bg-blue-600 hover:!bg-blue-700"
              onClick={() => navigate("/login")}
            >
              {t("login")}
            </Button>
          )}
          <Select
            defaultValue="uz"
            style={{ width: 70 }}
            onChange={changeLanguage}
            className="!bg-gray-700 !text-white"
          >
            <Option value="uz">UZ</Option>
            <Option value="ru">RU</Option>
          </Select>
          <Button
            type="text"
            icon={<MenuOutlined />}
            className="md:!hidden !text-white"
            onClick={toggleHistoryDrawer}
          />
        </div>
      </div>

      <Layout className="bg-gray-900 h-[92.3vh]">
        <Drawer
          title={t("pdf")}
          placement="left"
          onClose={() => setIsPdfDrawerVisible(false)}
          open={isPdfDrawerVisible}
          className="md:!hidden"
          bodyStyle={{ background: "#1f2937", padding: 0 }}
          width="80%"
        >
          <div className="p-4 h-full overflow-y-auto">
            <div className="mb-4 text-red-400 text-sm">{t("pdf")}</div>
            <div className="space-y-2">
              <div className="flex justify-center items-center bg-gray-700 border-2 border-gray-600 border-dashed rounded h-32">
                <Text className="!text-gray-400 text-center">{t("uploadpdf")}</Text>
              </div>
            </div>
          </div>
        </Drawer>

        <Sider width={300} className="hidden md:block !bg-gray-800 border-gray-700 border-r">
          <div className="p-4 h-full overflow-y-auto">
            <div className="mb-4 text-red-400 text-sm">{t("pdf")}</div>
            <div className="space-y-2">
              <div className="flex justify-center items-center bg-gray-700 border-2 border-gray-600 border-dashed rounded h-32">
                <Text className="!text-gray-400 text-center">{t("uploadpdf")}</Text>
              </div>
            </div>
          </div>
        </Sider>

        <Content className="flex flex-col h-[100vh]">
          <div className="flex flex-col flex-1 p-4 md:p-8">
            <div
              className="flex-1 overflow-y-auto chat-history"
              ref={chatContainerRef}
              style={{ maxHeight: "calc(100vh - 230px)" }}
            >
              {!isAuthenticated && (
                <div className="flex flex-col justify-center items-center h-full">
                  <div className="mb-8 text-center">
                    <Title level={3} className="mb-4 !text-gray-300">
                      {t("loginRequired")}
                    </Title>
                    <Button
                      type="primary"
                      size="large"
                      className="!bg-blue-600 hover:!bg-blue-700"
                      onClick={() => navigate("/login")}
                    >
                      {t("login")}
                    </Button>
                  </div>
                </div>
              )}
              {isAuthenticated &&
                chatHistory.map((chat, index) => (
                  <div key={index} className="mb-4 md:mb-6 max-w-[90%] md:max-w-[80%] message-enter">
                    <div className="chat-message-user">
                      <Text className="font-medium !text-white">
                        {t("you")} {chat.request}
                      </Text>
                    </div>
                    {chat.response && (
                      <div className="chat-message-assistant">
                        <div className="text-gray-200">
                          {renderAssistantResponse(displayedResponse[chat.request] || chat.response)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              {isAuthenticated && loading && (
                <div className="chat-message-assistant">
                  <TypingAnimation />
                </div>
              )}
            </div>

            <div className="mx-auto mt-4 w-full max-w-full md:max-w-3xl">
              <div className="chat-input-container">
                <TextArea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isAuthenticated && user?.full_name ? t("askanything") : t("enterName")}
                  disabled={!isAuthenticated || !user?.full_name}
                  className="!bg-transparent !border-none focus:ring-0 !text-white placeholder:!text-gray-400"
                  style={{
                    minHeight: "40px",
                    resize: "none",
                    padding: "8px",
                    fontSize: "14px",
                    lineHeight: "1.5",
                  }}
                  onPressEnter={(e) => {
                    if (!e.shiftKey && isAuthenticated && user?.full_name) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <div className="flex space-x-1 md:space-x-2">
                  <Button
                    type="text"
                    icon={<PaperClipOutlined />}
                    className="!p-2 !text-gray-500 hover:!text-gray-300 disabled:!text-gray-600"
                    size="small"
                    disabled
                  />
                  <Button
                    type="text"
                    icon={<SearchOutlined />}
                    className="!p-2 !text-gray-500 hover:!text-gray-300 disabled:!text-gray-600"
                    size="small"
                    disabled
                  />
                  <Button
                    type="text"
                    icon={<AudioOutlined />}
                    className="!p-2 !text-gray-500 hover:!text-gray-300 disabled:!text-gray-600"
                    size="small"
                    disabled
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    className="!bg-green-600 hover:!bg-green-700 !p-2 !border-none btn-hover-effect"
                    size="small"
                    onClick={handleSend}
                    disabled={!message.trim() || loading || !isAuthenticated || !user?.full_name}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-gray-700 border-t text-gray-400 text-xs text-center">
            {t("agree")}{" "}
            <a href="#" className="text-blue-400 hover:text-blue-300">
              {t("terms")}
            </a>{" "}
            and have read our{" "}
            <a href="#" className="text-blue-400 hover:text-blue-300">
              {t("privacy")}
            </a>
            .
          </div>
        </Content>

        <Sider width={300} className="hidden md:block !bg-gray-800 border-gray-700 border-l">
          <div className="p-4 h-full overflow-y-auto">
            <div className="flex items-center mb-4 text-red-400 text-sm">
              {t("chathistory")}
              <Button
                type="text"
                className="ml-2 !text-gray-300 hover:!text-white"
                onClick={createChatRoom}
                disabled={loading || !isAuthenticated || !user?.full_name}
              >
                {t("newchat")}
              </Button>
            </div>
            <div className="space-y-2">
              {isAuthenticated &&
                user?.full_name &&
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`bg-gray-700 hover:bg-gray-600 p-3 rounded transition-colors cursor-pointer ${
                      chatRoomId === conv.id ? "bg-gray-600" : ""
                    }`}
                    onClick={() => fetchChatHistory(conv.id)}
                  >
                    <Text className="!text-gray-300 text-sm">{conv.title}</Text>
                  </div>
                ))}
              {!isAuthenticated && (
                <div className="mt-8 text-gray-400 text-sm text-center">
                  <Text className="!text-gray-400">{t("loginRequired")}</Text>
                </div>
              )}
            </div>
          </div>
        </Sider>

        <Drawer
          title={t("chathistory")}
          placement="right"
          onClose={() => setIsHistoryDrawerVisible(false)}
          open={isHistoryDrawerVisible}
          className="md:!hidden"
          bodyStyle={{ background: "#1f2937", padding: 0 }}
          width="80%"
        >
          <div className="p-4 h-full overflow-y-auto">
            <div className="flex items-center mb-4 text-red-400 text-sm">
              {t("chathistory")}
              <Button
                type="text"
                className="ml-2 !text-gray-300 hover:!text-white"
                onClick={createChatRoom}
                disabled={loading || !isAuthenticated || !user?.full_name}
              >
                {t("newchat")}
              </Button>
            </div>
            <div className="space-y-2">
              {isAuthenticated &&
                user?.full_name &&
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`bg-gray-700 hover:bg-gray-600 p-3 rounded transition-colors cursor-pointer ${
                      chatRoomId === conv.id ? "bg-gray-600" : ""
                    }`}
                    onClick={() => {
                      fetchChatHistory(conv.id);
                      setIsHistoryDrawerVisible(false);
                    }}
                  >
                    <Text className="!text-gray-300 text-sm">{conv.title}</Text>
                  </div>
                ))}
              {!isAuthenticated && (
                <div className="mt-8 text-gray-400 text-sm text-center">
                  <Text className="!text-gray-400">{t("loginRequired")}</Text>
                </div>
              )}
            </div>
          </div>
        </Drawer>
      </Layout>

      <Modal
        title={t("enterName")}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText={t("save")}
        cancelText={t("cancel")}
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
          placeholder={t("enterName")}
          className="!bg-gray-700 !border-gray-600 !text-white placeholder:!text-gray-400"
          size="large"
        />
      </Modal>
    </div>
  );
}

export default Dashboard;