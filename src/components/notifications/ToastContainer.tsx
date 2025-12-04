/**
 * Toast Container Component
 * 
 * Manages and displays multiple toast notifications in a fixed position.
 * Handles stacking and auto-dismissal of toasts.
 */

import React from 'react';
import Toast, { type ToastProps } from './Toast';

interface ToastContainerProps {
  toasts: Omit<ToastProps, 'onClose'>[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
  position = 'top-right',
}) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
    }
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className={`fixed ${getPositionClasses()} z-50 flex flex-col space-y-3 pointer-events-none`}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
