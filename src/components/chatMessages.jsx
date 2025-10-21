import React from "react";

const ChatMessage = ({ message, initialAssistantMessage, finalResponse, isLoading }) => {
  return (
    <div className="my-3 space-y-3">
      {/* User Message */}
      <div className="flex justify-end">
        <div className="bg-[#2d2d2d] rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
          <p className="text-white text-[15px] leading-relaxed">{message}</p>
        </div>
      </div>

      {/* Assistant Response */}
      {(initialAssistantMessage || finalResponse || isLoading) && (
        <div className="flex justify-start">
          <div className="py-3 max-w-[100%]">
            <div className="text-white text-[15px] leading-relaxed space-y-2">
              {isLoading && !initialAssistantMessage && !finalResponse && (
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              )}
              {initialAssistantMessage && <p>{initialAssistantMessage}</p>}
              {finalResponse && <div>{finalResponse}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;