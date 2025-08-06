import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/authContext';
import { Spin } from 'antd';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center bg-gray-900 min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;