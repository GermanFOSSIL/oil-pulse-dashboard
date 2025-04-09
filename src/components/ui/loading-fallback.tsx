
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface LoadingFallbackProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function LoadingFallback({
  title = "Error de carga",
  description = "No se pudieron cargar los datos. Por favor, inténtalo de nuevo.",
  onRetry
}: LoadingFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      <Alert variant="destructive" className="w-full max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </Alert>
      
      {onRetry && (
        <Button onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Intentar de nuevo
        </Button>
      )}
    </div>
  );
}
