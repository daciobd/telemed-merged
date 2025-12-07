import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope,
  ShoppingCart,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
} from "lucide-react";

type SectionType = "consultorio" | "marketplace" | "analytics" | null;

function TelemedOnboardingCard() {
  const [openSection, setOpenSection] = useState<SectionType>("consultorio");

  const toggle = (section: SectionType) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
      data-testid="bloco-educacional"
    >
      <div className="flex items-start gap-2">
        <Info className="h-5 w-5 text-amber-500 mt-1 flex-shrink-0" />
        <div>
          <h2 className="text-base md:text-lg font-semibold text-teal-700 dark:text-teal-400">
            Bem-vindo(a) ao TeleMed – Guia Rápido do Médico
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mt-1 text-sm leading-relaxed">
            Aqui você encontra tudo o que precisa para usar a plataforma como{" "}
            <strong>consultório virtual completo</strong> e, se desejar, também para{" "}
            <strong>receber novos pacientes através do Marketplace</strong>.
          </p>
        </div>
      </div>

      <div className="mt-4 grid md:grid-cols-3 gap-4">
        {/* Consultório Virtual */}
        <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800 rounded-lg">
          <button
            type="button"
            onClick={() => toggle("consultorio")}
            className="w-full flex items-center justify-between px-4 py-3"
            data-testid="toggle-consultorio"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-600/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300">
                <Stethoscope className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-xs font-medium text-teal-700 dark:text-teal-300">Consultório Virtual</p>
                <p className="text-[11px] text-teal-900/70 dark:text-teal-400/70">Seus próprios pacientes</p>
              </div>
            </div>
            {openSection === "consultorio" ? (
              <ChevronUp className="h-4 w-4 text-teal-700 dark:text-teal-300" />
            ) : (
              <ChevronDown className="h-4 w-4 text-teal-700 dark:text-teal-300" />
            )}
          </button>

          <AnimatePresence initial={false}>
            {openSection === "consultorio" && (
              <motion.div
                key="consultorio"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 pb-4 text-xs text-gray-700 dark:text-gray-300 space-y-2 overflow-hidden"
              >
                <p>
                  Use o TeleMed para atender seus próprios pacientes com agenda online, sala de vídeo,
                  prontuário, PHR e prescrição digital.
                </p>
                <a
                  href="/medico/como-funciona.html"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-teal-700 dark:text-teal-300 font-semibold hover:underline"
                  data-testid="link-como-funciona-consultorio"
                >
                  Ver como funciona
                  <ExternalLink className="h-3 w-3" />
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Marketplace */}
        <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800 rounded-lg">
          <button
            type="button"
            onClick={() => toggle("marketplace")}
            className="w-full flex items-center justify-between px-4 py-3"
            data-testid="toggle-marketplace"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-300">
                <ShoppingCart className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-xs font-medium text-orange-700 dark:text-orange-300">Marketplace de Pacientes</p>
                <p className="text-[11px] text-orange-900/70 dark:text-orange-400/70">Novos pacientes sob demanda</p>
              </div>
            </div>
            {openSection === "marketplace" ? (
              <ChevronUp className="h-4 w-4 text-orange-700 dark:text-orange-300" />
            ) : (
              <ChevronDown className="h-4 w-4 text-orange-700 dark:text-orange-300" />
            )}
          </button>

          <AnimatePresence initial={false}>
            {openSection === "marketplace" && (
              <motion.div
                key="marketplace"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 pb-4 text-xs text-gray-700 dark:text-gray-300 space-y-2 overflow-hidden"
              >
                <p>
                  Ative quando quiser para receber pedidos de consulta de novos pacientes e decidir
                  se deseja atendê-los enviando uma oferta (bid).
                </p>
                <a
                  href="/medico/como-funciona-marketplace.html"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-orange-700 dark:text-orange-300 font-semibold hover:underline"
                  data-testid="link-como-funciona-marketplace"
                >
                  Entender o marketplace
                  <ExternalLink className="h-3 w-3" />
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Painel Analítico */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
          <button
            type="button"
            onClick={() => toggle("analytics")}
            className="w-full flex items-center justify-between px-4 py-3"
            data-testid="toggle-analytics"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/5 dark:bg-slate-500/20 text-slate-800 dark:text-slate-300">
                <BarChart3 className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">Painel Analítico</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">Indicadores e tendências</p>
              </div>
            </div>
            {openSection === "analytics" ? (
              <ChevronUp className="h-4 w-4 text-slate-800 dark:text-slate-300" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-800 dark:text-slate-300" />
            )}
          </button>

          <AnimatePresence initial={false}>
            {openSection === "analytics" && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 pb-4 text-xs text-gray-700 dark:text-gray-300 space-y-2 overflow-hidden"
              >
                <p>
                  Acompanhe consultas, horários de pico, NPS e prescrição no painel avançado do TeleMed.
                </p>
                <a
                  href="/dashboard/index.html"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-slate-800 dark:text-slate-200 font-semibold hover:underline"
                  data-testid="link-painel-analitico"
                >
                  Abrir Painel Analítico
                  <ExternalLink className="h-3 w-3" />
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default TelemedOnboardingCard;
