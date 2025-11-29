import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      setSubmitting(true);
      const res = await fetch("/api/consultorio/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Credenciais inválidas.");
      }

      const body = await res.json();
      await login(body.token);

      if (body.user?.accountType?.includes("doctor")) {
        setLocation("/doctor/dashboard");
      } else {
        setLocation("/");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao fazer login.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 space-y-4">
          <h1 className="text-xl font-semibold text-gray-900">Entrar na TeleMed</h1>
          <p className="text-sm text-gray-600">
            Acesse sua conta de médico ou paciente.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">E-mail</label>
              <Input
                type="email"
                value={email}
                placeholder="seuemail@exemplo.com"
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Senha</label>
              <Input
                type="password"
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button
              type="submit"
              className="w-full mt-2 bg-teal-600 hover:bg-teal-700"
              disabled={submitting}
              data-testid="button-login"
            >
              {submitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center">
            Teste: demo@telemed.com.br / senha123
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
