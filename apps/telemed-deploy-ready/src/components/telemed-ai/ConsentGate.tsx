import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldQuestion } from "lucide-react";
import { auditLog } from "./api";

export default function ConsentGate({ onAccepted }: { onAccepted: () => void }) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const accept = () => {
    setLoading(true);
    setTimeout(() => { auditLog({ type: "consent", consentType: "IA", accepted: true, ts: new Date().toISOString() }); onAccepted(); }, 350);
  };

  return (
    <Card className="m-4" role="region" aria-label="Consentimento da IA" ref={ref} tabIndex={-1}>
      <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ShieldQuestion className="h-5 w-5" /> Consentimento para usar o Assistente de IA</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription>Este assistente <strong>apenas repete e esclarece</strong> orientações da sua última consulta. <strong>Não substitui consulta</strong> e <strong>não avalia sintomas novos</strong>.</AlertDescription>
        </Alert>
        <div className="flex items-start gap-3">
          <Checkbox id="consent-ia" checked={checked} onCheckedChange={(v) => setChecked(!!v)} />
          <Label htmlFor="consent-ia" className="leading-6">Li e concordo com o uso da IA para esclarecer orientações já dadas. Posso revogar a qualquer momento.</Label>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => history.back()} type="button">Cancelar</Button>
          <Button onClick={accept} disabled={!checked || loading} type="button">{loading ? "Confirmando..." : "Concordo e continuar"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
