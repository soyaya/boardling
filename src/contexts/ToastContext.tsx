/**
 * Toast Context
 * 
 * Provides global toast notification functionality throughout the application.
 * Allows any component to trigger toast notifications.
 */

import React, { createContext, useContext, type ReactNode } from 'react';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/notifications/ToastContainer';

interface ToastContextType {
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  position = 'top-right' 
}) => {
  const { toasts, success, error, warning, info, removeToast, clearAll } = useToast();

  return (
    <ToastContext.Provider value={{ success, error, warning, info, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} position={position} />
    </ToastContext.Provider>
  );
};
