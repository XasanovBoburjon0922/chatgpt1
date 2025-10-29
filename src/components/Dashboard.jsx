"use client";
import { useState, useEffect, useRef } from "react";
import { api, verifyApi } from "../api/api";
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
  const { isAuthenticated, user } = useAuth();
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newResponse, setNewResponse] = useState(null);
  const [displayedResponse, setDisplayedResponse] = useState({});
  const [streamingResponse, setStreamingResponse] = useState("");
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("history");
  const [pendingMessage, setPendingMessage] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportChatHistory, setSupportChatHistory] = useState([]);
  const [userId, setUserId] = useState(null);

  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;
  const connectionTimeout = 10000;
  const chatContainerRef = useRef(null);
  const supportChatContainerRef = useRef(null);
  const isUserScrolling = useRef(false);
  const navigate = useNavigate();
  const { chatId } = useParams();
  const location = useLocation();
  const [showGemini, setShowGemini] = useState(false);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  // Fetch user_id from /users/me
  useEffect(() => {
    const fetchUserId = async () => {
      if (!isAuthenticated) return;
      try {
        const response = await api.get("/users/me", {
          headers: { "Content-Type": "application/json" },
        });
        if (response.status === 200) {
          setUserId(response.data.id);
        }
      } catch (error) {
        console.error("Error fetching user ID:", error);
        if (error.response?.status === 401) {
          navigate("/login");
        } else {
          toast.error(t("failedToFetchUserId"), { theme: "dark", position: "top-center" });
        }
      }
    };
    fetchUserId();
  }, [isAuthenticated, navigate, t]);

  // Fetch support chat history when modal opens
  useEffect(() => {
    const fetchSupportChatHistory = async () => {
      if (!isAuthenticated || !userId || !isSupportModalOpen) return;
      try {
        setLoading(true);
        const response = await api.get(`/support/chat?id=${userId}`, {
          headers: { "Content-Type": "application/json" },
        });
        if (response.status === 200) {
          const messages = response.data || [];
          setSupportChatHistory(
            messages.map((msg) => ({
              id: msg.id,
              user_id: msg.user_id,
              user_message: msg.user_message,
              support_message: msg.support_message,
              created_at: msg.created_at,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching support chat history:", error);
        if (error.response?.status === 401) {
          navigate("/login");
        } else {
          toast.error(t("failedToFetchSupportHistory"), { theme: "dark", position: "top-center" });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSupportChatHistory();
  }, [isSupportModalOpen, isAuthenticated, userId, navigate, t]);

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
    if (!isAuthenticated || !roomId || reconnectAttempts >= maxReconnectAttempts) {
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
        } else if (data.type === "gemini" && data.response && typeof data.response === "string") {
          const geminiText = data.response;
          if (showGemini) {
            setPendingChunks((prev) => prev + geminiText);
          } else {
            setStreamingResponse((prev) => prev + geminiText);
            setChatHistory((prev) =>
              prev.map((item, index) =>
                index === prev.length - 1
                  ? { ...item, finalResponse: (item.finalResponse || "") + geminiText, isLoading: true }
                  : item
              )
            );
          }
        } else if (data.status === "end") {
          setLoading(false);
          setChatHistory((prev) =>
            prev.map((item, index) =>
              index === prev.length - 1 ? { ...item, isLoading: false } : item
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
    if (isAuthenticated && chatId) {
      connectWebSocket(chatId);
      return () => {
        if (ws) {
          ws.close();
          setWs(null);
          setIsConnected(false);
        }
      };
    }
  }, [isAuthenticated, chatId]);

  const handleFileUpload = async (file, question) => {
    if (!file || !question) {
      toast.error(t("fileAndQuestionRequired"), { theme: "dark", position: "top-center" });
      return;
    }
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("question", question);
    try {
      const response = await api.post("/get/pdf/analysis", formData, {
        headers: { Accept: "application/json", "Content-Type": "multipart/form-data" },
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
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await api.get(`/get/pdf/analysis/${analysisId}`, {
          headers: { "Content-Type": "application/json" },
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

  const handleSendSupportMessage = async () => {
    if (!supportMessage.trim()) {
      toast.error(t("messageEmpty"), { theme: "dark", position: "top-center" });
      return;
    }
    if (!isAuthenticated) {
      setIsLoginModalVisible(true);
      return;
    }
    if (!userId) {
      toast.error(t("userIdNotFound"), { theme: "dark", position: "top-center" });
      return;
    }
    try {
      setLoading(true);
      const response = await api.post(
        "/support/send",
        {
          support_message: "",
          user_id: userId,
          user_message: supportMessage,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.status === 200) {
        setSupportChatHistory((prev) => [
          ...prev,
          {
            id: response.data.id || Date.now().toString(),
            user_id: userId,
            user_message: supportMessage,
            support_message: "",
            created_at: new Date().toISOString(),
          },
        ]);
        setSupportMessage("");
      }
    } catch (error) {
      console.error("Error sending support message:", error);
      toast.error(t("failedToSendSupportMessage"), { theme: "dark", position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleConversationSelect = (convId) => {
    navigate(`/c/${convId}`);
    fetchChatHistory(convId);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  useEffect(() => {
    if (isAuthenticated && pendingMessage) {
      setMessage(pendingMessage);
      handleSend();
      setPendingMessage(null);
    }
  }, [isAuthenticated, pendingMessage]);

  useEffect(() => {
    if (isAuthenticated) {
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
  }, [isAuthenticated, chatId]);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;
    const handleScroll = () => {
      const isAtBottom =
        chatContainer.scrollHeight - chatContainer.scrollTop <= chatContainer.clientHeight + 50;
      isUserScrolling.current = !isAtBottom;
    };
    chatContainer.addEventListener("scroll", handleScroll);
    if (!isUserScrolling.current) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    return () => {
      chatContainer.removeEventListener("scroll", handleScroll);
    };
  }, [chatHistory, displayedResponse, streamingResponse, showGemini]);

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
              item.request === request ? { ...item, finalResponse: fullText, isLoading: false } : item
            )
          );
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
      const response = await api.get(`/chat/user_id`, {
        headers: { "Content-Type": "application/json" },
      });
      const { chat_rooms } = response.data;
      setConversations(
        chat_rooms.map((room) => ({
          id: room.id,
          title: room.title,
          created_at: room.created_at,
        }))
      );
    } catch (error) {
      console.error("Error fetching chat rooms:", error, error.response?.data);
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
    if (!isAuthenticated || !roomId) return;
    try {
      setLoading(true);
      const response = await api.get(`/chat/message?id=${roomId}`, {
        headers: { "Content-Type": "application/json" },
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
    if (!isAuthenticated) return null;
    try {
      setLoading(true);
      const response = await api.post(
        "/chat/room/create",
        {
          phone_number: user.phone_number,
          title: firstMessage?.substring(0, 50) || "New Chat",
        },
        { headers: { "Content-Type": "application/json" } }
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
    if (!isAuthenticated) {
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

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;
    let scrollTimeout;
    const handleScroll = () => {
      const isAtBottom =
        chatContainer.scrollHeight - chatContainer.scrollTop <= chatContainer.clientHeight + 50;
      isUserScrolling.current = !isAtBottom;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isUserScrolling.current = false;
      }, 2000);
    };
    chatContainer.addEventListener("scroll", handleScroll);
    return () => {
      chatContainer.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [chatHistory, streamingResponse, displayedResponse]);

  // Auto-scroll for support chat
  useEffect(() => {
    const supportContainer = supportChatContainerRef.current;
    if (!supportContainer) return;
    supportContainer.scrollTop = supportContainer.scrollHeight;
  }, [supportChatHistory]);

  const renderAssistantResponse = (responseText) => {
    if (!responseText) return null;
    const lines = responseText.split(/\n+/).filter((line) => line.trim());
    return lines.map((line, index) => {
      let formattedLine = line;
      formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      formattedLine = formattedLine.replace(/\*(.*?)\*/g, "<em>$1</em>");
      formattedLine = formattedLine.replace(/^## (.*)$/gm, "<h2>$1</h2>");
      formattedLine = formattedLine.replace(/^### (.*)$/gm, "<h2>$1</h2>");
      formattedLine = formattedLine.replace(/^#### (.*)$/gm, "<h2>$1</h2>");
      formattedLine = formattedLine.replace(/^---$/gm, "<hr />");
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
                onConversationSelect={handleConversationSelect}
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
                  <span className="text-white text-sm font-medium">User</span>
                  <span className="ml-1 text-blue-400 text-xs">Check</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 flex flex-col h-[90%]">
          <div
            className="flex-1 overflow-y-auto mx-auto w-[80%] px-[10px] lg:px-[40px] chat-container"
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
            {isAuthenticated &&
              chatId &&
              chatHistory.map((chat, index) => {
                const isLastMessage = index === chatHistory.length - 1;
                const responseText = displayedResponse[chat.request] || chat.finalResponse;
                const finalResponseText = isLastMessage ? (responseText || streamingResponse) : responseText;
                const finalResponse = renderAssistantResponse(finalResponseText);
                const isLoading = isLastMessage && chat.isLoading;
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
            isMobile={isMobile}
            isWebSocketConnected={isConnected}
          />
        </div>
      </div>

      {/* Support Icon */}
      <button
        className="fixed bottom-[80px] right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors duration-200"
        onClick={() => setIsSupportModalOpen(true)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5v-2a2 2 0 012-2h10a2 2 0 012 2v2h-4m-6 0h6m-7 4h8a2 2 0 002-2v-2H5v2a2 2 0 002 2z"
          />
        </svg>
      </button>

      {/* Support Modal */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-700 p-5 w-full max-w-md h-[85vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{t("supportChat")}</h3>
                  <p className="text-xs text-green-400">Online</p>
                </div>
              </div>
              <button
                onClick={() => setIsSupportModalOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat Messages */}
            <div
              className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar"
              ref={supportChatContainerRef}
            >
              {supportChatHistory.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm">{t("noSupportMessages")}</p>
                  <p className="text-xs mt-1">{t("startConversation")}</p>
                </div>
              ) : (
                supportChatHistory.map((msg, index) => (
                  <div
                    key={msg.id || index}
                    className={`flex ${msg.user_message ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl shadow-md transition-all duration-200 ${msg.user_message
                          ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                          : "bg-gradient-to-r from-gray-700 to-gray-800 text-gray-100"
                        }`}
                    >
                      <p className="text-sm font-medium break-words">
                        {msg.user_message || msg.support_message}
                      </p>
                      <p className="text-xs opacity-70 mt-1 text-right">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="flex items-center mt-4 gap-2">
              <input
                type="text"
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendSupportMessage()}
                placeholder={t("typeSupportMessage")}
                className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 transition placeholder-gray-500 text-sm"
                disabled={loading}
              />
              <button
                onClick={handleSendSupportMessage}
                disabled={loading || !supportMessage.trim()}
                className={`p-3 rounded-xl transition-all duration-200 ${supportMessage.trim() && !loading
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                  }`}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {(isSidebarOpen || isHistoryOpen) && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => {
            setIsSidebarOpen(false);
            setIsHistoryOpen(false);
          }}
        />
      )}
      {!isAuthenticated && (
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