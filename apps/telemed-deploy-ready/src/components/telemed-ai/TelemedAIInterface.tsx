import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Clock, FileText, MessageCircle, Mic, Phone, Send, Sun, Moon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import MessageBubble from "@/components/telemed-ai/MessageBubble";
import EmergencyCTA from "@/components/telemed-ai/EmergencyCTA";
import OutOfScopeDialog from "@/components/telemed-ai/OutOfScopeDialog";
import ConsentGate from "@/components/telemed-ai/ConsentGate";
import { useTelemedAI } from "@/components/telemed-ai/hooks/use-telemed-ai";

export default function TelemedAIInterface() {
  const [currentScreen, setCurrentScreen] = useState<"gate" | "home" | "chat" | "emergency">("gate");
  const [consented, setConsented] = useState(false);
  const [dark, setDark] = useState(false);

  const doctor = useMemo(() => ({ name: "Dr. Roberto Silva", specialty: "Cardiologia", lastConsult: "25/09/2025", nextConsult: "25/10/2025" }), []);

  const { messages, inputText, setInputText, cooldown, typing, showOutOfScope, setShowOutOfScope, send } = useTelemedAI(doctor);
  const chatLogRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (currentScreen === "chat") chatLogRef.current?.focus(); }, [currentScreen]);

  const quickQuestions = useMemo(() => ["Como tomar meu medicamento?", "Posso fazer exercícios?", "Quando devo retornar?", "O que significa meu diagnóstico?"], []);

  const Home = (
    <div className="flex flex-col h-full">
      <div className="bg-blue-600 dark:bg-blue-700 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Assistente Telemed</h1>
            <p className="text-blue-100 text-sm mt-1">Tire dúvidas sobre suas orientações</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="icon" onClick={() => setDark((d) => !d)} aria-label="Alternar tema" type="button">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
            <MessageCircle className="h-7 w-7" />
          </div>
        </div>
        <div className="bg-blue-700 dark:bg-blue-800 rounded-xl p-4 mt-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-500 dark:bg-blue-600 rounded-full p-2"><User className="h-5 w-5" /></div>
            <div>
              <p className="font-semibold">{doctor.name}</p>
              <p className="text-sm text-blue-200">{doctor.specialty}</p>
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /><span>Última: {doctor.lastConsult}</span></div>
            <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /><span>Próxima: {doctor.nextConsult}</span></div>
          </div>
        </div>
      </div>
      <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-4 m-4 rounded">
        <div className="flex gap-3">
          <AlertCircle className="text-amber-600 dark:text-amber-500 flex-shrink-0 h-5 w-5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">Este é um assistente de IA</p>
            <p className="text-amber-800 dark:text-amber-200">Posso esclarecer dúvidas sobre orientações já dadas pelo seu médico. Não substituo consulta médica e não avalio sintomas novos.</p>
          </div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Perguntas frequentes:</p>
        <div className="grid grid-cols-2 gap-2">
          {quickQuestions.map((q) => (
            <Button key={q} variant="outline" className="justify-start" onClick={() => { setCurrentScreen("chat"); setTimeout(() => send(q), 0); }} type="button">{q}</Button>
          ))}
        </div>
      </div>
      <div className="mt-auto p-4 space-y-2">
        <Button className="w-full" onClick={() => setCurrentScreen("chat")} type="button"><MessageCircle className="h-4 w-4 mr-2" /> Iniciar Conversa</Button>
        <Button variant="destructive" className="w-full" onClick={() => setCurrentScreen("emergency")} type="button"><Phone className="h-4 w-4 mr-2" /> Preciso Falar com Médico</Button>
      </div>
    </div>
  );

  const Chat = (
    <div className="flex flex-col h-full">
      <div className="bg-blue-600 dark:bg-blue-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="icon" onClick={() => setCurrentScreen("home")} aria-label="Voltar" type="button">←</Button>
          <div>
            <p className="font-semibold">Assistente IA</p>
            <p className="text-xs text-blue-100">Baseado na consulta de {doctor.lastConsult} com {doctor.name}</p>
          </div>
        </div>
        <FileText className="h-5 w-5" />
      </div>
      <div ref={chatLogRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-950" role="log" aria-live="polite" tabIndex={-1}>
        {messages.map((m, i) => <MessageBubble key={i} msg={m} />)}
        {typing && <div className="text-xs text-gray-500 dark:text-gray-400">Assistente digitando…</div>}
      </div>
      <div className="bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800 px-4 py-2">
        <p className="text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5" /><span>Sintomas novos? Clique em "Falar com Médico"</span></p>
      </div>
      <div className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 p-4 sticky bottom-0">
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2" aria-label="Enviar mensagem ao assistente">
          <Button type="button" variant="secondary" size="icon" aria-label="Gravar áudio (beta)"><Mic className="h-5 w-5 text-gray-700 dark:text-gray-300" /></Button>
          <Input value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Digite sua dúvida…" aria-label="Campo de mensagem" />
          <Button type="submit" disabled={cooldown}><Send className="h-4 w-4 mr-1" /> Enviar</Button>
        </form>
        <EmergencyCTA onClick={() => setCurrentScreen("emergency")} />
      </div>
      <OutOfScopeDialog open={showOutOfScope} onClose={() => setShowOutOfScope(false)} onEscalate={() => { setShowOutOfScope(false); setCurrentScreen("emergency"); }} />
    </div>
  );

  const Emergency = (
    <div className="flex flex-col h-full p-6">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-6 mb-6"><Phone className="h-12 w-12 text-red-600 dark:text-red-500" /></div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Encaminhando para Atendimento</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">Vou conectar você com a equipe médica. Enquanto isso, responda:</p>
        <Card className="w-full max-w-md mb-6 border-red-200 dark:border-red-800">
          <CardHeader><CardTitle className="text-red-900 dark:text-red-100">É uma emergência?</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-red-800 dark:text-red-200 mb-4">(Dor no peito, falta de ar, sangramento intenso, confusão mental)</p>
            <div className="space-y-2">
              <Button className="w-full" variant="destructive" type="button">Sim - É Urgente</Button>
              <Button className="w-full" variant="outline" type="button">Não - Posso Aguardar</Button>
            </div>
          </CardContent>
        </Card>
        <Button variant="ghost" onClick={() => setCurrentScreen("home")} type="button">← Voltar</Button>
      </div>
      <Alert className="border-blue-300 dark:border-blue-700">
        <p className="text-sm">Em caso de emergência grave, ligue 192 (SAMU) ou vá ao pronto-socorro mais próximo imediatamente.</p>
      </Alert>
    </div>
  );

  return (
    <div className={dark ? "dark" : undefined}>
      <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden" style={{ height: 700 }}>
        {!consented ? (<ConsentGate onAccepted={() => { setConsented(true); setCurrentScreen("home"); }} />) : (<>{currentScreen === "home" && Home}{currentScreen === "chat" && Chat}{currentScreen === "emergency" && Emergency}</>)}
        <div className="bg-gray-800 dark:bg-slate-950 text-white p-2 flex gap-2 justify-center text-xs">
          <Button onClick={() => setCurrentScreen("home")} variant="secondary" size="sm" type="button">Tela Inicial</Button>
          <Button onClick={() => setCurrentScreen("chat")} variant="secondary" size="sm" type="button">Chat</Button>
          <Button onClick={() => setCurrentScreen("emergency")} variant="secondary" size="sm" type="button">Emergência</Button>
          <Button onClick={() => setDark((d) => !d)} variant="secondary" size="sm" type="button">{dark ? "Tema Claro" : "Tema Escuro"}</Button>
        </div>
      </div>
    </div>
  );
}
