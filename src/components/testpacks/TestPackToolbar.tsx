
import { Button } from "@/components/ui/button";
import { Plus, Import, FileDown, FileUp, RefreshCw } from "lucide-react";

interface TestPackToolbarProps {
  onCreateNew: () => void;
  onImport: () => void;
  onDownloadTemplate: () => void;
  onExport: () => void;
  onRefresh: () => void;
  userRole: string;
}

const TestPackToolbar = ({ 
  onCreateNew, 
  onImport, 
  onDownloadTemplate, 
  onExport, 
  onRefresh,
  userRole 
}: TestPackToolbarProps) => {
  const isAdmin = userRole === 'admin';
  
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Button size="sm" onClick={onRefresh} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Actualizar</span>
      </Button>
      
      {isAdmin && (
        <>
          <Button size="sm" onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nuevo</span>
          </Button>
          
          <Button size="sm" onClick={onImport} variant="outline">
            <Import className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Importar</span>
          </Button>
          
          <Button size="sm" onClick={onDownloadTemplate} variant="outline">
            <FileDown className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Plantilla</span>
          </Button>
        </>
      )}
      
      <Button size="sm" onClick={onExport} variant="outline">
        <FileUp className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Exportar</span>
      </Button>
    </div>
  );
};

export default TestPackToolbar;
