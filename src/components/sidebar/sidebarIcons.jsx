import React from 'react';

// SidebarIcons component renders navigation buttons for history, categories, and about sections
const SidebarIcons = ({ setActiveTab, activeTab, navigate }) => {
  return (
    <div className="flex flex-col items-center py-2 border-b border-gray-800 lg:py-4">
      {/* History Button */}
      <button
        onClick={() => setActiveTab('history')}
        className={`p-2 rounded-lg mb-1 transition-colors duration-200 lg:p-3 lg:mb-2 ${
          activeTab === 'history'
            ? 'bg-gray-900/85 text-white'
            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/65'
        }`}
      >
        <svg
          className="w-5 h-5 lg:w-6 lg:h-6"
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
      </button>

      {/* Categories Button */}
      <button
        onClick={() => setActiveTab('categories')}
        className={`p-2 rounded-lg mb-1 transition-colors duration-200 lg:p-3 lg:mb-2 ${
          activeTab === 'categories'
            ? 'bg-gray-900/85 text-white'
            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/65'
        }`}
      >
        <svg
          className="w-5 h-5 lg:w-6 lg:h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* About Button */}
      <button
        onClick={() => navigate('/about')}
        className={`p-2 rounded-lg transition-colors duration-200 lg:p-3 ${
          activeTab === 'about'
            ? 'bg-gray-900/85 text-white'
            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/65'
        }`}
      >
        <svg
          className="w-5 h-5 lg:w-6 lg:h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </div>
  );
};

export default SidebarIcons;