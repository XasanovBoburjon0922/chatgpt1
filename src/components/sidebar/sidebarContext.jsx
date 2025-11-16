import { memo, useState, useEffect } from "react";
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
    onConversationSelect,
    activeTab,
  }) => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();

    // === MENING ARIZALARIM ===
    const [applications, setApplications] = useState([]);
    const [appLoading, setAppLoading] = useState(false);
    const [appError, setAppError] = useState(null);
    const [userId, setUserId] = useState(null);
    const [editingApp, setEditingApp] = useState(null);
    const [newName, setNewName] = useState("");

    const toTashkentTime = (date) => addHours(date, 5);

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

    const handleConversationClick = (convId) => {
      onConversationSelect(convId);
    };

    // === Foydalanuvchi ID ===
    useEffect(() => {
      if (!isAuthenticated) return;

      const fetchUser = async () => {
        try {
          const res = await fetch("https://imzo-ai.uzjoylar.uz/users/me", {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            setUserId(data.id);
          }
        } catch (err) {
          console.error("User fetch error:", err);
        }
      };

      fetchUser();
    }, [isAuthenticated]);

    // === Arizalarni yuklash ===
    useEffect(() => {
      if (!userId || activeTab !== "applications") return;

      const fetchApplications = async () => {
        setAppLoading(true);
        setAppError(null);
        try {
          const res = await fetch(
            `https://imzo-ai.uzjoylar.uz/application-user/list?user_id=${userId}`,
            { credentials: "include" }
          );
          if (res.ok) {
            const data = await res.json();
            setApplications(Array.isArray(data) ? data : []);
          } else {
            setAppError(t("failedToLoadApplications"));
          }
        } catch (err) {
          setAppError(t("networkError"));
        } finally {
          setAppLoading(false);
        }
      };

      fetchApplications();
    }, [userId, activeTab, t]);

    // === Nom o‘zgartirish ===
    const handleUpdateName = async () => {
      if (!editingApp || !newName.trim()) return;

      try {
        const res = await fetch(
          `https://imzo-ai.uzjoylar.uz/application-user/update?id=${editingApp.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ name: newName.trim() }),
          }
        );

        if (res.ok) {
          setApplications((prev) =>
            prev.map((app) =>
              app.id === editingApp.id ? { ...app, name: newName.trim() } : app
            )
          );
          setEditingApp(null);
          setNewName("");
        } else {
          alert(t("failedToUpdate"));
        }
      } catch (err) {
        alert(t("failedToUpdate"));
      }
    };

    // === O‘chirish ===
    const handleDelete = async (id) => {
      if (!window.confirm(t("confirmDelete"))) return;

      try {
        const res = await fetch(
          `https://imzo-ai.uzjoylar.uz/application-user/delete?id=${id}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        if (res.ok) {
          setApplications((prev) => prev.filter((app) => app.id !== id));
        } else {
          alert(t("failedToDelete"));
        }
      } catch (err) {
        alert(t("failedToDelete"));
      }
    };

    // === HISTORY PANEL ===
    const HistoryPanel = () => (
      <div className="flex-1 overflow-y-auto chat-container p-3 lg:p-4">
        <div className="mb-3 lg:mb-4">
          <button
            onClick={handleNewChat}
            className="w-full bg-white text-black font-medium py-2 rounded-xl transition-all hover:bg-gray-200 text-sm lg:py-3"
          >
            {t("newChat")}
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="text-center mt-8 text-gray-500 text-sm">{t("loginRequired")}</div>
        ) : orderedKeys.length === 0 ? (
          <div className="text-center mt-8 text-gray-500 text-sm">{t("noConversations")}</div>
        ) : (
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
                          <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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
        )}
      </div>
    );

    // === ARIZALAR PANELI ===
    const ApplicationsPanel = () => (
      <div className="flex-1 overflow-y-auto chat-container p-3 lg:p-4">
        <h3 className="text-lg font-semibold text-white mb-3">{t("myApplications")}</h3>

        {appLoading ? (
          <div className="text-center text-gray-400 py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-white"></div>
          </div>
        ) : appError ? (
          <div className="text-center text-red-400 text-sm py-8">{appError}</div>
        ) : applications.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">{t("noApplications")}</div>
        ) : (
          <div className="space-y-2">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {editingApp?.id === app.id ? (
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleUpdateName()}
                        onBlur={handleUpdateName}
                        className="bg-gray-700 text-white px-2 py-1 rounded text-sm w-full"
                        autoFocus
                      />
                    ) : (
                      <a
                        href={app.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 text-sm font-medium hover:text-white truncate block"
                      >
                        {app.name}
                      </a>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {editingApp?.id === app.id ? (
                      <>
                        <button onClick={handleUpdateName} className="p-1 text-green-400 hover:text-green-300">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setEditingApp(null);
                            setNewName("");
                          }}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingApp(app);
                            setNewName(app.name.replace(/\.[^/.]+$/, "")); // .pdf ni olib tashlash
                          }}
                          className="p-1 text-blue-400 hover:text-blue-300"
                          title={t("edit")}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="p-1 text-red-400 hover:text-red-300"
                          title={t("delete")}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );

    // === RENDER ===
    if (activeTab === "categories") {
      return (
        <CategorySidebar
          onCategorySelect={(category, item) => {
            setIsSidebarOpen(false);
          }}
        />
      );
    }

    if (activeTab === "history") return <HistoryPanel />;

    if (activeTab === "applications") {
      if (!isAuthenticated) {
        return (
          <div className="flex-1 flex items-center justify-center p-4 text-center text-gray-500 text-sm">
            {t("loginRequired")}
          </div>
        );
      }
      return <ApplicationsPanel />;
    }

    return null;
  }
);

SidebarContent.displayName = "SidebarContent";

export default SidebarContent;