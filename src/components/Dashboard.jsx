"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
const WS_BASE_URL = "wss://imzo-ai.uzjoylar.uz/ws";

function Dashboard() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, login } = useAuth();
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newResponse, setNewResponse] = useState(null);
  const [displayedResponse, setDisplayedResponse] = useState({});
  const [streamingResponse, setStreamingResponse] = useState("");
  const [userId] = useState(localStorage.getItem("user_id"));
  const [isNameModalVisible, setIsNameModalVisible] = useState(false);
  const [fullName, setFullName] = useState("");
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("history");
  const [pendingMessage, setPendingMessage] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;
  const connectionTimeout = 10000;
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();
  const { chatId } = useParams();
  const location = useLocation();
  const [showGemini, setShowGemini] = useState(false);


  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };
  useEffect(() => {
    if (location.pathname.startsWith("/categories")) {
      setActiveTab("categories");
    } else {
      setActiveTab("history");
    }
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleHistoryPanel = () => {
    setIsHistoryOpen(!isHistoryOpen);
    setIsSidebarOpen(!isHistoryOpen);
  };

  const connectWebSocket = (roomId) => {
    if (!isAuthenticated || !user?.full_name || !roomId || reconnectAttempts >= maxReconnectAttempts) {
      console.error("Cannot connect WebSocket: invalid parameters or max reconnect attempts reached");
      return null;
    }

    if (ws) {
      ws.close();
      setWs(null);
      setIsConnected(false);
    }

    const wsUrl = `${WS_BASE_URL}/${roomId}`;
    const websocket = new WebSocket(wsUrl);
    setWs(websocket);

    websocket.onopen = () => {
      console.log("WebSocket connected to", wsUrl);
      setIsConnected(true);
      setReconnectAttempts(0);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);

        if (data.type === "chunk" && data.data && typeof data.data === "string") {
          const chunkText = data.data;
          if (showGemini) {
            setPendingChunks((prev) => prev + chunkText);
          } else {
            setStreamingResponse((prev) => prev + chunkText);
            setChatHistory((prev) =>
              prev.map((item, index) =>
                index === prev.length - 1
                  ? { ...item, finalResponse: (item.finalResponse || "") + chunkText, isLoading: true }
                  : item
              )
            );
          }
        } else if (data.status === "end") {
          setLoading(false);
          setChatHistory((prev) =>
            prev.map((item, index) =>
              index === prev.length - 1
                ? { ...item, isLoading: false }
                : item
            )
          );
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
        toast.error(t("websocketMessageError"), { theme: "dark", position: "top-center" });
      }
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      if (reconnectAttempts < maxReconnectAttempts) {
        setTimeout(() => {
          setReconnectAttempts((prev) => prev + 1);
          connectWebSocket(roomId);
        }, reconnectDelay);
      } else {
        toast.error(t("websocketMaxReconnect"), { theme: "dark", position: "top-center" });
        setLoading(false);
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      websocket.close();
    };

    return websocket;
  };

  useEffect(() => {
    if (isAuthenticated && user?.full_name && chatId) {
      connectWebSocket(chatId);
      return () => {
        if (ws) {
          ws.close();
          setWs(null);
          setIsConnected(false);
        }
      };
    }
  }, [isAuthenticated, user, chatId]);

  const handleFileUpload = async (file, question) => {
    if (!file || !question) {
      toast.error(t("fileAndQuestionRequired"), { theme: "dark", position: "top-center" });
      return;
    }

    if (!isAuthenticated || !user?.full_name) {
      navigate("/login");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("question", question);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
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
        const newMessage = {
          request: question,
          initialAssistantMessage: null,
          finalResponse: null,
          isLoading: true,
        };
        setChatHistory((prev) => [...prev, newMessage]);

        const analysisData = await pollForAnalysisResponse(id);
        setChatHistory((prev) =>
          prev.map((item, index) =>
            index === prev.length - 1
              ? { ...item, finalResponse: analysisData.responce, isLoading: false }
              : item
          )
        );
        setNewResponse({ request: question, response: analysisData.responce });
        toast.success(t("submissionSuccessful"), { theme: "dark", position: "top-center" });
      }
    } catch (err) {
      console.error("Error submitting file and question:", err);
      toast.error(err.message || t("submissionError"), { theme: "dark", position: "top-center" });
      setChatHistory((prev) =>
        prev.map((item, index) =>
          index === prev.length - 1
            ? { ...item, finalResponse: err.message || t("submissionError"), isLoading: false }
            : item
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const pollForAnalysisResponse = async (analysisId) => {
    const maxAttempts = 30;
    const delay = 4000;
    const token = localStorage.getItem("access_token");
    if (!token) {
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

        if (response.status === 200 && response.data.responce && response.data.responce.trim() !== "") {
          return response.data;
        }
      } catch (error) {
        if (error.response?.status === 401) {
          navigate("/login");
          throw error;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const errorMessage = t("analysisTimeout");
    toast.error(errorMessage, { theme: "dark", position: "top-center" });
    throw new Error(errorMessage);
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

  // Chat tarixi va suhbatlar yuklash
  useEffect(() => {
    if (isAuthenticated && user?.full_name) {
      fetchChatRooms();
      if (chatId) {
        fetchChatHistory(chatId);
      } else {
        setChatHistory([]);
        setDisplayedResponse({});
        setNewResponse(null);
        setStreamingResponse("");
      }
    }
  }, [isAuthenticated, user, chatId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, displayedResponse, streamingResponse]);

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
          setChatHistory((prev) =>
            prev.map((item) =>
              item.request === request
                ? { ...item, finalResponse: fullText, isLoading: false }
                : item
            )
          );
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
      setConversations(chat_rooms.map((room) => ({ id: room.id, title: room.title, created_at: room.created_at })));
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        toast.error(t("failedtofetchchatrooms"), { theme: "dark", position: "top-center" });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async (roomId) => {
    if (!isAuthenticated || !user?.full_name || !roomId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
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
      const newChatHistory = history.map((chat) => ({
        request: chat.request,
        initialAssistantMessage: null,
        finalResponse: chat.response || null,
        isLoading: false,
      }));

      setChatHistory(newChatHistory);
      setDisplayedResponse(
        history.reduce((acc, chat) => {
          if (chat.response) acc[chat.request] = chat.response;
          return acc;
        }, {})
      );
      setNewResponse(null);
      setStreamingResponse("");
    } catch (error) {
      console.error("Error fetching chat history:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        toast.error(t("failedtofetchhistory"), { theme: "dark", position: "top-center" });
      }
    } finally {
      setLoading(false);
    }
  };

  const createChatRoom = async (firstMessage) => {
    if (!isAuthenticated || !user?.full_name) return null;

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login");
        return null;
      }

      const response = await axios.post(
        `${API_BASE_URL}/chat/room/create`,
        { user_id: userId, title: firstMessage?.substring(0, 50) || "New Chat" },
        {
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const newRoomId = response.data.ID;
      await fetchChatRooms();
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

  const waitForWebSocketConnection = (websocket, timeout) => {
    return new Promise((resolve, reject) => {
      if (!websocket) {
        reject(new Error(t("websocketNotInitialized")));
        return;
      }
      const startTime = Date.now();
      const checkConnection = () => {
        if (websocket.readyState === WebSocket.OPEN) {
          resolve();
        } else if (Date.now() - startTime >= timeout) {
          reject(new Error(t("websocketConnectionTimeout")));
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });
  };

  const handleNewChat = async () => {
    if (!isAuthenticated || !user?.full_name) {
      toast.error(t("loginRequired"), { theme: "dark", position: "top-center" });
      return;
    }
    navigate("/");
    setChatHistory([]);
    setDisplayedResponse({});
    setNewResponse(null);
    setStreamingResponse("");
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error(t("messageEmpty"), { theme: "dark", position: "top-center" });
      return;
    }

    if (!isAuthenticated) {
      setIsLoginModalVisible(true);
      setPendingMessage(message);
      return;
    }

    if (!user?.full_name) {
      setIsNameModalVisible(true);
      setPendingMessage(message);
      return;
    }

    if (loading) {
      toast.warn(t("operationInProgress"), { theme: "dark", position: "top-center" });
      return;
    }

    setLoading(true);

    let currentChatRoomId = chatId;
    if (!currentChatRoomId) {
      currentChatRoomId = await createChatRoom(message);
      if (!currentChatRoomId) {
        await fetchChatRooms();
        if (conversations.length > 0) {
          currentChatRoomId = conversations[0].id;
        } else {
          toast.error(t("failedtocreatechatroom"), { theme: "dark", position: "top-center" });
          setLoading(false);
          return;
        }
      }
      navigate(`/c/${currentChatRoomId}`);
      await fetchChatHistory(currentChatRoomId);
    }

    let websocket = ws;
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      websocket = connectWebSocket(currentChatRoomId);
      if (!websocket) {
        toast.error(t("websocketNotInitialized"), { theme: "dark", position: "top-center" });
        setLoading(false);
        return;
      }
      try {
        await waitForWebSocketConnection(websocket, connectionTimeout);
      } catch (error) {
        toast.error(error.message || t("websocketNotConnected"), { theme: "dark", position: "top-center" });
        setLoading(false);
        return;
      }
    }

    const newMessage = {
      request: message,
      initialAssistantMessage: null,
      finalResponse: null,
      isLoading: true,
    };
    setChatHistory((prev) => [...prev, newMessage]);
    setStreamingResponse("");
    setMessage("");

    try {
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({ message: message, type: "request" }));
      } else {
        throw new Error(t("websocketNotConnected"));
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error.message || t("failedtosendmessage"), { theme: "dark", position: "top-center" });
      setChatHistory((prev) =>
        prev.map((item, index) =>
          index === prev.length - 1
            ? { ...item, finalResponse: error.message || t("failedtosendmessage"), isLoading: false }
            : item
        )
      );
      setLoading(false);
    }
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };
  const storedFullName = localStorage.getItem("full_name") || user?.full_name || "User";
  const handleNameModalOk = async () => {
    if (!fullName.trim()) {
      toast.error(t("nameRequired"), { theme: "dark", position: "top-center" });
      return;
    }
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
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

  // Chat tanlanganda chaqiriladigan funksiya
  const handleConversationSelect = (convId) => {
    navigate(`/c/${convId}`);
    fetchChatHistory(convId);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const renderAssistantResponse = (responseText) => {
    if (!responseText) return null;

    const lines = responseText.split(/\n+/).filter((line) => line.trim());

    return lines.map((line, index) => {
      let formattedLine = line;
      formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      formattedLine = formattedLine.replace(/\*(.*?)\*/g, "<em>$1</em>");
      formattedLine = formattedLine.replace(/^## (.*)$/gm, '<h2>$1</h2>');
      formattedLine = formattedLine.replace(/^### (.*)$/gm, '<h2>$1</h2>');
      formattedLine = formattedLine.replace(/^#### (.*)$/gm, '<h2>$1</h2>');
      formattedLine = formattedLine.replace(/^---$/gm, '<hr />');
      const isListItem = line.trim().startsWith("- ") || line.trim().startsWith("* ");
      if (isListItem) {
        formattedLine = formattedLine.replace(/^[-*]\s+/, "");
        return (
          <li key={index} className="ml-4 text-gray-100 mb-1">
            <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
          </li>
        );
      }

      return (
        <p key={index} className="mb-1 text-gray-100 leading-relaxed lg:mb-2">
          <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
        </p>
      );
    });
  };

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
          className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            } lg:translate-x-0 fixed lg:relative z-30 w-[80%] h-full bg-black/85 border-r border-gray-800 transition-transform duration-300 ease-in-out md:w-[460px]`}
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
          <div className="flex flex-col h-[100%]">
            <div className="h-[80%] w-full flex">
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
                handleNewChat={handleNewChat}
                onConversationSelect={handleConversationSelect} // YANGI QATOR
              />
            </div>

            {isAuthenticated && (
              <div
                className="flex items-center justify-between p-2 bg-black/85 border-t border-gray-800 cursor-pointer"
                onClick={handleProfileClick}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 mr-2">
                    <img
                      src="/src/assets/profile.png"
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover bg-white"
                    />
                  </div>
                  <span className="text-white text-sm font-medium">{storedFullName}</span>
                  <span className="ml-1 text-blue-400 text-xs">Check</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 flex flex-col h-[90%]">
          <div
            className="flex-1 overflow-y-auto px-[10px] lg:px-[40px] chat-container"
            ref={chatContainerRef}
          >
            {!isAuthenticated && (
              <div className="flex flex-col justify-center items-center h-full text-center">
                <h2 className="text-2xl font-bold mb-3 lg:text-3xl lg:mb-4">Welcome to Imzo AI</h2>
                <p className="text-gray-400 text-sm lg:text-base">{t("pleaseLogin")}</p>
              </div>
            )}
            {isAuthenticated && !chatId && (
              <div className="flex flex-col justify-center items-center h-full text-center">
                <h2 className="text-2xl font-bold mb-3 lg:text-3xl lg:mb-4">Welcome Back!</h2>
                <p className="text-gray-400 text-sm lg:text-base">{t("askanything")}</p>
              </div>
            )}
            {isAuthenticated && !chatId && (
              <div className="mb-[10px] rounded bg-[#2d2d2d] p-2 text-center text-gray-300 text-sm">
                Premium
              </div>
            )}
            {isAuthenticated && chatId && chatHistory.map((chat, index) => {
              const isLastMessage = index === chatHistory.length - 1;
              const responseText = displayedResponse[chat.request] || chat.finalResponse || streamingResponse;
              const finalResponse = isLastMessage && showGemini
                ? renderAssistantResponse(geminiResponse)
                : renderAssistantResponse(responseText);
              const isLoading = isLastMessage && chat.isLoading && !showGemini;

              return (
                <ChatMessage
                  key={index}
                  message={chat.request}
                  initialAssistantMessage={chat.initialAssistantMessage}
                  finalResponse={finalResponse}
                  isLoading={isLoading}
                  isMobile={isMobile}
                />
              );
            })}
          </div>
          <ChatInput
            message={message}
            setMessage={setMessage}
            isAuthenticated={isAuthenticated}
            user={user}
            loading={loading}
            handleSend={handleSend}
            handleFileUpload={handleFileUpload}
            setIsModalVisible={setIsLoginModalVisible}
            isMobile={isMobile}
            isWebSocketConnected={isConnected}
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
      {/* Modal windows */}
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