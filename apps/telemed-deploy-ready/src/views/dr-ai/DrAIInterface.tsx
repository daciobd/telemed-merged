import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Clock, MessageCircle, Mic, Phone, Send, ShieldQuestion, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// --- Types ---
type Role = "ai" | "user";

interface Message {
  role: Role;
  text: string;
  time: string;
}

interface DoctorInfo {
  name: string;
  specialty: string;
  lastConsult: string;
  nextConsult: string;
}

// --- Utils ---
const nowHM = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const isInScope = (t: string) => /medicamento|rem[eé]dio|exerc[ií]cio|retornar|diagn[oó]stico|exame|dose|hor[aá]rio/i.test(t);

function auditLog(payload: Record<string, unknown>) {
  console.log("[audit]", payload);
}

// --- Subcomponents ---
function ConsentGate({ onAccepted }: { onAccepted: () => void }) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const accept = () => {
    setLoading(true);
    setTimeout(() => {
      auditLog({ type: "consent", consentType: "IA", accepted: true, ts: new Date().toISOString() });
      onAccepted();
    }, 400);
  };

  return (
    <Card className="m-4" role="region" aria-label="Consentimento da IA" ref={ref} tabIndex={-1}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldQuestion className="h-5 w-5" />
          Consentimento para usar o Assistente de IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="warning">
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription>
            Este assistente <strong>apenas repete e esclarece</strong> orientações já registradas na sua última consulta.
            Ele <strong>não substitui consulta médica</strong> e <strong>não avalia sintomas novos</strong>.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <Checkbox id="consent-ia" checked={checked} onCheckedChange={(v) => setChecked(!!v)} />
            <Label htmlFor="consent-ia" className="leading-6">
              Li e concordo com o uso da IA para esclarecer orientações já dadas pelo meu médico. Sei que posso revogar a qualquer momento.
            </Label>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => window.history.back()} type="button">Cancelar</Button>
          <Button onClick={accept} disabled={!checked || loading} type="button">
            {loading ? "Confirmando..." : "Concordo e quero continuar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser ? "bg-blue-600 text-white" : "bg-white border border-gray-200"
        }`}
        aria-label={isUser ? "Mensagem enviada pelo paciente" : "Mensagem do assistente"}
      >
        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
        <p className={`text-[11px] mt-1 ${isUser ? "text-blue-100" : "text-gray-400"}`}>{msg.time}</p>
      </div>
    </div>
  );
}

function EmergencyCTA({ onClick }: { onClick: () => void }) {
  return (
    <div className="w-full mt-2">
      <Button variant="link" className="w-full text-red-600 p-0 h-auto" onClick={onClick} type="button">
        ⚠️ Preciso de atendimento médico
      </Button>
    </div>
  );
}

function OutOfScopeDialog({ open, onClose, onEscalate }: { open: boolean; onClose: () => void; onEscalate: () => void }) {
  return (
    <Dialog open={open}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pergunta fora do escopo</DialogTitle>
          <DialogDescription>
            Sua pergunta parece não estar coberta pelas orientações da última consulta. Você quer encaminhar para o médico?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="secondary" onClick={onClose} type="button">Continuar no chat</Button>
          <Button onClick={onEscalate} type="button">Encaminhar para o médico</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Component ---
export default function DrAIInterface() {
  const [currentScreen, setCurrentScreen] = useState<"gate" | "home" | "chat" | "emergency">("gate");
  const [consented, setConsented] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Olá, Maria! Sou o assistente do Dr. Silva. Estou aqui para esclarecer dúvidas sobre as orientações da sua última consulta (25/09/2025). Como posso ajudar?",
      time: "14:23",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [cooldown, setCooldown] = useState(false);
  const [showOutOfScope, setShowOutOfScope] = useState(false);
  const [typing, setTyping] = useState(false);
  const chatLogRef = useRef<HTMLDivElement>(null);

  const doctorInfo: DoctorInfo = useMemo(
    () => ({ name: "Dr. Roberto Silva", specialty: "Cardiologia", lastConsult: "25/09/2025", nextConsult: "25/10/2025" }),
    []
  );

  const quickQuestions = useMemo(
    () => ["Como tomar meu medicamento?", "Posso fazer exercícios?", "Quando devo retornar?", "O que significa meu diagnóstico?"],
    []
  );

  useEffect(() => {
    if (currentScreen === "chat") {
      chatLogRef.current?.focus();
    }
  }, [currentScreen]);

  const goChatAndSend = (q: string) => {
    setCurrentScreen("chat");
    setTimeout(() => sendMessage(q), 0);
  };

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || cooldown) return;
    if (trimmed.length > 500) return;

    const ts = nowHM();
    const userMsg: Message = { role: "user", text: trimmed, time: ts };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setCooldown(true);
    setTyping(true);

    auditLog({ type: "question", text: trimmed, ts: new Date().toISOString() });

    const inScope = isInScope(trimmed);
    if (!inScope) setShowOutOfScope(true);

    setTimeout(() => {
      let response = "";
      if (/medicamento|rem[eé]dio/i.test(trimmed)) {
        response = "Com base nas orientações do Dr. Silva em 25/09/2025:\n\nVocê deve tomar Losartana 50mg, 1 comprimido pela MANHÃ, todos os dias.\n\nRecomendação: tomar sempre no mesmo horário, após o café da manhã, com um copo de água.\n\nFicou claro? Tem mais alguma dúvida sobre as orientações da consulta?";
      } else if (/exerc[ií]cio/i.test(trimmed)) {
        response = "Com base nas orientações do Dr. Silva em 25/09/2025:\n\nVocê pode fazer caminhadas leves de 20-30 minutos, 3x por semana. Evite exercícios intensos por enquanto.\n\nSe sentir falta de ar ou cansaço excessivo, pare e descanse.\n\nTem mais alguma dúvida sobre as orientações?";
      } else {
        response = "Entendi sua pergunta. Vou verificar nas orientações registradas pelo Dr. Silva... Pode reformular sua dúvida de outra forma para eu entender melhor?";
      }

      const aiMsg: Message = { role: "ai", text: response, time: nowHM() };
      setMessages((prev) => [...prev, aiMsg]);
      setTyping(false);
      auditLog({ type: "answer", text: response, ts: new Date().toISOString(), flags: { outOfScope: !inScope } });
      setTimeout(() => setCooldown(false), 1800);
    }, 900);
  };

  const handleEscalate = () => {
    setShowOutOfScope(false);
    auditLog({ type: "escalation", reason: "out_of_scope", ts: new Date().toISOString() });
    setCurrentScreen("emergency");
  };

  // --- Screens ---
  if (currentScreen === "gate" && !consented) {
    return <ConsentGate onAccepted={() => { setConsented(true); setCurrentScreen("home"); }} />;
  }

  if (currentScreen === "home") {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-blue-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Assistente Telemed</h1>
              <p className="text-blue-100 text-sm mt-1">Tire dúvidas sobre suas orientações</p>
            </div>
            <MessageCircle className="h-7 w-7" />
          </div>
          <div className="bg-blue-700 rounded-xl p-4 mt-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-500 rounded-full p-2"><User className="h-5 w-5" /></div>
              <div>
                <p className="font-semibold">{doctorInfo.name}</p>
                <p className="text-sm text-blue-200">{doctorInfo.specialty}</p>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /><span>Última: {doctorInfo.lastConsult}</span></div>
              <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /><span>Próxima: {doctorInfo.nextConsult}</span></div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 m-4 rounded">
          <div className="flex gap-3">
            <AlertCircle className="text-amber-600 flex-shrink-0 h-5 w-5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900 mb-1">Este é um assistente de IA</p>
              <p className="text-amber-800">Posso esclarecer dúvidas sobre orientações já dadas pelo seu médico. Não substituo consulta médica e não avalio sintomas novos.</p>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Perguntas frequentes:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickQuestions.map((q) => (
              <Button key={q} variant="outline" className="justify-start h-auto py-3 text-left" onClick={() => goChatAndSend(q)} type="button">
                {q}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-auto p-4 space-y-2">
          <Button className="w-full" onClick={() => setCurrentScreen("chat")} type="button">
            <MessageCircle className="h-4 w-4 mr-2" /> Iniciar Conversa
          </Button>
          <Button variant="destructive" className="w-full" onClick={() => setCurrentScreen("emergency")} type="button">
            <Phone className="h-4 w-4 mr-2" /> Preciso Falar com Médico
          </Button>
        </div>
      </div>
    );
  }

  if (currentScreen === "chat") {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setCurrentScreen("home")} className="text-white hover:bg-blue-700">
              ←
            </Button>
            <div>
              <p className="font-semibold">Assistente IA</p>
              <p className="text-xs text-blue-200">Orientações de {doctorInfo.lastConsult}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" role="log" aria-live="polite" ref={chatLogRef} tabIndex={-1}>
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
          {typing && <div className="text-sm text-gray-500">Assistente está digitando...</div>}
        </div>

        <div className="bg-amber-50 border-t border-amber-200 px-4 py-2">
          <p className="text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Sintomas novos? Clique em "Falar com Médico"</span>
          </p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(inputText); }}
          className="bg-white border-t border-gray-200 p-4 sticky bottom-0"
        >
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="icon" className="rounded-full" aria-label="Gravar áudio (beta)">
              <Mic className="h-5 w-5" />
            </Button>
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite sua dúvida..."
              className="flex-1 rounded-full"
              aria-label="Campo de mensagem"
              disabled={cooldown}
            />
            <Button type="submit" size="icon" className="rounded-full" aria-label="Enviar" disabled={cooldown || !inputText.trim()}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <EmergencyCTA onClick={() => setCurrentScreen("emergency")} />
        </form>

        <OutOfScopeDialog open={showOutOfScope} onClose={() => setShowOutOfScope(false)} onEscalate={handleEscalate} />
      </div>
    );
  }

  if (currentScreen === "emergency") {
    return (
      <div className="flex flex-col h-full p-6">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="bg-red-100 rounded-full p-6 mb-6">
            <Phone className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Encaminhando para Atendimento</h2>
          <p className="text-gray-600 mb-6 max-w-md">Vou conectar você com a equipe médica. Enquanto isso, responda:</p>

          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 w-full max-w-md">
            <p className="font-semibold text-red-900 mb-3">É uma emergência?</p>
            <p className="text-sm text-red-800 mb-4">(Dor no peito, falta de ar, sangramento intenso, confusão mental)</p>
            <div className="space-y-2">
              <Button variant="destructive" className="w-full" type="button">Sim - É Urgente</Button>
              <Button variant="outline" className="w-full text-red-600 border-red-600 hover:bg-red-50" type="button">
                Não - Posso Aguardar
              </Button>
            </div>
          </div>

          <Button variant="ghost" onClick={() => setCurrentScreen("home")} type="button">← Voltar</Button>
        </div>

        <Alert>
          <AlertTitle>Lembre-se:</AlertTitle>
          <AlertDescription>
            Em caso de emergência grave, ligue 192 (SAMU) ou vá ao pronto-socorro mais próximo imediatamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null;
}
