"use client";

import React, { useState, useEffect, useRef } from "react";
import { Layout, Input, Button, Typography, message, Select } from "antd";
import {
  PaperClipOutlined,
  SearchOutlined,
  AudioOutlined,
  SendOutlined,
} from "@ant-design/icons";
import axios from "axios";
import "../App.css";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/authContext";
import UserDropdown from "./userDropdown";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      uz: {
        translation: {
          chatgpt: "ChatGPT",
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
          agree: "ChatGPT bilan xabar yuborish orqali siz bizning",
          loginRequired: "Savollar berish uchun avval login qiling",
          failedtofetchchatrooms: "Chat xonalarini yuklashda xatolik",
          failedtofetchchathistory: "Chat tarixini yuklashda xatolik",
          failedtocreatechatroom: "Yangi chat yaratishda xatolik",
          pleasecreatechatroom: "Iltimos yangi chat yarating",
          failedtosendmessage: "Xabar yuborishda xatolik",
          rateLimitError: "Siz juda ko'p so'rov yuboryapsiz. Biroz kuting.",
          serverError: "Server xatoligi yuz berdi. Keyinroq qayta urinib ko'ring.",
          networkError: "Internet aloqasini tekshiring.",
        },
      },
      ru: {
        translation: {
          chatgpt: "ChatGPT",
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
          agree: "Отправляя сообщение ChatGPT, вы соглашаетесь с нашими",
          loginRequired: "Для отправки вопросов сначала войдите в систему",
          failedtofetchchatrooms: "Ошибка при загрузке чат-комнат",
          failedtofetchchathistory: "Ошибка при загрузке истории чата",
          failedtocreatechatroom: "Ошибка при создании нового чата",
          pleasecreatechatroom: "Пожалуйста, создайте новый чат",
          failedtosendmessage: "Ошибка при отправке сообщения",
          rateLimitError: "Слишком много запросов. Подождите немного.",
          serverError: "Произошла ошибка сервера. Попробуйте позже.",
          networkError: "Проверьте подключение к интернету.",
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

const API_BASE_URL = "https://backend.amur1.uz";

function Dashboard() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, refreshAccessToken } = useAuth();
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState([]);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newResponse, setNewResponse] = useState(null);
  const [displayedResponse, setDisplayedResponse] = useState({});
  const [userId] = useState(localStorage.getItem("user_id")); // Retrieve user_id from local storage
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
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
        } else if (error.response?.status >= 500) {
        } else if (!error.response) {
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
    if (isAuthenticated) {
      fetchChatRooms();
    }
  }, [isAuthenticated]);

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
          setTimeout(type, 50);
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
      if (error.response?.status !== 401) {
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async (roomId) => {
    if (!isAuthenticated) {
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
      if (error.response?.status !== 401) {
      }
    } finally {
      setLoading(false);
    }
  };

  const createChatRoom = async () => {
    if (!isAuthenticated) {
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
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    if (!isAuthenticated) {
      return;
    }

    if (!chatRoomId) {
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
      if (error.response?.status !== 401) {
      }
      setChatHistory((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const pollForResponse = async (requestId) => {
    const maxAttempts = 10;
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

  const TypingAnimation = () => (
    <div className="flex items-center space-x-1">
      <div className="bg-gray-400 rounded-full w-2 h-2 animate-bounce" style={{ animationDelay: "0s" }}></div>
      <div className="bg-gray-400 rounded-full w-2 h-2 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
      <div className="bg-gray-400 rounded-full w-2 h-2 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
    </div>
  );

  const renderAssistantResponse = (responseText) => {
    if (!responseText) return null;

    const sentences = responseText.split(/\n+/).filter((s) => s.trim());

    return sentences.map((sentence, index) => {
      let icon = null;
      let cleanSentence = sentence;
      let hasIcon = false;

      const emojiMatch = sentence.match(/^([\p{Emoji_Presentation}\p{Extended_Pictographic}]+)/u);
      if (emojiMatch) {
        icon = <span className="mr-2 text-gray-400">{emojiMatch[1]}</span>;
        cleanSentence = sentence.replace(emojiMatch[1], "").trim();
        hasIcon = true;
      }

      let boldText = cleanSentence;
      let regularText = "";
      if (hasIcon) {
        const periods = cleanSentence.split(".").filter((s) => s.trim());
        if (periods.length >= 2) {
          boldText = `${periods[0]}.${periods[1]}.`;
          regularText = periods.slice(2).join(".").trim();
        }
      }

      return (
        <div key={index} className={`flex ${hasIcon ? "mb-4" : "mb-2"}`}>
          {icon && <div className="mb-1">{icon}</div>}
          <div>
            {hasIcon && boldText && (
              <Text className="!text-white" strong>
                {boldText}
              </Text>
            )}
            {regularText && (
              <Text className="!text-gray-300">
                {regularText}
              </Text>
            )}
            {!hasIcon && (
              <Text className="!text-gray-300">
                {cleanSentence}
              </Text>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="bg-gray-900 h-screen overflow-hidden">
      <div className="flex justify-between items-center bg-gray-800 px-4 py-3 border-gray-700 border-b">
        <div className="flex items-center space-x-2">
          <Title level={4} className="!mb-0 !text-white">
            {t("chatgpt")}
          </Title>
        </div>
        <div className="flex items-center space-x-4">
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
        </div>
      </div>

      <Layout className="bg-gray-900 h-[92.3vh]">
        <Sider width={300} className="!bg-gray-800 border-gray-700 border-r">
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
          <div className="flex flex-col flex-1 p-8">
            <div
              className="flex-1 overflow-y-auto"
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
              {isAuthenticated && chatHistory.map((chat, index) => (
                <div key={index} className="mb-4 max-w-[80%]">
                  <div className="bg-gray-700 ml-auto p-3 rounded-lg">
                    <Text className="!text-white">
                      {t("you")} {chat.request}
                    </Text>
                  </div>
                  {chat.response && (
                    <div className="bg-gray-600 mt-2 mr-auto p-3 rounded-lg">
                      {renderAssistantResponse(displayedResponse[chat.request] || chat.response)}
                    </div>
                  )}
                </div>
              ))}
              {isAuthenticated && loading && (
                <div className="bg-gray-600 mr-auto p-3 rounded-lg max-w-[80%]">
                  <TypingAnimation />
                </div>
              )}
            </div>

            <div className="mt-4 w-full max-w-2xl">
              <div className="flex flex-col space-y-2">
                <TextArea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isAuthenticated ? t("askanything") : t("loginRequired")}
                  disabled={!isAuthenticated}
                  className="!bg-gray-700 !border-gray-600 !rounded-lg !text-white placeholder:!text-gray-400"
                  style={{
                    minHeight: "60px",
                    resize: "none",
                  }}
                  onPressEnter={(e) => {
                    if (!e.shiftKey && isAuthenticated) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="text"
                    icon={<PaperClipOutlined />}
                    className="!p-1 !text-gray-400 hover:!text-white"
                    size="small"
                    disabled={!isAuthenticated}
                  />
                  <Button
                    type="text"
                    icon={<SearchOutlined />}
                    className="!p-1 !text-gray-400 hover:!text-white"
                    size="small"
                    disabled={!isAuthenticated}
                  />
                  <Button
                    type="text"
                    icon={<AudioOutlined />}
                    className="!p-1 !text-gray-400 hover:!text-white"
                    size="small"
                    disabled={!isAuthenticated}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    className="!bg-green-600 hover:!bg-green-700 !p-1 !border-green-600"
                    size="small"
                    onClick={handleSend}
                    disabled={!message.trim() || loading || !isAuthenticated}
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

        <Sider width={300} className="!bg-gray-800 border-gray-700 border-l">
          <div className="p-4 h-full overflow-y-auto">
            <div className="flex items-center mb-4 text-red-400 text-sm">
              {t("chathistory")}
              <Button
                type="text"
                className="ml-2 !text-gray-300 hover:!text-white"
                onClick={createChatRoom}
                disabled={loading || !isAuthenticated}
              >
                {t("newchat")}
              </Button>
            </div>
            <div className="space-y-2">
              {isAuthenticated && conversations.map((conv) => (
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
                  <Text className="!text-gray-400">
                    {t("loginRequired")}
                  </Text>
                </div>
              )}
            </div>
          </div>
        </Sider>
      </Layout>
    </div>
  );
}

export default Dashboard;