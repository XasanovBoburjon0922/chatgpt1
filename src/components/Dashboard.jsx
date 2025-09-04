"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/authContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "./Header";
import ChatInput from "./chatInput";
import ChatMessage from "./chatMessages";
import SidebarIcons from "./sidebar/sidebarIcons";
import SidebarContent from "./sidebar/sidebarContext";

const API_BASE_URL = "https://imzo-ai.uzjoylar.uz";

function Ekspertiza({ isAuthenticated, user, navigate, t }) {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResponse, setAnalysisResponse] = useState(null);
  const [displayedAnalysis, setDisplayedAnalysis] = useState("");
  const [newAnalysis, setNewAnalysis] = useState(null);

  useEffect(() => {
    if (newAnalysis?.response) {
      let currentText = "";
      const fullText = newAnalysis.response;
      let index = 0;

      const type = () => {
        if (index < fullText.length) {
          const step = Math.min(4 + Math.floor(Math.random() * 2), fullText.length - index);
          currentText += fullText.slice(index, index + step);
          setDisplayedAnalysis(currentText);
          index += step;
          setTimeout(type, 30);
        } else {
          setNewAnalysis(null);
        }
      };
      type();
    }
  }, [newAnalysis]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (selectedFile && allowedTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
      setError("");
    } else {
      setFile(null);
      setError(t("invalidFileType"));
    }
  };

  const pollForAnalysisResponse = async (analysisId) => {
    const maxAttempts = 1000;
    const delay = 14000;
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("Access token not found");
      navigate("/login");
      throw new Error("Access token not found");
    }

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(`${API_BASE_URL}/get/pdf/analysis/${analysisId}`, {
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200 && response.data.response) {
          return response.data;
        }
      } catch (error) {
        console.error("Polling error:", error);
        if (error.response?.status === 401) {
          navigate("/login");
          throw error;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    throw new Error("Analysis response not received in time");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !question) {
      setError(t("fileAndQuestionRequired"));
      return;
    }

    if (!isAuthenticated || !user?.full_name) {
      navigate("/login");
      return;
    }

    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("question", question);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("Access token not found");
        navigate("/login");
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/get/pdf/analysis`, formData, {
        headers: {
          Accept: "application/json",
          Authorization: `${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        const { id } = response.data;
        const analysisData = await pollForAnalysisResponse(id);
        setAnalysisResponse({
          question,
          response: analysisData.response,
        });
        setNewAnalysis({ response: analysisData.response });
        setFile(null);
        setQuestion("");
        e.target.reset();
        toast.success(t("submissionSuccessful"), { theme: "dark", position: "top-center" });
      }
    } catch (err) {
      console.error("Error submitting file and question:", err);
      setError(err.message || t("submissionError"));
      toast.error(t("submissionError"), { theme: "dark", position: "top-center" });
    } finally {
      setIsLoading(false);
    }
  };

  const renderAnalysisResponse = (responseText) => {
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
        <p key={index} className="mb-1 text-gray-200 leading-relaxed lg:mb-2">
          <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
        </p>
      );
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-black/85 rounded-lg shadow-sm text-white">
      <h2 className="text-2xl font-bold text-white mb-6">{t("ekspertiza")}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t("uploadFile")}
          </label>
          <input
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-gray-200 hover:file:bg-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t("question")}
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t("enterQuestion")}
            className="w-full p-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white bg-gray-900/50 text-white placeholder-gray-500"
            rows="4"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 ${
            isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-white text-black hover:bg-gray-200"
          }`}
        >
          {isLoading ? t("submitting") : t("submit")}
        </button>
      </form>
      {analysisResponse && (
        <div className="mt-6">
          <h3 className="text-lg font-bold text-white mb-3">{t("analysisResult")}</h3>
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <p className="text-gray-200 mb-2">
              <strong>{t("question")}:</strong> {analysisResponse.question}
            </p>
            <div>{renderAnalysisResponse(displayedAnalysis)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, login } = useAuth();
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newResponse, setNewResponse] = useState(null);
  const [displayedResponse, setDisplayedResponse] = useState({});
  const [userId] = useState(localStorage.getItem("user_id"));
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [fullName, setFullName] = useState("");
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("history");
  const [pendingMessage, setPendingMessage] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();
  const { chatId } = useParams();
  const location = useLocation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleHistoryPanel = () => {
    setIsHistoryOpen(!isHistoryOpen);
    setIsSidebarOpen(!isHistoryOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    if (isAuthenticated && user?.full_name && location.pathname !== "/ekspertiza") {
      fetchChatRooms();
      if (chatId) {
        fetchChatHistory(chatId);
      }
    }
  }, [isAuthenticated, user, chatId, location.pathname]);

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
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("Access token not found");
        navigate("/login");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/chat/user_id?id=${userId}`, {
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
      });

      const { chat_rooms } = response.data;
      setConversations(chat_rooms.map((room) => ({ id: room.id, title: room.title })));
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
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
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("Access token not found");
        navigate("/login");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/chat/message?id=${roomId}`, {
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
      });

      const history = response.data.chats || [];
      setChatHistory(
        history.map((chat) => ({
          request: chat.request,
          initialAssistantMessage: chat.response,
          finalResponse: null,
          isLoading: false,
        }))
      );
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
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
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
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("Access token not found");
        navigate("/login");
        return null;
      }

      const response = await axios.post(
        `${API_BASE_URL}/chat/room/create`,
        { user_id: userId },
        {
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const newRoomId = response.data.ID;
      await fetchChatRooms();
      setChatHistory([]);
      setDisplayedResponse({});
      setNewResponse(null);
      navigate(`/c/${newRoomId}`);
      return newRoomId;
    } catch (error) {
      console.error("Error creating chat room:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
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

    let currentChatRoomId = chatId;
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
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("Access token not found");
        navigate("/login");
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/ask`,
        {
          chat_room_id: currentChatRoomId,
          request: message,
        },
        {
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        const { id, message: apiMessage } = response.data;

        setChatHistory((prev) =>
          prev.map((item, index) =>
            index === prev.length - 1
              ? { ...item, initialAssistantMessage: apiMessage || "", isLoading: true }
              : item
          )
        );

        const responseData = await pollForResponse(id);
        const finalResponse = responseData.response;

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
      } else if (error.response?.status === 401) {
        navigate("/login");
      } else {
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
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("Access token not found");
      navigate("/login");
      throw new Error("Access token not found");
    }

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(`${API_BASE_URL}/get/gpt/responce?id=${requestId}`, {
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200 && response.data.response) {
          return response.data;
        }
      } catch (error) {
        console.error("Polling error:", error);
        if (error.response?.status === 401) {
          navigate("/login");
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
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("Access token not found");
        navigate("/login");
        return;
      }

      await axios.post(
        `${API_BASE_URL}/users/update?id=${userId}`,
        {
          full_name: fullName,
          phone_number: user.phone_number,
        },
        {
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success(t("save"), { theme: "dark", position: "top-center" });
      setIsNameModalVisible(false);
      login({ ...user, full_name: fullName }, localStorage.getItem("access_token"));
      setFullName("");
    } catch (error) {
      console.error("Error updating full name:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
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
        <p key={index} className="mb-1 text-gray-200 leading-relaxed lg:mb-2">
          <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
        </p>
      );
    });
  };

  const isEkspertizaRoute = location.pathname === "/ekspertiza";

  return (
    <div className="h-screen bg-black/85 flex flex-col text-white">
      <div className="block md:hidden">
        <Header
          isAuthenticated={isAuthenticated}
          navigate={navigate}
          changeLanguage={changeLanguage}
          toggleSidebar={toggleSidebar}
          toggleHistoryPanel={toggleHistoryPanel}
        />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:relative z-30 w-[80%] h-full bg-black/85 border-r border-gray-800 transition-transform duration-300 ease-in-out md:w-[460px]`}
        >
          <div className="hidden md:block">
            <Header
              isAuthenticated={isAuthenticated}
              navigate={navigate}
              changeLanguage={changeLanguage}
              toggleSidebar={toggleSidebar}
              toggleHistoryPanel={toggleHistoryPanel}
            />
          </div>
          <div className="h-full w-full flex">
            <SidebarIcons setActiveTab={setActiveTab} activeTab={activeTab} navigate={navigate} />
            <SidebarContent
              activeTab={activeTab}
              setIsSidebarOpen={setIsSidebarOpen}
              fetchChatHistory={fetchChatHistory}
              chatRoomId={chatId}
              conversations={conversations}
              createChatRoom={createChatRoom}
              loading={loading}
              isAuthenticated={isAuthenticated}
              user={user}
              navigate={navigate}
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 lg:px-[100px] lg:py-6 chat-container" ref={chatContainerRef}>
            {!isAuthenticated && (
              <div className="flex flex-col justify-center items-center h-full text-center">
                <h2 className="text-2xl font-bold mb-3 lg:text-3xl lg:mb-4">Welcome to Imzo AI</h2>
                <p className="text-gray-400 text-sm lg:text-base">{t("pleaseLogin")}</p>
              </div>
            )}
            {isAuthenticated && !isEkspertizaRoute && chatHistory.length === 0 && !chatId && (
              <div className="flex flex-col justify-center items-center h-full text-center">
                <h2 className="text-2xl font-bold mb-3 lg:text-3xl lg:mb-4">Welcome Back!</h2>
                <p className="text-gray-400 text-sm lg:text-base">{t("askanything")}</p>
              </div>
            )}
            {isAuthenticated && !isEkspertizaRoute &&
              chatHistory.map((chat, index) => (
                <ChatMessage
                  key={index}
                  message={chat.request}
                  initialAssistantMessage={chat.initialAssistantMessage}
                  finalResponse={renderAssistantResponse(displayedResponse[chat.request] || chat.finalResponse)}
                  isLoading={chat.isLoading}
                  isMobile={isMobile}
                />
              ))}
            {isAuthenticated && isEkspertizaRoute && (
              <Ekspertiza
                isAuthenticated={isAuthenticated}
                user={user}
                navigate={navigate}
                t={t}
              />
            )}
          </div>
          {!isEkspertizaRoute && (
            <ChatInput
              message={message}
              setMessage={setMessage}
              isAuthenticated={isAuthenticated}
              user={user}
              loading={loading}
              handleSend={handleSend}
              setIsModalVisible={setIsLoginModalVisible}
              isMobile={isMobile}
            />
          )}
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
          <div className="bg-black/85 rounded-2xl border border-gray-800 p-4 w-full max-w-xs lg:p-6 lg:max-w-sm">
            <h3 className="text-lg font-bold mb-3 lg:text-xl lg:mb-4">{t("enterName")}</h3>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("enterName")}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white mb-3 text-sm lg:px-4 lg:py-3 lg:mb-4"
            />
            <div className="flex gap-2 lg:gap-3">
              <button
                onClick={handleNameModalCancel}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-2 rounded-xl transition-all text-sm lg:py-3"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleNameModalOk}
                className="flex-1 bg-white text-black font-medium py-2 rounded-xl transition-all hover:bg-gray-200 text-sm lg:py-3"
              >
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
      {isLoginModalVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-black/85 rounded-2xl border border-gray-700 p-4 w-full max-w-xs lg:p-6 lg:max-w-md text-center">
            <div className="flex justify-center mb-3 lg:mb-4">
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center lg:w-16 lg:h-16">
                <span className="text-white text-xl lg:text-2xl">AI</span>
              </div>
            </div>
            <h3 className="text-lg font-bold mb-2 lg:text-xl">Continue with Imzo AI</h3>
            <p className="text-gray-400 mb-3 text-sm lg:mb-4">{t("loginPrompt")}</p>
            <button
              onClick={() => {
                setIsLoginModalVisible(false);
                navigate("/login");
              }}
              className="w-full bg-white hover:bg-gray-200 text-black px-3 py-2 rounded-lg font-medium mb-2 text-sm lg:px-4 lg:py-3 transition-colors duration-200"
            >
              {t("signup")}
            </button>
            <button
              onClick={() => {
                setIsLoginModalVisible(false);
                navigate("/login");
              }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-2 rounded-lg font-medium text-sm lg:px-4 lg:py-3 transition-colors duration-200"
            >
              {t("login")}
            </button>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}

export default Dashboard;