import { useMemo } from "react";

type Props = {
  chiefComplaint?: string; // q
  age?: number | string;
  sex?: "male" | "female" | "other";
};

export default function ConsultaDiretrizesButton({ chiefComplaint, age, sex }: Props) {
  const disabled = useMemo(() => {
    const hasQ = !!chiefComplaint && chiefComplaint.trim().length > 2;
    const a = Number(age);
    const ageOk = Number.isFinite(a) && a >= 0 && a <= 120;
    const sexOk = sex === "male" || sex === "female" || sex === "other";
    return !(hasQ && ageOk && sexOk);
  }, [chiefComplaint, age, sex]);

  const href = useMemo(() => {
    const params = new URLSearchParams({
      q: chiefComplaint ?? "",
      age: String(age ?? ""),
      sex: String(sex ?? ""),
      source: "consulta",
    });
    return `/dr-ai/?${params.toString()}`;
  }, [chiefComplaint, age, sex]);

  const onClick = () => {
    if (disabled) return;
    // telemetria opcional
    try { 
      fetch("/api/events", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "guidelines_opened", 
          q: chiefComplaint, 
          age, 
          sex, 
          source: "consulta" 
        })
      }); 
    } catch {}

    // abrir em nova aba de forma segura
    const w = window.open(href, "_blank");
    if (w) { w.opener = null; }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      title={disabled ? "Preencha queixa, idade e sexo" : "Abrir Diretrizes (Dr. AI) em nova aba"}
      className={`bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      data-testid="button-diretrizes"
    >
      📋 Diretrizes
    </button>
  );
}