
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  Upload, 
  FileDown, 
  DownloadCloud, 
  RefreshCw 
} from "lucide-react";

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
  return (
    <div className="flex flex-wrap items-center gap-2">
      {userRole === 'admin' && (
        <>
          <Button onClick={onCreateNew} variant="outline" size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nuevo Test Pack
          </Button>
          <Button onClick={onImport} variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button onClick={onDownloadTemplate} variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Plantilla
          </Button>
        </>
      )}
      <Button onClick={onExport} variant="outline" size="sm">
        <DownloadCloud className="h-4 w-4 mr-2" />
        Exportar
      </Button>
      <Button onClick={onRefresh} variant="ghost" size="icon">
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default TestPackToolbar;
