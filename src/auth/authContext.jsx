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

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const fullName = localStorage.getItem('full_name');
    const phoneNumber = localStorage.getItem('phone_number');

    if (accessToken && refreshToken && fullName) {
      setUser({ full_name: fullName, phone_number: phoneNumber });
      setIsAuthenticated(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      setUser(null);
      setIsAuthenticated(false);
      delete axios.defaults.headers.common['Authorization'];
    }
    setIsLoading(false);
  };

  const login = (userInfo, tokens) => {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    localStorage.setItem('full_name', userInfo.full_name);
    localStorage.setItem('phone_number', userInfo.phone_number);
    
    setUser(userInfo);
    setIsAuthenticated(true);
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.access_token}`;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('full_name');
    localStorage.removeItem('phone_number');
    
    setUser(null);
    setIsAuthenticated(false);
    
    delete axios.defaults.headers.common['Authorization'];
    
    window.location.reload();
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post('https://imzo-ai.uzjoylar.uz/auth/refresh', {
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