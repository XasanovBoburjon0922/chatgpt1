import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const fullName = localStorage.getItem('full_name');

    if (accessToken && refreshToken && fullName) {
      setUser({ full_name: fullName });
      setIsAuthenticated(true);
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      setUser(null);
      setIsAuthenticated(false);
      delete axios.defaults.headers.common['Authorization'];
    }
    setIsLoading(false);
  };

  const login = (userInfo, tokens) => {
    // Store tokens and user info
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    localStorage.setItem('full_name', userInfo.full_name);
    
    setUser(userInfo);
    setIsAuthenticated(true);
    
    // Set axios default header
    axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.access_token}`;
  };

  const logout = () => {
    // Clear all stored data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('full_name');
    
    setUser(null);
    setIsAuthenticated(false);
    
    // Remove axios default header
    delete axios.defaults.headers.common['Authorization'];
    
    // Refresh the page to reset state
    window.location.reload();
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post('https://backend.amur1.uz/auth/refresh', {
        refresh_token: refreshToken
      });

      const newAccessToken = response.data.access_token;
      localStorage.setItem('access_token', newAccessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
      
      return newAccessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshAccessToken,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};