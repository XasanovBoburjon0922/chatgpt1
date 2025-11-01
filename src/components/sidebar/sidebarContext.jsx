import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import CategorySidebar from "../categorySidebar";
import {
  format,
  isToday,
  isYesterday,
  differenceInDays,
  parseISO,
  addHours,
} from "date-fns";

// Sana formatlash uchun xavfsiz funksiya
const parseDateSafely = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return null;

  try {
    const iso = parseISO(dateStr);
    if (!isNaN(iso.getTime())) return iso;
  } catch (e) {}

  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? null : fallback;
};

const SidebarContent = memo(
  ({
    setIsSidebarOpen,
    conversations,
    loading,
    isAuthenticated,
    user,
    handleNewChat,
    onConversationSelect, // Yangi callback
    activeTab,
  }) => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();

    // Tashkent vaqtiga o'tkazish (UTC+5)
    const toTashkentTime = (date) => addHours(date, 5);

    // Sana formatlash: Bugun, Kecha, X kun oldin, yoki dd.MM.yyyy
    const formatChatDate = (createdAt) => {
      const date = parseDateSafely(createdAt);
      if (!date) return { displayDate: t("unknownDate") };

      const zoned = toTashkentTime(date);

      if (isToday(zoned)) return { displayDate: t("today") };
      if (isYesterday(zoned)) return { displayDate: t("yesterday") };

      const daysAgo = differenceInDays(new Date(), zoned);
      if (daysAgo >= 1 && daysAgo <= 7) {
        const key = `daysAgo_${daysAgo}`;
        return { displayDate: t(key) };
      }

      return { displayDate: format(zoned, "dd.MM.yyyy") };
    };

    // Suhbatlarni guruhlash
    const groupConversations = () => {
      if (!Array.isArray(conversations) || conversations.length === 0) {
        return { groups: {}, orderedKeys: [] };
      }

      const groups = {};

      conversations.forEach((conv) => {
        if (!conv?.id) return;

        const { displayDate } = formatChatDate(conv.created_at);
        const key = displayDate;

        if (!groups[key]) groups[key] = [];
        groups[key].push({ ...conv, displayDate });
      });

      // Tartiblash: Bugun → Kecha → 2 kun → ... → 7 kun → eski sanalar
      const orderedKeys = Object.keys(groups).sort((a, b) => {
        const order = { [t("today")]: 0, [t("yesterday")]: 1 };
        const orderA = order[a] ?? Infinity;
        const orderB = order[b] ?? Infinity;

        if (orderA !== orderB) return orderA - orderB;

        const daysA = a.includes("kun") ? parseInt(a.match(/\d+/)?.[0] || "100", 10) : 100;
        const daysB = b.includes("kun") ? parseInt(b.match(/\d+/)?.[0] || "100", 10) : 100;
        return daysA - daysB;
      });

      return { groups, orderedKeys };
    };

    const { groups, orderedKeys } = groupConversations();

    // Suhbat tanlanganda chaqiriladi
    const handleConversationClick = (convId) => {
      onConversationSelect(convId); // Dashboardga xabar beramiz
    };

    // HISTORY PANEL
    const HistoryPanel = () => (
      <div className="flex-1 overflow-y-auto chat-container p-3 lg:p-4">
        {/* New Chat tugmasi */}
        <div className="mb-3 lg:mb-4">
          <button
            onClick={handleNewChat}
            className={`w-full bg-white text-black font-medium py-2 rounded-xl transition-all hover:bg-gray-200 text-sm lg:py-3
            `}
          >
            {t("newChat")}
          </button>
        </div>

        {/* 1. Foydalanuvchi login qilmagan */}
        {!isAuthenticated ? (
          <div className="text-center mt-8 text-gray-500 text-sm">
            {t("loginRequired")}
          </div>
        ) : (
          /* 2. Chat yo'q */
          orderedKeys.length === 0 ? (
            <div className="text-center mt-8 text-gray-500 text-sm">
              {t("noConversations")}
            </div>
          ) : (
            /* 3. Chatlar bor – guruhlab ko'rsatish */
            <div className="space-y-4">
              {orderedKeys.map((dateKey) => (
                <div key={dateKey} className="mb-4">
                  <div className="space-y-1">
                    {groups[dateKey].map((conv) => {
                      const isActive = location.pathname === `/c/${conv.id}`;

                      return (
                        <div
                          key={conv.id}
                          className={`p-2 rounded-lg cursor-pointer transition-colors duration-200 group lg:p-3 ${
                            isActive ? "bg-gray-800" : "hover:bg-gray-800/50"
                          }`}
                          onClick={() => handleConversationClick(conv.id)}
                        >
                          <div className="flex items-start space-x-2 lg:space-x-3">
                            <svg
                              className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-300 text-xs truncate lg:text-sm font-medium">
                                {conv.title || t("untitled")}
                              </p>
                              <p className="text-gray-500 text-xs mt-0.5">
                                {conv.displayDate || t("unknownDate")}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    );
    if (activeTab === "categories") {
      return (
        <CategorySidebar
          onCategorySelect={(category, item) => {
            console.log("Selected category:", category, "item:", item);
            setIsSidebarOpen(false);
          }}
        />
      );
    }
    // RENDER
    if (activeTab === "history") return <HistoryPanel />;

    return null;
  }
);

SidebarContent.displayName = "SidebarContent";

export default SidebarContent;