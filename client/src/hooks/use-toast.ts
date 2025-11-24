import { useState, useCallback } from 'react';

export interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

const toasts: Toast[] = [];
let listeners: Array<(toasts: Toast[]) => void> = [];

export function useToast() {
  const [, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = 'default' }: Toast) => {
    const newToast = { title, description, variant };
    toasts.push(newToast);
    listeners.forEach(listener => listener([...toasts]));
    
    setTimeout(() => {
      const index = toasts.indexOf(newToast);
      if (index > -1) {
        toasts.splice(index, 1);
        listeners.forEach(listener => listener([...toasts]));
      }
    }, 3000);
  }, []);

  return { toast, toasts };
}
