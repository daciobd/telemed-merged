import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

export type Hipotese = { cid?: string; label: string };

const CID_LIST = [
  { cid: "F41.1", label: "Transtorno de ansiedade generalizada" },
  { cid: "F41.0", label: "Transtorno de pânico" },
  { cid: "F32", label: "Episódio depressivo" },
  { cid: "F32.0", label: "Episódio depressivo leve" },
  { cid: "F32.1", label: "Episódio depressivo moderado" },
  { cid: "F32.2", label: "Episódio depressivo grave sem sintomas psicóticos" },
  { cid: "F33", label: "Transtorno depressivo recorrente" },
  { cid: "F51.0", label: "Insônia não orgânica" },
  { cid: "F43.2", label: "Transtorno de ajustamento" },
  { cid: "F43.1", label: "Transtorno de estresse pós-traumático" },
  { cid: "F40.1", label: "Fobia social" },
  { cid: "F42", label: "Transtorno obsessivo-compulsivo" },
  { cid: "F31", label: "Transtorno afetivo bipolar" },
  { cid: "F90.0", label: "TDAH tipo hiperativo" },
  { cid: "F90.1", label: "TDAH tipo desatento" },
  { cid: "J06.9", label: "Infecção aguda das vias aéreas superiores" },
  { cid: "J00", label: "Resfriado comum" },
  { cid: "J03.9", label: "Amigdalite aguda" },
  { cid: "I10", label: "Hipertensão essencial (primária)" },
  { cid: "E11", label: "Diabetes mellitus tipo 2" },
  { cid: "R51", label: "Cefaleia" },
  { cid: "G43", label: "Enxaqueca" },
  { cid: "M54.5", label: "Dor lombar baixa" },
  { cid: "K29.7", label: "Gastrite não especificada" },
  { cid: "K21", label: "Doença do refluxo gastroesofágico" },
];

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

interface Props {
  selected: Hipotese[];
  onChange: (next: Hipotese[]) => void;
  onChipClick?: (h: Hipotese) => void;
}

export default function DiagnosticoCID({ selected, onChange, onChipClick }: Props) {
  const [query, setQuery] = useState("");

  const suggestions = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    return CID_LIST.filter(
      (i) => normalize(i.label).includes(q) || normalize(i.cid).includes(q)
    ).slice(0, 8);
  }, [query]);

  const addItem = (item: { cid: string; label: string }) => {
    if (!selected.some((s) => s.cid === item.cid)) {
      onChange([...selected, { cid: item.cid, label: item.label }]);
    }
    setQuery("");
  };

  const addFreeText = () => {
    const label = query.trim();
    if (!label) return;
    onChange([...selected, { label }]);
    setQuery("");
  };

  const removeItem = (idx: number) => {
    const next = [...selected];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hipótese Diagnóstica</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite CID ou diagnóstico (ex: F41 ou depre...)"
            data-testid="input-cid-search"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (suggestions[0]) addItem(suggestions[0]);
                else addFreeText();
              }
            }}
          />

          {query && suggestions.length > 0 && (
            <div className="border rounded bg-white dark:bg-gray-800 shadow-sm max-h-64 overflow-y-auto">
              {suggestions.map((s) => (
                <button
                  key={s.cid}
                  onClick={() => addItem(s)}
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                  data-testid={`suggestion-${s.cid}`}
                >
                  {s.label} — <span className="text-gray-500">{s.cid}</span>
                </button>
              ))}
            </div>
          )}

          {query && suggestions.length === 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Enter para adicionar como texto livre.
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2" data-testid="chips-hipoteses">
          {selected.map((s, idx) => (
            <span
              key={`${s.cid || s.label}-${idx}`}
              className="flex items-center gap-1 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 px-2 py-1 rounded text-sm"
              data-testid={`chip-hipotese-${idx}`}
            >
              <button
                type="button"
                onClick={() => onChipClick?.(s)}
                className="hover:underline cursor-pointer"
                title="Inserir na anamnese"
                data-testid={`button-chip-click-${idx}`}
              >
                {s.label}
                {s.cid ? <span className="opacity-80"> ({s.cid})</span> : null}
              </button>
              <button 
                type="button"
                onClick={() => removeItem(idx)} 
                aria-label="Remover"
                className="cursor-pointer"
                data-testid={`button-remove-hipotese-${idx}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
