import { memo } from "react";
import { useTranslation } from "react-i18next";
import CategorySidebar from "../categorySidebar";

const SidebarContent = memo(
  ({
    activeTab,
    setIsSidebarOpen,
    fetchChatHistory,
    chatRoomId,
    conversations,
    createChatRoom,
    loading,
    isAuthenticated,
    user,
    navigate,
    handleNewChat,
  }) => {
    const { t } = useTranslation();

    const handleConversationSelect = (convId) => {
      navigate(`/c/${convId}`);
      fetchChatHistory(convId);
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
    };

    const HistoryPanel = () => (
      <div className="flex-1 overflow-y-auto chat-container p-3 lg:p-4">
        <div className="mb-3 lg:mb-4">
          <button
            onClick={handleNewChat}
            disabled={loading || !isAuthenticated || !user?.full_name}
            className={`w-full bg-white text-black font-medium py-2 rounded-xl transition-all hover:bg-gray-200 text-sm lg:py-3 ${
              loading || !isAuthenticated || !user?.full_name ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {t("newChat")}
          </button>
        </div>
        <div className="space-y-2">
          <div className="mb-3 lg:mb-4">
            <h4 className="text-gray-500 text-xs uppercase font-semibold mb-1 lg:mb-2">{t("today")}</h4>
            {isAuthenticated && user?.full_name && conversations
              .filter((conv) => true)
              .slice(0, 3)
              .map((conv) => (
                <div
                  key={conv.id}
                  className={`p-2 rounded-lg cursor-pointer transition-colors duration-200 flex items-center space-x-2 group lg:p-3 lg:space-x-3 ${
                    chatRoomId === conv.id ? "bg-gray-800" : "hover:bg-gray-800/50"
                  }`}
                  onClick={() => handleConversationSelect(conv.id)}
                >
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span className="text-gray-300 text-xs truncate lg:text-sm">{conv.title}</span>
                </div>
              ))}
          </div>
          <div className="mb-3 lg:mb-4">
            <h4 className="text-gray-500 text-xs uppercase font-semibold mb-1 lg:mb-2">{t("yesterday")}</h4>
            {isAuthenticated && user?.full_name && conversations
              .slice(3, 8)
              .map((conv) => (
                <div
                  key={conv.id}
                  className={`p-2 rounded-lg cursor-pointer transition-colors duration-200 flex items-center space-x-2 group lg:p-3 lg:space-x-3 ${
                    chatRoomId === conv.id ? "bg-gray-900/65" : "hover:bg-gray-900/85"
                  }`}
                  onClick={() => handleConversationSelect(conv.id)}
                >
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span className="text-gray-300 text-xs truncate lg:text-sm">{conv.title}</span>
                </div>
              ))}
          </div>
          <div className="mb-3 lg:mb-4">
            <h4 className="text-gray-500 text-xs uppercase font-semibold mb-1 lg:mb-2">{t("previous")}</h4>
            {isAuthenticated && user?.full_name && conversations
              .slice(8)
              .map((conv) => (
                <div
                  key={conv.id}
                  className={`p-2 rounded-lg cursor-pointer transition-colors duration-200 flex items-center space-x-2 group lg:p-3 lg:space-x-3 ${
                    chatRoomId === conv.id ? "bg-gray-800" : "hover:bg-gray-800/50"
                  }`}
                  onClick={() => handleConversationSelect(conv.id)}
                >
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span className="text-gray-300 text-xs truncate lg:text-sm">{conv.title}</span>
                </div>
              ))}
          </div>
        </div>
        {!isAuthenticated && (
          <div className="text-center mt-4 lg:mt-8">
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
    } else if (activeTab === "about") {
      return null;
    }
    return null;
  }
);

export default SidebarContent;