import React from "react";
import { useTranslation } from "react-i18next";

const TypingAnimation = () => (
  <div className="flex items-center space-x-1">
    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
    <div
      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
      style={{ animationDelay: "0.1s" }}
    ></div>
    <div
      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
      style={{ animationDelay: "0.2s" }}
    ></div>
  </div>
);

const ChatMessage = ({ message, initialAssistantMessage, finalResponse, isLoading, isMobile }) => {
  const { t } = useTranslation();

  return (
    <div className="mb-4 max-w-full mx-auto space-y-2 lg:mb-6 lg:max-w-4xl lg:space-y-4">
      {/* User Message */}
      <div className="flex justify-end items-start space-x-2 space-x-reverse lg:space-x-3">
        <div className="bg-blue-600 border border-blue-700 rounded-xl px-3 py-2 max-w-[70%] shadow-sm text-sm lg:px-4 lg:py-3">
          <p className="text-white leading-relaxed">{message}</p>
        </div>
        <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 lg:w-8 lg:h-8">
          <span className="text-xs font-medium text-white lg:text-sm">You</span>
        </div>
      </div>

      {/* Assistant Response */}
      {(initialAssistantMessage || finalResponse || isLoading) && (
        <div className="flex justify-start items-start space-x-2 lg:space-x-3">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 lg:w-8 lg:h-8">
            <span className="text-xs font-bold text-white lg:text-sm">AI</span>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl px-3 py-2 max-w-[70%] shadow-sm text-sm lg:px-4 lg:py-3">
            <div className="text-gray-100 leading-relaxed space-y-1 lg:space-y-2">
              {initialAssistantMessage && <p>{initialAssistantMessage}</p>}
              {isLoading ? <TypingAnimation /> : finalResponse && <div>{finalResponse}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;