import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router } from "wouter";
import { AuthProvider } from "./contexts/AuthContext";
import App from "./App";
import "./index.css";

// Base path para o Consultório Virtual (deve ser igual ao vite.config.ts)
const BASE_PATH = "/consultorio";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const token = localStorage.getItem("consultorio_token");
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        // Build URL from all queryKey segments
        // If queryKey is ['/api/path', id], build '/api/path/id'
        const url = queryKey
          .filter((k) => k !== null && k !== undefined)
          .join("/");

        const res = await fetch(url, { headers });
        if (!res.ok) {
          const errorData = await res
            .json()
            .catch(() => ({ error: "Erro desconhecido" }));
          throw new Error(errorData.error || `HTTP ${res.status}`);
        }
        return res.json();
      },
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// ===== Captura query params do meet e guarda em sessionStorage =====
// ===== Captura query params do meet e guarda em sessionStorage =====
const params = new URLSearchParams(window.location.search);
const meet = (params.get("meet") || "").trim();
const token = (params.get("t") || "").trim();
const role = (params.get("role") || "patient").trim();

if (meet && token) {
  sessionStorage.setItem("meet_token", token);
  sessionStorage.setItem("meet_role", role || "patient");
  sessionStorage.setItem("meet_id", meet);

  // Limpa query params e redireciona para rota do MeetRoom (mantém BASE_PATH)
  window.history.replaceState(
    {},
    "",
    `${BASE_PATH}/meetroom/${encodeURIComponent(meet)}`,
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router base={BASE_PATH}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  </StrictMode>,
);
