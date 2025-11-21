import { Routes, Route, Navigate } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import { useEffect } from "react";
import { setupAuth } from "./lib/auth";
import { TokenExpiredAlert } from "./components/auth/token-expired-alert";

function App() {
  useEffect(() => {
    // Inicializar sistema de autenticação JWT do TeleMed
    setupAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <TokenExpiredAlert />
        <Routes>
          {/* Rota principal */}
          <Route path="/" element={<Dashboard />} />
          
          {/* Compatibilidade: /medicaldesk/app -> /medicaldesk/ */}
          <Route path="/app" element={<Navigate to="/" replace />} />
          
          {/* Catch-all: qualquer rota desconhecida -> / */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
