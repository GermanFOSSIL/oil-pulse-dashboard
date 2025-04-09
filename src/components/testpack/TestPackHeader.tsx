
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  RefreshCw,
  FileDown,
  Plus,
  Edit
} from "lucide-react";

interface TestPackHeaderProps {
  testPackName: string;
  itrAsociado: string;
  sistema: string;
  subsistema: string;
  estado: string;
  onBack: () => void;
  onRefresh: () => void;
  onExportExcel: () => void;
  onAddTag: () => void;
  onEditTestPack: () => void;
}

const TestPackHeader = ({
  testPackName,
  itrAsociado,
  sistema,
  subsistema,
  estado,
  onBack,
  onRefresh,
  onExportExcel,
  onAddTag,
  onEditTestPack
}: TestPackHeaderProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'listo':
        return <Badge variant="default" className="bg-green-600">Listo</Badge>;
      case 'pendiente':
        return <Badge variant="outline">Pendiente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Button 
          variant="ghost" 
          className="gap-2 mr-auto"
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4" />
          Volver
        </Button>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            className="h-10 gap-2"
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
          <Button 
            variant="outline" 
            className="h-10 gap-2"
            onClick={onExportExcel}
          >
            <FileDown className="h-4 w-4" />
            Exportar Excel
          </Button>
          <Button 
            className="h-10 gap-2"
            onClick={onAddTag}
          >
            <Plus className="h-4 w-4" />
            Nuevo TAG
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-2">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            {testPackName}
            <Button 
              variant="ghost" 
              size="icon"
              className="ml-2"
              onClick={onEditTestPack}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </h2>
          <p className="text-muted-foreground">
            ITR: {itrAsociado} | Sistema: {sistema} | Subsistema: {subsistema}
          </p>
        </div>
        <div className="mt-2 md:mt-0">
          {getStatusBadge(estado)}
        </div>
      </div>
    </>
  );
};

export default TestPackHeader;
