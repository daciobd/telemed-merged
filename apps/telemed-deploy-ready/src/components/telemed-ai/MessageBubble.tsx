import type { Message } from "@/components/telemed-ai/hooks/use-telemed-ai";

export default function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${isUser ? "bg-blue-600 text-white dark:bg-blue-700" : "bg-white border border-gray-200 dark:bg-slate-800 dark:border-slate-700"}`} aria-label={isUser ? "Mensagem enviada pelo paciente" : "Mensagem do assistente"}>
        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
        <p className={`text-[11px] mt-1 ${isUser ? "text-blue-100" : "text-gray-400 dark:text-gray-500"}`}>{msg.time}</p>
      </div>
    </div>
  );
}
