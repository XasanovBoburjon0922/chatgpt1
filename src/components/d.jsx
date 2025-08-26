"use client"

import { useState, useEffect, useRef, memo } from "react"
import axios from "axios"
import "../App.css"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "../auth/authContext"
import UserDropdown from "./userDropdown"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import CategorySidebar from "./categorySidebar"

i18n.use(initReactI18next).init({
  resources: {
    uz: {
      translation: {
        chatgpt: "Imzo AI",
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
        agree: "Imzo AI bilan xabar yuborish orqali siz bizning",
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
      },
    },
    ru: {
      translation: {
        chatgpt: "Imzo AI",
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
        agree: "Отправляя сообщение Imzo AI, вы соглашаетесь с нашими",
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
      },
    },
  },
  lng: "uz",
  fallbackLng: "uz",
  interpolation: {
    escapeValue: false,
  },
})

const API_BASE_URL = "https://imzo-ai.uzjoylar.uz"

const Header = ({ t, isAuthenticated, navigate, changeLanguage, toggleSidebar, toggleHistoryPanel }) => (
  <div className="flex justify-between items-center bg-gray-900/65 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
    <div className="flex items-center space-x-4">
      <button
        onClick={toggleSidebar}
        className="lg:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <h1 className="text-xl font-bold text-white">{t("chatgpt")}</h1>
      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">v1.20</span>
    </div>
    <div className="flex items-center space-x-4">
      {isAuthenticated ? (
        <UserDropdown />
      ) : (
        <button
          onClick={() => navigate("/login")}
          className="bg-white hover:bg-blue-700 text-black px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        >
          {t("login")}
        </button>
      )}
      <select
        defaultValue="uz"
        onChange={(e) => changeLanguage(e.target.value)}
        className="bg-gray-900/65 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="uz">UZ</option>
        <option value="ru">RU</option>
      </select>
      <button
        onClick={toggleHistoryPanel}
        className="lg:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  </div>
)

const ChatInput = ({ message, setMessage, isAuthenticated, user, loading, handleSend, t, setIsModalVisible }) => (
  <div className="px-6 pb-6">
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-900/45 border border-gray-700 rounded-2xl p-4 backdrop-blur-sm">
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isAuthenticated && user?.full_name ? t("askanything") : t("askanything")}
              disabled={loading}
              className="w-full bg-transparent text-white placeholder-gray-400 border-none outline-none resize-none min-h-[20px] max-h-32"
              style={{ height: 'auto' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (isAuthenticated && user?.full_name) {
                    handleSend()
                  } else {
                    setIsModalVisible(true)
                  }
                }
              }}
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              disabled
              className="p-2 text-gray-500 hover:text-gray-400 transition-colors duration-200 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <button
              disabled
              className="p-2 text-gray-500 hover:text-gray-400 transition-colors duration-200 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button
              disabled
              className="p-2 text-gray-500 hover:text-gray-400 transition-colors duration-200 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (isAuthenticated && user?.full_name) {
                  handleSend()
                } else {
                  setIsModalVisible(true)
                }
              }}
              disabled={!message.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const TypingAnimation = () => (
  <div className="flex items-center space-x-2">
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
  </div>
)

const ChatMessage = ({ message, initialAssistantMessage, finalResponse, isLoading }) => (
  <div className="mb-6 max-w-4xl mx-auto space-y-4">
    {/* User Message Card (Right) */}
    <div className="flex justify-end items-start space-x-3 space-x-reverse">
      <div className="bg-blue-600 border border-blue-700 rounded-xl px-4 py-3 max-w-[70%] shadow-sm">
        <p className="text-sm text-white leading-relaxed">{message}</p>
      </div>
      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-medium text-white">You</span>
      </div>
    </div>
    {/* Assistant Message Card (Left) */}
    {(initialAssistantMessage || finalResponse || isLoading) && (
      <div className="flex justify-start items-start space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-white">AI</span>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl px-4 py-3 max-w-[70%] shadow-sm">
          <div className="text-sm text-gray-100 leading-relaxed space-y-2">
            {/* Display /ask API message if available */}
            {initialAssistantMessage && <p>{initialAssistantMessage}</p>}
            {/* Display loading animation or final response */}
            {isLoading ? (
              <TypingAnimation />
            ) : (
              finalResponse && <div>{finalResponse}</div>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
)

const SidebarContent = memo(({ activeTab, setIsSidebarOpen, fetchChatHistory, chatRoomId, conversations, createChatRoom, loading, isAuthenticated, user, t }) => {
  const HistoryPanel = () => (
    <div className="flex-1 overflow-y-auto chat-container p-4">
      <div className="space-y-2">
        <div className="mb-4">
          <h4 className="text-gray-500 text-xs uppercase font-semibold mb-2">TODAY</h4>
          {isAuthenticated && user?.full_name && conversations
            .filter(conv => true)
            .slice(0, 3)
            .map((conv) => (
              <div
                key={conv.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 flex items-center space-x-3 group ${chatRoomId === conv.id ? "bg-gray-800" : "hover:bg-gray-800/50"}`}
                onClick={() => {
                  fetchChatHistory(conv.id);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-gray-300 text-sm truncate">{conv.title}</span>
              </div>
            ))}
        </div>

        <div className="mb-4">
          <h4 className="text-gray-500 text-xs uppercase font-semibold mb-2">YESTERDAY</h4>
          {isAuthenticated && user?.full_name && conversations
            .slice(3, 8)
            .map((conv) => (
              <div
                key={conv.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 flex items-center space-x-3 group ${chatRoomId === conv.id ? "bg-gray-900/65" : "hover:bg-gray-900/85"}`}
                onClick={() => {
                  fetchChatHistory(conv.id);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-gray-300 text-sm truncate">{conv.title}</span>
              </div>
            ))}
        </div>

        <div className="mb-4">
          <h4 className="text-gray-500 text-xs uppercase font-semibold mb-2">PREVIOUS</h4>
          {isAuthenticated && user?.full_name && conversations
            .slice(8)
            .map((conv) => (
              <div
                key={conv.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 flex items-center space-x-3 group ${chatRoomId === conv.id ? "bg-gray-800" : "hover:bg-gray-800/50"}`}
                onClick={() => {
                  fetchChatHistory(conv.id);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-gray-300 text-sm truncate">{conv.title}</span>
              </div>
            ))}
        </div>
      </div>

      {!isAuthenticated && (
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">{t("loginRequired")}</p>
        </div>
      )}
    </div>
  );

  if (activeTab === "history") {
    return <HistoryPanel />;
  } else if (activeTab === "categories") {
    return (
      <CategorySidebar
        onCategorySelect={(category, item) => {
          console.log("Selected category:", category, "item:", item);
          setIsSidebarOpen(false);
        }}
      />
    );
  }
  return null;
});

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
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [fullName, setFullName] = useState("");
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("history");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(null);
  const [isCategoriesLocked, setIsCategoriesLocked] = useState(false);
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleHistoryPanel = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };

  const SidebarIcons = () => (
    <div className="flex flex-col items-center py-4 border-b border-gray-800">
      <button
        onClick={() => {
          setActiveTab("history");
          setIsCategoriesLocked(false);
        }}
        className={`p-3 rounded-lg mb-2 transition-colors duration-200 ${activeTab === "history" ? "bg-gray-900/85 text-white" : "text-gray-500 hover:text-gray-300 hover:bg-gray-900/65"}`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
      <button
        onClick={() => {
          setActiveTab("categories");
          setIsCategoriesLocked(true);
        }}
        className={`p-3 rounded-lg transition-colors duration-200 ${activeTab === "categories" ? "bg-gray-900/85 text-white" : "text-gray-500 hover:text-gray-300 hover:bg-gray-900/65"}`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  );

  useEffect(() => {
    if (isAuthenticated && user && !user.full_name) {
      setIsNameModalVisible(true);
    } else if (isAuthenticated && user?.full_name && pendingMessage) {
      setMessage(pendingMessage);
      handleSend();
      setPendingMessage(null);
    }
  }, [isAuthenticated, user, pendingMessage]);

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
      setChatHistory(history.map(chat => ({
        request: chat.request,
        initialAssistantMessage: chat.response,
        finalResponse: null,
        isLoading: false
      })));
      setChatRoomId(roomId);
      setDisplayedResponse(
        history.reduce((acc, chat) => {
          if (chat.response) {
            acc[chat.request] = chat.response;
          }
          return acc;
        }, {}),
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
        setIsNameModalVisible(true);
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

    const newMessage = {
      request: message,
      initialAssistantMessage: null,
      finalResponse: null,
      isLoading: true,
    };
    setChatHistory([...chatHistory, newMessage]);
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/ask`, {
        chat_room_id: currentChatRoomId,
        request: message,
      });

      if (response.status === 200) {
        const { id, message: apiMessage } = response.data;

        // Update chat history with the /ask API message
        setChatHistory((prev) =>
          prev.map((item, index) =>
            index === prev.length - 1
              ? { ...item, initialAssistantMessage: apiMessage || "", isLoading: true }
              : item
          )
        );

        // Poll for the final response
        const responseData = await pollForResponse(id);
        const finalResponse = responseData.responce;

        // Store the final response separately
        setChatHistory((prev) =>
          prev.map((item, index) =>
            index === prev.length - 1
              ? { ...item, finalResponse: finalResponse, isLoading: false }
              : item
          )
        );
        setNewResponse({ request: message, response: finalResponse });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      let errorMessage = t("failedtosendmessage");
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || t("failedtosendmessage");
      } else if (
        error.response?.status === 500 &&
        error.response.data?.error === "kunlik request limiti tugadi"
      ) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status !== 401) {
        errorMessage = t("serverError");
      }

      setChatHistory((prev) =>
        prev.map((item, index) =>
          index === prev.length - 1
            ? { ...item, finalResponse: errorMessage, isLoading: false }
            : item
        )
      );
      setNewResponse({ request: message, response: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const pollForResponse = async (requestId) => {
    const maxAttempts = 1000;
    const delay = 14000;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(`${API_BASE_URL}/get/gpt/responce?id=${requestId}`);
        if (response.status === 200 && response.data.responce) {
          return response.data;
        }
      } catch (error) {
        console.error("Polling error:", error);
        if (error.response?.status === 401) {
          throw error;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    throw new Error("Response not received in time");
  };

  const handleNameModalOk = async () => {
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
      setIsNameModalVisible(false);
      login({ ...user, full_name: fullName }, localStorage.getItem("access_token"));
      setFullName("");
    } catch (error) {
      console.error("Error updating full name:", error);
      if (error.response?.status !== 401) {
        toast.error(t("nameUpdateError"), { theme: "dark", position: "top-center" });
      }
    }
  };

  const handleNameModalCancel = () => {
    setIsNameModalVisible(false);
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
          <li key={index} className="ml-4 text-gray-200 mb-1">
            <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
          </li>
        );
      }

      return (
        <p key={index} className="mb-2 text-gray-200 leading-relaxed">
          <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
        </p>
      );
    });
  };

  return (
    <div className="h-screen bg-black/85 flex flex-col text-white">
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:relative z-30 w-[430px] h-full bg-black/85 border-r border-gray-800 transition-transform duration-300 ease-in-out`}
        >
          <Header
            t={t}
            isAuthenticated={isAuthenticated}
            navigate={navigate}
            changeLanguage={changeLanguage}
            toggleSidebar={toggleSidebar}
            toggleHistoryPanel={toggleHistoryPanel}
          />
          <div className="h-full w-full flex">
            <SidebarIcons />
            <SidebarContent
              activeTab={activeTab}
              setIsSidebarOpen={setIsSidebarOpen}
              fetchChatHistory={fetchChatHistory}
              chatRoomId={chatRoomId}
              conversations={conversations}
              createChatRoom={createChatRoom}
              loading={loading}
              isAuthenticated={isAuthenticated}
              user={user}
              t={t}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-[100px] py-6 chat-container" ref={chatContainerRef}>
            {!isAuthenticated && (
              <div className="flex flex-col justify-center items-center h-full text-center">
                <h2 className="text-3xl font-bold mb-4">Welcome to Imzo AI</h2>
                <p className="text-gray-400">Please log in to start chatting.</p>
              </div>
            )}

            {isAuthenticated && chatHistory.length === 0 && (
              <div className="flex flex-col justify-center items-center h-full text-center">
                <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
                <p className="text-gray-400">{t("askanything")}</p>
              </div>
            )}

            {isAuthenticated &&
              chatHistory.map((chat, index) => (
                <ChatMessage
                  key={index}
                  message={chat.request}
                  initialAssistantMessage={chat.initialAssistantMessage}
                  finalResponse={renderAssistantResponse(displayedResponse[chat.request] || chat.finalResponse)}
                  isLoading={chat.isLoading}
                />
              ))}
          </div>

          <ChatInput
            message={message}
            setMessage={setMessage}
            isAuthenticated={isAuthenticated}
            user={user}
            loading={loading}
            handleSend={handleSend}
            t={t}
            setIsModalVisible={setIsLoginModalVisible}
          />
        </div>
      </div>

      {(isSidebarOpen || isHistoryOpen) && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => {
            setIsSidebarOpen(false);
            setIsHistoryOpen(false);
          }}
        />
      )}

      {isNameModalVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-black/85 rounded-2xl border border-gray-800 p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4">{t("enterName")}</h3>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("enterName")}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleNameModalCancel}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-3 rounded-xl transition-all"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleNameModalOk}
                className="flex-1 bg-white text-black font-medium py-3 rounded-xl transition-all hover:bg-gray-200"
              >
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoginModalVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-black/85 rounded-2xl border border-gray-700 p-6 w-full max-w-md text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl">AI</span>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Continue with Imzo AI</h3>
            <p className="text-gray-400 mb-4">To use Imzo AI, create an account or log into an existing one.</p>
            <button
              onClick={() => {
                setIsLoginModalVisible(false);
                navigate("/login");
              }}
              className="w-full bg-white hover:bg-gray-200 text-black px-4 py-3 rounded-lg font-medium mb-2 transition-colors duration-200"
            >
              {t("signup")}
            </button>
            <button
              onClick={() => {
                setIsLoginModalVisible(false);
                navigate("/login");
              }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              {t("login")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;