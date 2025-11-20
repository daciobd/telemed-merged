import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

export default function RedFlagsChecklist() {
  const [checkedFlags, setCheckedFlags] = useState<Record<string, boolean>>({});

  const redFlags = [
    { id: "sudden-onset", label: "Início súbito" },
    { id: "fever", label: "Febre associada" },
    { id: "neurological", label: "Alterações neurológicas" },
    { id: "progressive", label: "Cefaleia progressiva" },
    { id: "pattern-change", label: "Mudança no padrão" },
    { id: "worst-headache", label: "Pior cefaleia da vida" },
  ];

  const handleFlagChange = (flagId: string, checked: boolean) => {
    setCheckedFlags(prev => ({
      ...prev,
      [flagId]: checked
    }));
  };

  const checkedCount = Object.values(checkedFlags).filter(Boolean).length;

  return (
    <div className="bg-yellow-50 rounded-md p-3 mt-3" data-testid="red-flags-checklist">
      <h5 className="font-medium text-yellow-900 mb-2">Bandeiras Vermelhas - Cefaleia:</h5>
      
      <div className="grid grid-cols-2 gap-3">
        {redFlags.map((flag) => (
          <label key={flag.id} className="flex items-center space-x-2 text-sm">
            <Checkbox
              checked={checkedFlags[flag.id] || false}
              onCheckedChange={(checked) => handleFlagChange(flag.id, !!checked)}
              className="border-yellow-300 text-yellow-600 focus:ring-yellow-500"
              data-testid={`checkbox-red-flag-${flag.id}`}
            />
            <span className="text-yellow-800">{flag.label}</span>
          </label>
        ))}
      </div>

      {checkedCount > 0 && (
        <div className="mt-3 p-2 bg-white rounded border border-yellow-200" data-testid="red-flags-alert">
          <div className="text-sm">
            <span className="font-medium text-yellow-900">
              {checkedCount} bandeira(s) vermelha(s) presente(s)
            </span>
            {checkedCount >= 2 && (
              <div className="text-red-700 font-medium mt-1">
                ⚠️ ALERTA: Considere investigação urgente para cefaleia secundária
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
