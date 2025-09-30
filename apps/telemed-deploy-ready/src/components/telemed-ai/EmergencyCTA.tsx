import { Button } from "@/components/ui/button";

export default function EmergencyCTA({ onClick }: { onClick: () => void }) {
  return (
    <div className="w-full mt-2">
      <Button variant="link" className="w-full text-red-600 p-0 h-auto" onClick={onClick} type="button">⚠️ Preciso de atendimento médico</Button>
    </div>
  );
}
