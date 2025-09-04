import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import UserDropdown from "./userDropdown";

const Header = ({ isAuthenticated, navigate, changeLanguage, toggleSidebar, toggleHistoryPanel }) => {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get unread notifications count
  const unreadCount = notifications.filter(notification => !notification.is_read).length;

  // Handle language change and persist in localStorage
  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("i18nextLng", lng);
    changeLanguage(lng);
  };

  // Fetch notifications with token
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("user_id");
      const token = localStorage.getItem("access_token");

      if (!userId || !token) {
        console.error("User ID or access token not found");
        return;
      }

      const response = await fetch(`https://imzo-ai.uzjoylar.uz/notifications/list?user_id=${userId}`, {
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.list) {
        setNotifications(data.list);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read with token
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        console.error("Access token not found");
        return;
      }

      const response = await fetch(`https://imzo-ai.uzjoylar.uz/notifications/mark-as-read?id=${notificationId}`, {
        method: 'PUT',
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, is_read: true }
              : notification
          )
        );
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    if (date.toDateString() === yesterday.toDateString()) {
      return `Kecha ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minut oldin`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} soat oldin`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} kun oldin`;
    }
  };

  // Fetch notifications on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Set up interval to fetch notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  return (
    <div className="flex justify-between items-center bg-gray-900/65 backdrop-blur-sm border-b border-gray-800 px-4 py-3 lg:px-6 lg:py-4">
      <div className="flex items-center space-x-3 lg:space-x-4">
        <h1 className="text-lg lg:text-xl font-bold text-white">{t("chatgpt")}</h1>
        <span className="hidden lg:inline text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">v1.20</span>
      </div>
      
      <div className="flex items-center space-x-2 lg:space-x-4">
        {/* Existing components */}
        {isAuthenticated ? (
          <UserDropdown />
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="bg-white hover:bg-blue-700 text-black px-3 py-1 rounded-md font-medium text-sm lg:px-4 lg:py-2 lg:rounded-lg transition-colors duration-200"
          >
            {t("login")}
          </button>
        )}
        
        <select
          value={i18n.language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="bg-gray-900/65 text-white border border-gray-700 rounded-md px-2 py-1 text-xs lg:px-3 lg:py-2 lg:rounded-lg lg:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        {/* Notifications */}
        {isAuthenticated && (
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 max-h-100">
                <div className="px-4 py-3 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">{t("notifications") || "Notifications"}</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto chat-container">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <p className="text-sm">{t("no_notifications") || "No notifications"}</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 border-b border-gray-700 last:border-b-0 cursor-pointer hover:bg-gray-700/50 transition-colors duration-150 ${
                          !notification.is_read ? 'bg-blue-500/10 border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => {
                          if (!notification.is_read) {
                            markAsRead(notification.id);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className={`text-sm font-medium truncate ${
                                !notification.is_read ? 'text-white' : 'text-gray-300'
                              }`}>
                                {notification.title}
                              </h4>
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            <p className={`text-xs mt-1 line-clamp-2 ${
                              !notification.is_read ? 'text-gray-300' : 'text-gray-400'
                            }`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatDate(notification.created)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-700 bg-gray-900/50">
                    <button
                      onClick={() => {
                        // Mark all as read
                        notifications.forEach(notification => {
                          if (!notification.is_read) {
                            markAsRead(notification.id);
                          }
                        });
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                    >
                      {t("mark_all_read") || "Mark all as read"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;