import { useState } from "react";
import { answers, auditLog } from "@/components/telemed-ai/api";

export type Role = "ai" | "user";
export interface Message { role: Role; text: string; time: string }
export interface DoctorInfo { name: string; specialty: string; lastConsult: string; nextConsult: string }

const nowHM = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const MAX_LEN = 500;

export function useTelemedAI(initialDoctor: DoctorInfo) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Olá, Maria! Sou o assistente do Dr. Silva. Estou aqui para esclarecer dúvidas sobre as orientações da sua última consulta (25/09/2025). Como posso ajudar?", time: "14:23" },
  ]);
  const [inputText, setInputText] = useState("");
  const [cooldown, setCooldown] = useState(false);
  const [typing, setTyping] = useState(false);
  const [showOutOfScope, setShowOutOfScope] = useState(false);

  const send = async (text?: string) => {
    const trimmed = (text ?? inputText).trim();
    if (!trimmed || cooldown) return;
    if (trimmed.length > MAX_LEN) return;

    const ts = nowHM();
    setMessages((prev) => [...prev, { role: "user", text: trimmed, time: ts }]);
    setInputText("");
    setCooldown(true);
    setTyping(true);
    auditLog({ type: "question", text: trimmed, ts: new Date().toISOString() });

    const { answer, flags } = await answers(trimmed);
    setMessages((prev) => [...prev, { role: "ai", text: answer, time: nowHM() }]);
    setTyping(false);
    auditLog({ type: "answer", text: answer, ts: new Date().toISOString(), flags });
    if (flags?.outOfScope) setShowOutOfScope(true);
    setTimeout(() => setCooldown(false), 1500);
  };

  return { messages, inputText, setInputText, cooldown, typing, showOutOfScope, setShowOutOfScope, send, doctor: initialDoctor };
}
