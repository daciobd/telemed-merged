import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function OutOfScopeDialog({ open, onClose, onEscalate }: { open: boolean; onClose: () => void; onEscalate: () => void }) {
  return (
    <Dialog open={open}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pergunta fora do escopo</DialogTitle>
          <DialogDescription>Sua pergunta parece não estar coberta pelas orientações da última consulta. Você quer encaminhar para o médico?</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="secondary" onClick={onClose} type="button">Continuar no chat</Button>
          <Button onClick={onEscalate} type="button">Encaminhar para o médico</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
