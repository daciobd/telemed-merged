import { ReactNode, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "wouter";

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: ("doctor" | "patient")[];
}) {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login?redirect=" + encodeURIComponent(location));
    }
    if (!loading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      setLocation("/");
    }
  }, [user, loading, allowedRoles, setLocation, location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-sm">Verificando sessão...</p>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
