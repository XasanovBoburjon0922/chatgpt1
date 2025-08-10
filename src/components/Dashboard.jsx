"use client";

import React, { useState, useEffect, useRef } from "react";
import { Layout, Input, Button, Typography, Select, Modal, Drawer, Form, DatePicker, Divider } from "antd";
import {
  PaperClipOutlined,
  SearchOutlined,
  AudioOutlined,
  SendOutlined,
  MenuOutlined,
  EditOutlined,
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
import moment from "moment";

i18n.use(initReactI18next).init({
  resources: {
    uz: {
      translation: {
        chatgpt: "Imzo Ai",
        login: "Kirish",
        signup: "Bepul ro'yxatdan o'tish",
        pdf: "Ariza yaratish",
        writeApplication: "Ariza yozish",
        generateApplication: "Ariza PDF yaratish",
        downloadApplication: "Arizani yuklab olish",
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
        tokenError: "Autentifikatsiya tokeni topilmadi. Iltimos, qayta login qiling.",
        enterName: "Ismingizni kiriting",
        save: "Saqlash",
        cancel: "Bekor qilish",
        nameRequired: "Iltimos, ismingizni kiriting!",
        nameUpdateError: "Ismni saqlashda xatolik yuz berdi!",
        applicationDate: "Ariza sanasi",
        certificateNumber: "Sertifikat raqami",
        childBirthDate: "Bola tug'ilgan sana",
        childCertificate: "Bola sertifikati",
        childFhdyo: "Bola FHDI",
        childFullName: "Bola to'liq ismi",
        claimantAddress: "Ariza beruvchi manzili",
        claimantEmail: "Ariza beruvchi email",
        claimantFullName: "Ariza beruvchi to'liq ismi",
        claimantPhone: "Ariza beruvchi telefon",
        courtName: "Sud nomi",
        divorceReason: "Ajralish sababi",
        fhdyoOffice: "FHDI ofisi",
        marriageDate: "Nikoh sanasi",
        respondentAddress: "Javobgar manzili",
        respondentEmail: "Javobgar email",
        respondentFullName: "Javobgar to'liq ismi",
        respondentPhone: "Javobgar telefon",
        generatePdfSuccess: "Ariza muvaffaqiyatli yaratildi va yuklab olindi!",
        generatePdfError: "Ariza PDF yaratishda xatolik yuz berdi!",
        claimantInfo: "Ariza beruvchi haqida",
        respondentInfo: "Javobgar haqida",
        childInfo: "Bola haqida",
        marriageInfo: "Nikoh haqida",
        otherInfo: "Boshqa ma'lumotlar",
      },
    },
    ru: {
      translation: {
        chatgpt: "Imzo Ai",
        login: "Вход",
        signup: "Бесплатная регистрация",
        pdf: "Создать заявление",
        writeApplication: "Написать заявление",
        generateApplication: "Создать PDF заявления",
        downloadApplication: "Скачать заявление",
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
        tokenError: "Токен аутентификации не найден. Пожалуйста, войдите снова.",
        enterName: "Введите ваше имя",
        save: "Сохранить",
        cancel: "Отмена",
        nameRequired: "Пожалуйста, введите ваше имя!",
        nameUpdateError: "Ошибка при сохранении имени!",
        applicationDate: "Дата заявления",
        certificateNumber: "Номер сертификата",
        childBirthDate: "Дата рождения ребенка",
        childCertificate: "Сертификат ребенка",
        childFhdyo: "ФХДУ ребенка",
        childFullName: "Полное имя ребенка",
        claimantAddress: "Адрес заявителя",
        claimantEmail: "Email заявителя",
        claimantFullName: "Полное имя заявителя",
        claimantPhone: "Телефон заявителя",
        courtName: "Название суда",
        divorceReason: "Причина развода",
        fhdyoOffice: "Офис ФХДУ",
        marriageDate: "Дата брака",
        respondentAddress: "Адрес ответчика",
        respondentEmail: "Email ответчика",
        respondentFullName: "Полное имя ответчика",
        respondentPhone: "Телефон ответчика",
        generatePdfSuccess: "Заявление успешно создано и скачано!",
        generatePdfError: "Ошибка при создании PDF заявления!",
        claimantInfo: "Информация о заявителе",
        respondentInfo: "Информация об ответчике",
        childInfo: "Информация о ребенке",
        marriageInfo: "Информация о браке",
        otherInfo: "Другая информация",
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

const Header = ({ t, isAuthenticated, navigate, changeLanguage, togglePdfDrawer, toggleHistoryDrawer }) => (
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
);

const ChatInput = ({ message, setMessage, isAuthenticated, user, loading, handleSend, t }) => (
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
);

const TypingAnimation = () => (
  <div className="flex items-center space-x-2">
    <div className="bg-gray-300 rounded-full w-2.5 h-2.5 typing-dot"></div>
    <div className="bg-gray-300 rounded-full w-2.5 h-2.5 typing-dot"></div>
    <div className="bg-gray-300 rounded-full w-2.5 h-2.5 typing-dot"></div>
  </div>
);

const ApplicationForm = ({ form, handleGeneratePdf, loading, t }) => (
  <Form
    form={form}
    layout="vertical"
    onFinish={handleGeneratePdf}
    className="bg-gray-700 p-4 rounded-lg"
  >
    <Divider className="text-gray-300">{t("claimantInfo")}</Divider>
    <Form.Item
      name="claimant_full_name"
      label={<span className="text-gray-300">{t("claimantFullName")}</span>}
    >
      <Input
        className="!bg-gray-600 !border-gray-500 !text-white placeholder:!text-gray-400"
        placeholder={t("claimantFullName")}
      />
    </Form.Item>
    <Form.Item
      name="claimant_address"
      label={<span className="text-gray-300">{t("claimantAddress")}</span>}
    >
      <Input
        className="!bg-gray-600 !border-gray-500 !text-white placeholder:!text-gray-400"
        placeholder={t("claimantAddress")}
      />
    </Form.Item>
    <Form.Item
      name="claimant_phone"
      label={<span className="text-gray-300">{t("claimantPhone")}</span>}
    >
      <Input
        className="!bg-gray-600 !border-gray-500 !text-white placeholder:!text-gray-400"
        placeholder={t("claimantPhone")}
      />
    </Form.Item>
    <Form.Item
      name="claimant_email"
      label={<span className="text-gray-300">{t("claimantEmail")}</span>}
    >
      <Input
        className="!bg-gray-600 !border-gray-500 !text-white placeholder:!text-gray-400"
        placeholder={t("claimantEmail")}
      />
    </Form.Item>

    <Divider className="text-gray-300">{t("respondentInfo")}</Divider>
    <Form.Item
      name="respondent_full_name"
      label={<span className="text-gray-300">{t("respondentFullName")}</span>}
    >
      <Input
        className="!bg-gray-600 !border-gray-500 !text-white placeholder:!text-gray-400"
        placeholder={t("respondentFullName")}
      />
    </Form.Item>
    <Form.Item
      name="respondent_address"
      label={<span className="text-gray-300">{t("respondentAddress")}</span>}
    >
      <Input
        className="!bg-gray-600 !border-gray-500 !text-white placeholder:!text-gray-400"
        placeholder={t("respondentAddress")}
      />
    </Form.Item>
    <Form.Item
      name="respondent_phone"
      label={<span className="text-gray-300">{t("respondentPhone")}</span>}
    >
      <Input
        className="!bg-gray-600 !border-gray-500 !text-white placeholder:!text-gray-400"
        placeholder={t("respondentPhone")}
      />
    </Form.Item>
    <Form.Item
      name="respondent_email"
      label={<span className="text-gray-300">{t("respondentEmail")}</span>}
    >
      <Input
        className="!bg-gray-600 !border-gray-500 !text-white placeholder:!text-gray-400"
        placeholder={t("respondentEmail")}
      />
    </Form.Item>

    <Divider className="text-gray-300">{t("childInfo")}</Divider>
    <Form.Item
      name="child_full_name"
      label={<span className="text-gray-300">{t("childFullName")}</span>}
    >
      <Input
        className="!bg-gray-600 !border-gray-500 !text-white placeholder:!text-gray-400"
        placeholder={t("childFullName")}
      />
    </Form.Item>
    <Form.Item
      name="child_birth_date"
      label={<span className="text-gray-300">{t("childBirthDate")}</span>}
    >
      <DatePicker
        format="YYYY-MM-DD"
        className="!bg-gray-600 !border-gray-500 !text-white placeholder:!text-gray-400"
        placeholder={t("childBirthDate")}
      />
    </Form.Item>
    <Form.Item
      name="child_certificate"
      label={<span className="text-gray-300">{t("childCertificate")}</span>}
    >
      <Input
        className="!bg-gray-600 !border-gray-500 !text-white placeholder:!text-gray-400"
        placeholder={t("childCertificate")}
      />
    </Form.Item>
    <Form.Item
      name="child_fhdyo"
      label={<span className="text-gray-300">{t("childFhdyo")}</span>}
    >
      <Input
        className="!bg-gray-600 !border-gray-500 !text-white placeholder:!text-gray-400"
        placeholder={t("childFhdyo")}
      />
    </Form.Item>

    <Divider className="text-gray-300">{t("marriageInfo")}</Divider>
    <Form.Item
      name="marriage_date"
      label={<span className="text-gray-300">{t("marriageDate")}</span>}
    >
      <DatePicker
        format="YYYY-MM-DD"
        className="!bg-gray-600 !border-gray-500 !text-white placeholder:!text-gray-400"
        placeholder={t("marriageDate")}
      />
    </Form.Item>
    <Form.Item
      name="certificate_number"
      label={<span className="text-gray-300">{t("certificateNumber")}</span>}
    >
      <Input
        className="!bg-gray-600 !border-gray-500 !text-white placeholder:!text-gray-400"
        placeholder={t("certificateNumber")}
      />
    </Form.Item>
    <Form.Item
      name="fhdyo_office"
      label={<span className="text-gray-300">{t("fhdyoOffice")}</span>}
    >
      <Input
        className="!bg-gray-600 !border-gray-500 !text-white placeholder:!text-gray-400"
        placeholder={t("fhdyoOffice")}
      />
    </Form.Item>

    <Divider className="text-gray-300">{t("otherInfo")}</Divider>
    <Form.Item
      name="application_date"
      label={<span className="text-gray-300">{t("applicationDate")}</span>}
    >
      <DatePicker
        format="YYYY-MM-DD"
        className="!bg-gray-600 !border-gray-500 !text-white placeholder:!text-gray-400"
        placeholder={t("applicationDate")}
      />
    </Form.Item>
    <Form.Item
      name="court_name"
      label={<span className="text-gray-300">{t("courtName")}</span>}
    >
      <Input
        className="!bg-gray-600 !border-gray-500 !text-white placeholder:!text-gray-400"
        placeholder={t("courtName")}
      />
    </Form.Item>
    <Form.Item
      name="divorce_reason"
      label={<span className="text-gray-300">{t("divorceReason")}</span>}
    >
      <Input.TextArea
        className="!bg-gray-600 !border-gray-500 !text-white placeholder:!text-gray-400"
        placeholder={t("divorceReason")}
        rows={4}
      />
    </Form.Item>
    <Form.Item>
      <Button
        type="primary"
        htmlType="submit"
        className="!bg-blue-600 hover:!bg-blue-700 w-full"
        loading={loading}
      >
        {t("downloadApplication")}
      </Button>
    </Form.Item>
  </Form>
);

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
  const [showForm, setShowForm] = useState(false);
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();
  const [form] = Form.useForm();

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
        if (!token) {
          throw new Error("No access token found");
        }
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => {
        if (error.message === "No access token found") {
          toast.error(t("tokenError"), { theme: "dark", position: "top-center" });
          navigate("/login");
        }
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
            toast.error(t("tokenError"), { theme: "dark", position: "top-center" });
            navigate("/login");
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
  }, [refreshAccessToken, t, navigate]);

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
    if (!isAuthenticated || !user?.full_name) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/chat/user_id?id=${userId}`);
      const { chat_rooms } = response.data;
      setConversations(chat_rooms.map((room) => ({ id: room.id, title: room.title })));
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      if (error.response?.status !== 401) {
        toast.error(t("serverError"), { theme: "dark", position: "top-center" });
      }
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
      if (error.response?.status !== 401) {
        toast.error(t("serverError"), { theme: "dark", position: "top-center" });
      }
    } finally {
      setLoading(false);
    }
  };

  const createChatRoom = async () => {
    if (!isAuthenticated || !user?.full_name) {
      return null;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/chat/room/create`, { user_id: userId });
      const newRoomId = response.data.ID;
      await fetchChatRooms();
      setChatRoomId(newRoomId);
      setChatHistory([]);
      setDisplayedResponse({});
      setNewResponse(null);
      return newRoomId;
    } catch (error) {
      console.error("Error creating chat room:", error);
      if (error.response?.status !== 401) {
        toast.error(t("failedtocreatechatroom"), { theme: "dark", position: "top-center" });
      }
      return null;
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

    let currentChatRoomId = chatRoomId;
    if (!currentChatRoomId) {
      currentChatRoomId = await createChatRoom();
      if (!currentChatRoomId) {
        return;
      }
    }

    const newMessage = { request: message, response: null };
    setChatHistory([...chatHistory, newMessage]);
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/ask`, {
        chat_room_id: currentChatRoomId,
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
        if (error.response?.status === 401) {
          throw error; // Let the interceptor handle 401
        }
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    throw new Error("Response not received in time");
  };

  const handleGeneratePdf = async (values) => {
    if (!isAuthenticated || !user?.full_name) {
      setIsModalVisible(true);
      return;
    }

    try {
      setLoading(true);
      const formattedValues = {
        ...values,
        application_date: values.application_date ? moment(values.application_date).format("YYYY-MM-DD") : "",
        child_birth_date: values.child_birth_date ? moment(values.child_birth_date).format("YYYY-MM-DD") : "",
        marriage_date: values.marriage_date ? moment(values.marriage_date).format("YYYY-MM-DD") : "",
      };

      const response = await axios.post(`${API_BASE_URL}/generate-pdf`, formattedValues, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "divorce_application.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(t("generatePdfSuccess"), { theme: "dark", position: "top-center" });
      form.resetFields();
      setShowForm(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      if (error.response?.status !== 401) {
        toast.error(t("generatePdfError"), { theme: "dark", position: "top-center" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModalOk = async () => {
    if (!fullName.trim()) {
      toast.error(t("nameRequired"), { theme: "dark", position: "top-center" });
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/users/update?id=${userId}`, {
        full_name: fullName,
        phone_number: user.phone_number,
      });
      toast.success(t("save"), { theme: "dark", position: "top-center" });
      setIsModalVisible(false);
      login({ ...user, full_name: fullName }, localStorage.getItem("access_token"));
      setFullName("");
    } catch (error) {
      console.error("Error updating full name:", error);
      if (error.response?.status !== 401) {
        toast.error(t("nameUpdateError"), { theme: "dark", position: "top-center" });
      }
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setFullName("");
    navigate("/login");
  };

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

  const ApplicationPanelContent = () => (
    <div className="p-4 h-full overflow-y-auto">
      <div className="mb-4 text-red-400 text-sm">{t("pdf")}</div>
      <div className="space-y-4">
        <Button
          type="primary"
          icon={<EditOutlined />}
          className="!bg-blue-600 hover:!bg-blue-700 w-full"
          onClick={() => setShowForm(true)}
          disabled={!isAuthenticated || !user?.full_name}
        >
          {t("writeApplication")}
        </Button>
        {showForm && (
          <ApplicationForm
            form={form}
            handleGeneratePdf={handleGeneratePdf}
            loading={loading}
            t={t}
          />
        )}
      </div>
    </div>
  );

  const HistoryPanelContent = ({ isDrawer = false }) => (
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
                if (isDrawer) setIsHistoryDrawerVisible(false);
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
  );

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
      <Header
        t={t}
        isAuthenticated={isAuthenticated}
        navigate={navigate}
        changeLanguage={changeLanguage}
        togglePdfDrawer={togglePdfDrawer}
        toggleHistoryDrawer={toggleHistoryDrawer}
      />

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
          <ApplicationPanelContent />
        </Drawer>

        <Sider width={300} className="hidden md:block !bg-gray-800 border-gray-700 border-r">
          <ApplicationPanelContent />
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

            <ChatInput
              message={message}
              setMessage={setMessage}
              isAuthenticated={isAuthenticated}
              user={user}
              loading={loading}
              handleSend={handleSend}
              t={t}
            />
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
          <HistoryPanelContent />
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
          <HistoryPanelContent isDrawer={true} />
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
          className="!bg-gray-600 !border-gray-500 !text-white placeholder:!text-gray-400"
          size="large"
        />
      </Modal>
    </div>
  );
}

export default Dashboard;