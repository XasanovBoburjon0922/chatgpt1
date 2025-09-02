import { useTranslation } from "react-i18next";

const ChatInput = ({ message, setMessage, isAuthenticated, user, loading, handleSend, setIsModalVisible, isMobile }) => {
  const { t } = useTranslation();

  return (
    <div className="px-4 pb-4 lg:px-6 lg:pb-6">
      <div className="max-w-full mx-auto lg:max-w-4xl">
        <div className="bg-gray-900/45 border border-gray-700 rounded-2xl p-3 lg:p-4 backdrop-blur-sm">
          <div className="flex items-end space-x-2 lg:space-x-4">
            <div className="flex-1">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isAuthenticated && user?.full_name ? t("askanything") : t("askanything")}
                disabled={loading}
                className="w-full bg-transparent text-white placeholder-gray-400 border-none outline-none resize-none min-h-[20px] max-h-24 text-sm lg:max-h-32"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (isAuthenticated && user?.full_name) {
                      handleSend();
                    } else {
                      setIsModalVisible(true);
                    }
                  }
                }}
              />
            </div>
            <div className="flex items-center space-x-2">
              {isMobile ? (
                <button
                  onClick={() => {
                    if (isAuthenticated && user?.full_name) {
                      handleSend();
                    } else {
                      setIsModalVisible(true);
                    }
                  }}
                  disabled={!message.trim() || loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              ) : (
                <>
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
                        handleSend();
                      } else {
                        setIsModalVisible(true);
                      }
                    }}
                    disabled={!message.trim() || loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;