import React, { createContext, useContext, useState, ReactNode } from 'react';
import styled from 'styled-components';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NotificationContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 350px;
`;

const NotificationItem = styled.div<{ type: Notification['type'] }>`
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  animation: slideIn 0.3s ease-out;
  background-color: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.text};
  
  ${({ type, theme }) => {
    switch (type) {
      case 'success':
        return `
          border-left: 4px solid #444444;
        `;
      case 'error':
        return `
          border-left: 4px solid #777777;
        `;
      case 'warning':
        return `
          border-left: 4px solid #666666;
        `;
      case 'info':
      default:
        return `
          border-left: 4px solid #555555;
        `;
    }
  }}
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  margin-left: 10px;
  
  &:hover {
    opacity: 1;
  }
`;

const MessageContent = styled.div`
  flex: 1;
`;

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const duration = notification.duration || 5000;
    
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <NotificationContainer>
        {notifications.map(notification => (
          <NotificationItem key={notification.id} type={notification.type}>
            <MessageContent>{notification.message}</MessageContent>
            <CloseButton onClick={() => removeNotification(notification.id)}>×</CloseButton>
          </NotificationItem>
        ))}
      </NotificationContainer>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext; 