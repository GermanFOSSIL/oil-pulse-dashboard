
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTestPacks } from "@/hooks/useTestPacks";
import TestPackList from "@/components/testpack/TestPackList";
import TestPackStats from "@/components/testpack/TestPackStats";
import TestPackFormModal from "@/components/testpack/TestPackFormModal";
import BatchUploadModal from "@/components/testpack/BatchUploadModal";
import { DatabaseActivityTimeline } from "@/components/DatabaseActivityTimeline";
import TestPackSkeleton from "@/components/testpack/TestPackSkeleton";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useTimeout } from "@/hooks/useTimeout";
import { generateReport, exportToExcel } from "@/services/reportService";
import { useToast } from "@/hooks/use-toast";
import TestPacksHeader from "@/components/testpack/TestPacksHeader";
import TestPacksSearch from "@/components/testpack/TestPacksSearch";
import TestPacksExportButtons from "@/components/testpack/TestPacksExportButtons";
import TestPacksErrorState from "@/components/testpack/TestPacksErrorState";

const TestPacks = () => {
  const { testPacks, loading, error, statsData, fetchTestPacks } = useTestPacks();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isBatchUploadModalOpen, setIsBatchUploadModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  
  const { isTimedOut, startTimeout, cancelTimeout } = useTimeout(20000);
  
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
  
  if ((error || isTimedOut) && !loading) {
    return (
      <TestPacksErrorState 
        errorMessage={error} 
        onRetry={handleRetry} 
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <TestPacksHeader 
          onCreateNew={() => setIsFormModalOpen(true)}
          onBatchUpload={() => setIsBatchUploadModalOpen(true)}
          statsData={statsData?.testPacks}
        />

        <Tabs defaultValue="dashboard" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="list">Lista</TabsTrigger>
              <TabsTrigger value="activity">Actividad</TabsTrigger>
            </TabsList>
            
            <TestPacksSearch 
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </div>

          <TabsContent value="dashboard" className="space-y-4">
            <TestPacksExportButtons 
              isExporting={isExporting}
              isLoading={loading}
              hasData={testPacks.length > 0}
              onExportExcel={handleExportExcel}
              onExportPDF={handleExportPDF}
            />
            
            {loading ? (
              <TestPackSkeleton />
            ) : (
              <TestPackStats statsData={statsData} />
            )}
          </TabsContent>
          
          <TabsContent value="list" className="space-y-4">
            <TestPacksExportButtons 
              isExporting={isExporting}
              isLoading={loading}
              hasData={testPacks.length > 0}
              onExportExcel={handleExportExcel}
              onExportPDF={handleExportPDF}
            />
            
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
