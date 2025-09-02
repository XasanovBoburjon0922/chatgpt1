import { useTranslation } from "react-i18next";
import UserDropdown from "./userDropdown";

const Header = ({ isAuthenticated, navigate, changeLanguage, toggleSidebar, toggleHistoryPanel }) => {
  const { t, i18n } = useTranslation();

  // Handle language change and persist in localStorage
  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("i18nextLng", lng);
    changeLanguage(lng); // Call parent component's changeLanguage function
  };

  return (
    <div className="flex justify-between items-center bg-gray-900/65 backdrop-blur-sm border-b border-gray-800 px-4 py-3 lg:px-6 lg:py-4">
      <div className="flex items-center space-x-3 lg:space-x-4">
        <h1 className="text-lg lg:text-xl font-bold text-white">{t("chatgpt")}</h1>
        <span className="hidden lg:inline text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">v1.20</span>
      </div>
      <div className="flex items-center space-x-2 lg:space-x-4">
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
          value={i18n.language} // Reflect current language
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
      </div>
    </div>
  );
};

export default Header;