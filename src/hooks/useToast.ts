/**
 * useToast Hook
 * 
 * Provides a simple API for showing toast notifications throughout the application.
 * Manages toast state and auto-dismissal.
 */

import { useState, useCallback } from 'react';
import { type ToastType } from '../components/notifications/Toast';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((
    type: ToastType,
    title: string,
    message?: string,
    duration?: number
  ) => {
    const id = `toast-${++toastId}`;
    const newToast: Toast = {
      id,
      type,
      title,
      message,
      duration: duration ?? 5000,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string, duration?: number) => {
    return addToast('success', title, message, duration);
  }, [addToast]);

  const error = useCallback((title: string, message?: string, duration?: number) => {
    return addToast('error', title, message, duration);
  }, [addToast]);

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    return addToast('warning', title, message, duration);
  }, [addToast]);

  const info = useCallback((title: string, message?: string, duration?: number) => {
    return addToast('info', title, message, duration);
  }, [addToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    success,
    error,
    warning,
    info,
    removeToast,
    clearAll,
  };
};
