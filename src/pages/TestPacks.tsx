
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTestPacks } from "@/hooks/useTestPacks";
import { PlusCircle, Search, FileSpreadsheet, Filter, AlertTriangle, RefreshCw, FilePdf, FileDown } from "lucide-react";
import TestPackList from "@/components/testpack/TestPackList";
import TestPackStats from "@/components/testpack/TestPackStats";
import TestPackFormModal from "@/components/testpack/TestPackFormModal";
import BatchUploadModal from "@/components/testpack/BatchUploadModal";
import { DatabaseActivityTimeline } from "@/components/DatabaseActivityTimeline";
import TestPackSkeleton from "@/components/testpack/TestPackSkeleton";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useTimeout } from "@/hooks/useTimeout";
import { generateReport } from "@/services/reportService";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/services/reportService";

const TestPacks = () => {
  const { testPacks, loading, error, statsData, fetchTestPacks } = useTestPacks();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isBatchUploadModalOpen, setIsBatchUploadModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  
  const { isTimedOut, startTimeout, cancelTimeout } = useTimeout(20000);
  
  // Iniciar el timeout cuando comienza la carga
  useEffect(() => {
    if (loading) {
      startTimeout();
    } else {
      cancelTimeout();
    }
  }, [loading, startTimeout, cancelTimeout]);
  
  const filteredTestPacks = testPacks.filter(
    (testPack) => testPack.nombre_paquete.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleRetry = () => {
    cancelTimeout();
    fetchTestPacks();
  };
  
  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const pdfUrl = await generateReport('project_status');
      // Abrir PDF en nueva pestaña
      window.open(pdfUrl, '_blank');
      toast({
        title: "PDF generado exitosamente",
        description: "El reporte se ha abierto en una nueva pestaña",
      });
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el reporte PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleExportExcel = () => {
    try {
      setIsExporting(true);
      
      // Preparar datos para Excel
      const testPacksForExcel = testPacks.map(tp => ({
        Nombre: tp.nombre_paquete,
        ITR: tp.itr_asociado,
        Sistema: tp.sistema,
        Subsistema: tp.subsistema,
        Estado: tp.estado
      }));
      
      exportToExcel(testPacksForExcel, 'Test_Packs', 'test_packs_export.xlsx');
      
      toast({
        title: "Excel generado exitosamente",
        description: "El archivo se ha descargado",
      });
    } catch (error) {
      console.error("Error al generar Excel:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el archivo Excel",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Mostrar mensaje de error si hay un problema o si tarda demasiado
  if ((error || isTimedOut) && !loading) {
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
              {error || "No se pudieron cargar los Test Packs. La operación ha tomado demasiado tiempo."}
            </p>
            <Button variant="default" onClick={handleRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
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
              onClick={() => setIsBatchUploadModalOpen(true)}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Carga Masiva
            </Button>
            <Button 
              className="h-10"
              onClick={() => setIsFormModalOpen(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Nuevo Test Pack
            </Button>
          </div>
        </div>

        <Tabs defaultValue="list" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="list">Listado</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="activity">Actividad</TabsTrigger>
            </TabsList>
            
            <div className="flex w-full md:w-auto items-center space-x-2">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar test packs..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-end space-x-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={isExporting || loading || testPacks.length === 0}
                className="gap-2"
              >
                <FileDown className="h-4 w-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExporting || loading || testPacks.length === 0}
                className="gap-2"
              >
                <FilePdf className="h-4 w-4" />
                PDF
              </Button>
            </div>
            
            {loading ? (
              <TestPackSkeleton />
            ) : (
              <TestPackList 
                testPacks={filteredTestPacks} 
                loading={loading} 
                onRefresh={fetchTestPacks}
              />
            )}
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-4">
            <div className="flex justify-end space-x-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={isExporting || loading || testPacks.length === 0}
                className="gap-2"
              >
                <FileDown className="h-4 w-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExporting || loading || testPacks.length === 0}
                className="gap-2"
              >
                <FilePdf className="h-4 w-4" />
                PDF
              </Button>
            </div>
            
            <TestPackStats statsData={statsData} />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <DatabaseActivityTimeline />
          </TabsContent>
        </Tabs>

        <TestPackFormModal 
          isOpen={isFormModalOpen} 
          onClose={() => setIsFormModalOpen(false)} 
          onSuccess={() => {
            setIsFormModalOpen(false);
            fetchTestPacks();
          }}
        />

        <BatchUploadModal
          isOpen={isBatchUploadModalOpen}
          onClose={() => setIsBatchUploadModalOpen(false)}
          onSuccess={() => {
            setIsBatchUploadModalOpen(false);
            fetchTestPacks();
          }}
        />
      </div>
    </ErrorBoundary>
  );
};

export default TestPacks;
