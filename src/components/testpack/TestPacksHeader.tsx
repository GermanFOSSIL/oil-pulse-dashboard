
import { Button } from "@/components/ui/button";
import { PlusCircle, FileSpreadsheet, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TestPacksHeaderProps {
  onCreateNew: () => void;
  onBatchUpload: () => void;
  statsData?: {
    total: number;
    completed: number;
    progress: number;
  };
}

const TestPacksHeader = ({ 
  onCreateNew, 
  onBatchUpload,
  statsData
}: TestPacksHeaderProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Packs</h1>
          <p className="text-muted-foreground">
            Gestión y seguimiento de Test Packs y TAGs
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            className="h-10"
            onClick={onBatchUpload}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Carga Masiva
          </Button>
          <Button 
            className="h-10"
            onClick={onCreateNew}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Nuevo Test Pack
          </Button>
        </div>
      </div>
      
      {statsData && (
        <Card className="bg-muted/40">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-6 text-center md:text-left">
              <div className="flex flex-col space-y-1 md:mr-4">
                <span className="text-muted-foreground text-sm">Test Packs</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{statsData.total}</span>
                  <span className="text-sm text-muted-foreground">total</span>
                </div>
              </div>
              
              <div className="flex flex-col space-y-1 md:mr-4">
                <span className="text-muted-foreground text-sm">Completados</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{statsData.completed}</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-200">
                    {statsData.progress}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-col space-y-1 md:mr-4">
                <span className="text-muted-foreground text-sm">Estado</span>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">
                    {statsData.progress < 30 ? "Iniciando" : 
                     statsData.progress < 70 ? "En Progreso" : 
                     statsData.progress < 100 ? "Avanzado" : "Completado"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TestPacksHeader;
