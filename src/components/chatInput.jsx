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
  isMobile,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedMode, setSelectedMode] = useState("FAST");
  const [modeOpen, setModeOpen] = useState(false);

  const modes = [
    { 
      value: "FAST", 
      icon: "🚀",
      label: t("modes.fast.label"),
      description: t("modes.fast.description")
    },
    { 
      value: "DEEP", 
      icon: "💡",
      label: t("modes.deep.label"),
      description: t("modes.deep.description")
    },
    { 
      value: "DOCUMENT_EXPERT", 
      icon: "📄",
      label: t("modes.document.label"),
      description: t("modes.document.description")
    },
    { 
      value: "WEB", 
      icon: "🌐",
      label: t("modes.web.label"),
      description: t("modes.web.description")
    },
  ];

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (selectedFile) {
        handleFileUpload(selectedFile, message);
        setSelectedFile(null);
        setMessage("");
      } else {
        handleSend(message, selectedMode);
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
    if (selectedFile) {
      handleFileUpload(selectedFile, message);
      setSelectedFile(null);
      setMessage("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      handleSend(message, selectedMode);
    }
  };

  const selectedModeData = modes.find(m => m.value === selectedMode);

  return (
    <div className="border-t border-gray-700 bg-black p-2 fixed bottom-0 w-full max-w-[100%] mx-auto lg:max-w-[68%] lg:p-4">
      {/* FILE PREVIEW */}
      {selectedFile && (
        <div className="mb-2 flex items-center justify-between bg-gray-800 p-2 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-white text-xs truncate">📎 {selectedFile.name}</span>
          </div>
          <button onClick={removeFile} className="text-white hover:text-gray-400">
            ✕
          </button>
        </div>
      )}

      <div className="flex items-end space-x-2">
        <div className="flex-1">
          <div className="border bg-[#2d2d2d] border-gray-700 rounded-lg flex items-end">
            {/* FILE BUTTON */}
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
                className="text-white hover:text-gray-400"
              >
                📎
              </button>
            </div>

            {/* TEXTAREA */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedFile ? t("askAboutDocument") : t("typeMessage")}
              className="flex-1 bg-transparent outline-none resize-none
                         text-white placeholder-gray-500 py-2 px-1
                         min-h-[40px] max-h-24 text-xs lg:text-sm"
              rows={1}
            />
          </div>
        </div>

        {/* MODE BUTTON */}
        <div className="relative w-fit">
          <button
            onClick={() => setModeOpen(!modeOpen)}
            className="flex items-center gap-2 bg-[#2d2d2d] hover:bg-[#3a3a3a]
                       text-white px-3 py-2 rounded-lg text-sm
                       border border-gray-700 transition min-w-[100px]"
          >
            <span className="text-base">{selectedModeData?.icon}</span>
            <span className="text-sm">{selectedModeData?.label}</span>
            <svg 
              className={`w-4 h-4 opacity-70 transition-transform ${modeOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {modeOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setModeOpen(false)}
              />
              
              {/* Dropdown */}
              <div className="absolute bottom-full mb-2 left-0 w-72 bg-[#1a1a1a]
                              border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                {modes.map((mode, index) => (
                  <button
                    key={mode.value}
                    onClick={() => {
                      setSelectedMode(mode.value);
                      setModeOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3.5 transition
                      hover:bg-[#2a2a2a] flex items-start gap-3 group
                      ${index !== modes.length - 1 ? 'border-b border-gray-800' : ''}
                      ${selectedMode === mode.value ? "bg-[#2a2a2a]" : ""}`}
                  >
                    <span className="text-2xl mt-0.5">{mode.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium text-sm">
                          {mode.label}
                        </span>
                        {selectedMode === mode.value && (
                          <svg 
                            className="w-5 h-5 text-blue-500" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path 
                              fillRule="evenodd" 
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                              clipRule="evenodd" 
                            />
                          </svg>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {mode.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* SEND */}
        <button
          onClick={handleSubmit}
          disabled={loading || (!message.trim() && !selectedFile)}
          className={`p-2 rounded-lg transition ${
            loading || (!message.trim() && !selectedFile)
              ? "bg-[#2d2d2d] text-gray-500 cursor-not-allowed"
              : "bg-[#2d2d2d] text-white hover:bg-gray-600"
          }`}
        >
          {loading ? "⏳" : "➤"}
        </button>
      </div>

      {!isAuthenticated && (
        <div className="text-center mt-2">
          <button className="text-white text-xs hover:text-gray-400">
            {t("loginToChat")}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatInput;