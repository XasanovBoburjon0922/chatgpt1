import React, { useState } from 'react';
import { useAuth } from '../auth/authContext';
import { useNavigate } from 'react-router-dom';

const UserDropdown = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleMenuClick = (action) => {
    setIsOpen(false);
    switch (action) {
      case 'profile':
        console.log('Navigate to profile');
        break;
      case 'settings':
        console.log('Navigate to settings');
        break;
      case 'logout':
        logout();
        navigate("/");
        break;
      default:
        break;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-3 bg-black/85 hover:bg-gray-800/50 px-3 py-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div 
          className="w-8 h-8 rounded-full bg-black/85 flex items-center justify-center text-white font-bold text-sm"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          }}
        >
          {getInitials(user?.full_name)}
        </div>
        {/* <span className="hidden md:flex font-medium text-white text-sm">
          {user?.full_name || 'User'}
        </span> */}
        <svg 
          className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full mt-2 w-56 bg-black/85 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl z-20 overflow-hidden">
            <div className="p-3 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  }}
                >
                  {getInitials(user?.full_name)}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{user?.full_name || 'User'}</p>
                  <p className="text-gray-400 text-xs">{user?.phone_number}</p>
                </div>
              </div>
            </div>

            <div className="py-2">
              <button
                onClick={() => handleMenuClick('profile')}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-medium">Profil</span>
              </button>

              <button
                onClick={() => handleMenuClick('settings')}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium">Sozlamalar</span>
              </button>

              <div className="my-2 border-t border-gray-700"></div>

              <button
                onClick={() => handleMenuClick('logout')}
                className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm font-medium">Chiqish</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserDropdown;