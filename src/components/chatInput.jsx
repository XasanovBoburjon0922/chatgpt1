import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";

const ChatInput = ({
  message,
  setMessage,
  isAuthenticated,
  user,
  loading,
  handleSend,
  handleFileUpload,
  setIsModalVisible,
  isMobile,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isAuthenticated || !user?.full_name) {
        setIsModalVisible(true);
        return;
      }
      if (selectedFile) {
        handleFileUpload(selectedFile, message);
        setSelectedFile(null);
        setMessage("");
      } else {
        handleSend();
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (file && allowedTypes.includes(file.type)) {
      setSelectedFile(file);
    } else {
      alert(t("invalidFileType"));
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    if (!isAuthenticated || !user?.full_name) {
      setIsModalVisible(true);
      return;
    }
    if (selectedFile) {
      handleFileUpload(selectedFile, message);
      setSelectedFile(null);
      setMessage("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else {
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-800 bg-black/85 p-3 lg:p-4">
      {/* File Preview */}
      {selectedFile && (
        <div className="mb-3 flex items-center justify-between bg-gray-900/50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-gray-300 text-sm">{selectedFile.name}</span>
          </div>
          <button
            onClick={removeFile}
            className="text-gray-400 hover:text-red-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-end space-x-2 lg:space-x-3">
        <div className="flex-1 relative">
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl flex items-end overflow-hidden">
            {/* File Upload Button */}
            <div className="p-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.txt,.doc,.docx"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-800/50"
                title={t("uploadFile")}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </button>
            </div>

            {/* Message Input */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedFile ? t("askAboutDocument") : t("typeMessage")}
              className="flex-1 bg-transparent border-none outline-none resize-none text-white placeholder-gray-500 py-3 px-1 min-h-[44px] max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
              rows="1"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#4a5568 transparent",
              }}
            />
          </div>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || (!message.trim() && !selectedFile)}
          className={`p-2 rounded-xl transition-all duration-200 lg:p-3 ${
            loading || (!message.trim() && !selectedFile)
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-white text-black hover:bg-gray-200"
          }`}
        >
          {loading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="m4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.113 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </div>

      {!isAuthenticated && (
        <div className="text-center mt-3">
          <button
            onClick={() => setIsModalVisible(true)}
            className="text-gray-400 text-sm hover:text-gray-300 transition-colors"
          >
            {t("loginToChat")}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatInput;