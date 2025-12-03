import { useState, useCallback } from 'react';
import type { Toast, ToastType } from '../components/ui/toast';

let toastIdCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((
    type: ToastType,
    title: string,
    description?: string,
    duration?: number
  ) => {
    const id = `toast-${++toastIdCounter}`;
    const newToast: Toast = {
      id,
      type,
      title,
      description,
      duration: duration ?? 5000,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (title: string, description?: string, duration?: number) => 
      addToast('success', title, description, duration),
    
    error: (title: string, description?: string, duration?: number) => 
      addToast('error', title, description, duration),
    
    warning: (title: string, description?: string, duration?: number) => 
      addToast('warning', title, description, duration),
    
    info: (title: string, description?: string, duration?: number) => 
      addToast('info', title, description, duration),
  };

  return {
    toasts,
    toast,
    removeToast,
  };
}
