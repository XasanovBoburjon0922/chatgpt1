import React from 'react';
import { Dropdown, Avatar, Typography, Menu } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '../auth/authContext';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

const UserDropdown = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate()

  const handleMenuClick = ({ key }) => {
    switch (key) {
      case 'profile':
        console.log('Navigate to profile');
        break;
      case 'settings':
        console.log('Navigate to settings');
        break;
      case 'logout':
          logout();
          navigate("/dashboard")
        break;
      default:
        break;
    }
  };

  const menu = (
    <Menu
      onClick={handleMenuClick}
      className="!bg-gray-700 !border-gray-600"
      items={[
        {
          key: 'profile',
          icon: <UserOutlined className="text-gray-300" />,
          label: (
            <Text className="!text-gray-300 hover:!text-white">
              Profil
            </Text>
          ),
        },
        {
          key: 'settings',
          icon: <SettingOutlined className="text-gray-300" />,
          label: (
            <Text className="!text-gray-300 hover:!text-white">
              Sozlamalar
            </Text>
          ),
        },
        {
          type: 'divider',
        },
        {
          key: 'logout',
          icon: <LogoutOutlined className="text-red-400" />,
          label: (
            <Text className="!text-red-400 hover:!text-red-300">
              Chiqish
            </Text>
          ),
        },
      ]}
    />
  );

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dropdown
      overlay={menu}
      trigger={['click']}
      placement="bottomRight"
      overlayClassName="user-dropdown"
    >
      <div className="flex items-center space-x-2 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors cursor-pointer">
        <Avatar
          size="small"
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          {getInitials(user?.full_name)}
        </Avatar>
        <Text className="font-medium !text-white text-sm">
          {user?.full_name || 'User'}
        </Text>
      </div>
    </Dropdown>
  );
};

export default UserDropdown;