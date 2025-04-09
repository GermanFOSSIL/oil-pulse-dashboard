
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTestPacks } from "@/hooks/useTestPacks";
import { Tag } from "@/services/types";
import { 
  ChevronLeft, 
  Edit, 
  Plus, 
  RefreshCw, 
  Tags as TagsIcon,
  FileDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TagList from "@/components/testpack/TagList";
import TagFormModal from "@/components/testpack/TagFormModal";
import TestPackFormModal from "@/components/testpack/TestPackFormModal";

const TestPackDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { 
    currentTestPack, 
    loading, 
    fetchTestPackWithTags, 
    updateTestPack 
  } = useTestPacks();
  
  const [isTagFormModalOpen, setIsTagFormModalOpen] = useState(false);
  const [isTestPackFormModalOpen, setIsTestPackFormModalOpen] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchTestPackWithTags(id);
    }
  }, [id, fetchTestPackWithTags]);
  
  const handleRefresh = () => {
    if (id) {
      fetchTestPackWithTags(id);
    }
  };
  
  const handleBack = () => {
    navigate(-1);
  };
  
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
  
  const handleExportExcel = () => {
    // Functionality to be implemented later
    console.log("Export to Excel");
  };
  
  if (loading && !currentTestPack) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!currentTestPack) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          className="gap-2"
          onClick={handleBack}
        >
          <ChevronLeft className="h-4 w-4" />
          Volver
        </Button>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
            <TagsIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Test Pack no encontrado</h3>
            <p className="text-muted-foreground mb-4">
              El Test Pack que está buscando no existe o ha sido eliminado.
            </p>
            <Button variant="default" onClick={handleBack}>
              Volver a Test Packs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Button 
          variant="ghost" 
          className="gap-2 mr-auto"
          onClick={handleBack}
        >
          <ChevronLeft className="h-4 w-4" />
          Volver
        </Button>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            className="h-10 gap-2"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
          <Button 
            variant="outline" 
            className="h-10 gap-2"
            onClick={handleExportExcel}
          >
            <FileDown className="h-4 w-4" />
            Exportar Excel
          </Button>
          <Button 
            className="h-10 gap-2"
            onClick={() => setIsTagFormModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nuevo TAG
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between pb-2">
          <div>
            <CardTitle className="text-2xl">
              {currentTestPack.nombre_paquete}
              <Button 
                variant="ghost" 
                size="icon"
                className="ml-2"
                onClick={() => setIsTestPackFormModalOpen(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              ITR: {currentTestPack.itr_asociado} | Sistema: {currentTestPack.sistema} | Subsistema: {currentTestPack.subsistema}
            </CardDescription>
          </div>
          <div className="mt-2 md:mt-0">
            {getStatusBadge(currentTestPack.estado)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <TagsIcon className="h-5 w-5" />
              TAGs 
              <span className="text-sm text-muted-foreground">
                ({currentTestPack.tags.length})
              </span>
            </h3>
            
            <TagList 
              tags={currentTestPack.tags} 
              testPackId={currentTestPack.id}
              onRefresh={handleRefresh}
            />
          </div>
        </CardContent>
      </Card>
      
      <TagFormModal 
        isOpen={isTagFormModalOpen} 
        onClose={() => setIsTagFormModalOpen(false)} 
        onSuccess={() => {
          setIsTagFormModalOpen(false);
          handleRefresh();
        }}
        testPackId={currentTestPack.id}
      />
      
      <TestPackFormModal 
        isOpen={isTestPackFormModalOpen} 
        onClose={() => setIsTestPackFormModalOpen(false)} 
        onSuccess={() => {
          setIsTestPackFormModalOpen(false);
          handleRefresh();
        }}
        testPack={currentTestPack}
      />
    </div>
  );
};

export default TestPackDetail;
