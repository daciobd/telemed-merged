import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const token = localStorage.getItem('consultorio_token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Build URL from all queryKey segments
        // If queryKey is ['/api/path', id], build '/api/path/id'
        const url = queryKey.filter(k => k !== null && k !== undefined).join('/');

        const res = await fetch(url, { headers });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
          throw new Error(errorData.error || `HTTP ${res.status}`);
        }
        return res.json();
      },
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
