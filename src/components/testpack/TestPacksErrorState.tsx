
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface TestPacksErrorStateProps {
  errorMessage: string | null;
  onRetry: () => void;
}

const TestPacksErrorState = ({ errorMessage, onRetry }: TestPacksErrorStateProps) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Packs</h1>
          <p className="text-muted-foreground">
            Gestión y seguimiento de Test Packs y TAGs
          </p>
        </div>
      </div>
      
      <Card>
        <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <h3 className="font-medium text-lg mb-2">Error de carga</h3>
          <p className="text-muted-foreground mb-4 text-center">
            {errorMessage || "No se pudieron cargar los Test Packs. La operación ha tomado demasiado tiempo."}
          </p>
          <Button variant="default" onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestPacksErrorState;
