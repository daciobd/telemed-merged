import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function TokenExpiredAlert() {
  const [showAlert, setShowAlert] = useState(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const handleTokenExpired = (event: Event) => {
      const customEvent = event as CustomEvent;
      setMessage(customEvent.detail?.message || "Sua sessão expirou.");
      setShowAlert(true);
    };

    window.addEventListener('auth:token-expired', handleTokenExpired);

    return () => {
      window.removeEventListener('auth:token-expired', handleTokenExpired);
    };
  }, []);

  const handleClose = () => {
    setShowAlert(false);
  };

  return (
    <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
      <AlertDialogContent data-testid="alert-token-expired">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertDialogTitle>Sessão Expirada</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {message || "Sua sessão expirou."}
            <br />
            <br />
            <strong>Por favor, volte ao TeleMed</strong> e reabra o MedicalDesk para continuar trabalhando.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button 
            onClick={handleClose}
            variant="outline"
            data-testid="button-close-alert"
          >
            Entendi
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
