import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCircle2,
  Search,
  Brain,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
} from "lucide-react";

type SectionType = "meu-medico" | "bids" | "dr-ai" | null;

function PatientOnboardingCard() {
  const [openSection, setOpenSection] = useState<SectionType>("meu-medico");

  const toggle = (section: SectionType) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
      data-testid="patient-onboarding-card"
    >
      <div className="flex items-start gap-2">
        <Info className="h-5 w-5 text-sky-500 mt-1 flex-shrink-0" />
        <div>
          <h2 className="text-base md:text-lg font-semibold text-sky-700 dark:text-sky-400">
            Bem-vindo(a) ao TeleMed – Guia Rápido do Paciente
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mt-1 text-sm leading-relaxed">
            Você pode usar o TeleMed para consultar o seu médico de confiança ou encontrar um
            novo médico usando o sistema de ofertas (<strong>bids</strong>). Veja abaixo como
            funciona na prática.
          </p>
        </div>
      </div>

      <div className="mt-4 grid md:grid-cols-3 gap-4">
        {/* Meu médico */}
        <div className="bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800 rounded-lg">
          <button
            type="button"
            onClick={() => toggle("meu-medico")}
            className="w-full flex items-center justify-between px-4 py-3"
            data-testid="toggle-meu-medico"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-300">
                <UserCircle2 className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">Consultar meu médico</p>
                <p className="text-[11px] text-sky-900/70 dark:text-sky-400/70">Link direto e sala de espera</p>
              </div>
            </div>
            {openSection === "meu-medico" ? (
              <ChevronUp className="h-4 w-4 text-sky-700 dark:text-sky-300" />
            ) : (
              <ChevronDown className="h-4 w-4 text-sky-700 dark:text-sky-300" />
            )}
          </button>

          <AnimatePresence initial={false}>
            {openSection === "meu-medico" && (
              <motion.div
                key="meu-medico"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 pb-4 text-xs text-gray-700 dark:text-gray-300 space-y-2 overflow-hidden"
              >
                <p>
                  Se o seu médico já atende no TeleMed, você recebe um link direto para a{" "}
                  <strong>Sala de Espera</strong>. No horário combinado, basta entrar e aguardar
                  ser chamado.
                </p>
                <p>
                  Você continua com o mesmo médico, mas com a praticidade da consulta online.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sistema de ofertas (bids) */}
        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-lg">
          <button
            type="button"
            onClick={() => toggle("bids")}
            className="w-full flex items-center justify-between px-4 py-3"
            data-testid="toggle-bids"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                <Search className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Encontrar médico (bids)</p>
                <p className="text-[11px] text-emerald-900/70 dark:text-emerald-400/70">Várias opções, você escolhe</p>
              </div>
            </div>
            {openSection === "bids" ? (
              <ChevronUp className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
            ) : (
              <ChevronDown className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
            )}
          </button>

          <AnimatePresence initial={false}>
            {openSection === "bids" && (
              <motion.div
                key="bids"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 pb-4 text-xs text-gray-700 dark:text-gray-300 space-y-2 overflow-hidden"
              >
                <p>
                  Você descreve o motivo da consulta e os horários em que pode ser atendido.
                  Médicos disponíveis podem enviar <strong>ofertas de atendimento</strong> com
                  horário e valor.
                </p>
                <p>
                  Você compara e escolhe o profissional que preferir. Não é leilão de quem cobra
                  menos — é mais opção e transparência.
                </p>
                <a
                  href="/paciente/como-funciona-bids.html"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-semibold hover:underline"
                  data-testid="link-como-funciona-bids"
                >
                  Entender o sistema de ofertas
                  <ExternalLink className="h-3 w-3" />
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dr. AI / Registro de Saúde */}
        <div className="bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800 rounded-lg">
          <button
            type="button"
            onClick={() => toggle("dr-ai")}
            className="w-full flex items-center justify-between px-4 py-3"
            data-testid="toggle-dr-ai"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300">
                <Brain className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">Dr. AI & Registro de Saúde</p>
                <p className="text-[11px] text-violet-900/70 dark:text-violet-400/70">Organiza seu histórico</p>
              </div>
            </div>
            {openSection === "dr-ai" ? (
              <ChevronUp className="h-4 w-4 text-violet-700 dark:text-violet-300" />
            ) : (
              <ChevronDown className="h-4 w-4 text-violet-700 dark:text-violet-300" />
            )}
          </button>

          <AnimatePresence initial={false}>
            {openSection === "dr-ai" && (
              <motion.div
                key="dr-ai"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 pb-4 text-xs text-gray-700 dark:text-gray-300 space-y-2 overflow-hidden"
              >
                <p>
                  Se você desejar, pode responder a perguntas guiadas pelo{" "}
                  <strong>Dr. AI</strong>. Isso não substitui o médico, mas ajuda a organizar
                  seus sintomas e histórico.
                </p>
                <p>
                  As informações importantes ficam registradas de forma segura no seu{" "}
                  <strong>Registro de Saúde (PHR)</strong>, para que você e seu médico possam
                  acompanhar ao longo do tempo.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default PatientOnboardingCard;
