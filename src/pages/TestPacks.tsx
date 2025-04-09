
import { Suspense, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TestPackList from "@/components/testpacks/TestPackList";
import TestPackActivity from "@/components/testpacks/TestPackActivity";
import TestPackStats from "@/components/testpacks/TestPackStats";
import TestPackImportDialog from "@/components/testpacks/TestPackImportDialog";
import TestPackFormDialog from "@/components/testpacks/TestPackFormDialog";
import TestPackToolbar from "@/components/testpacks/TestPackToolbar";
import { useTestPacks } from "@/hooks/useTestPacks";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => (
  <div className="p-4 border border-red-300 rounded-md bg-red-50 text-red-800 my-4">
    <div className="flex items-center gap-2 mb-2">
      <AlertTriangle className="h-5 w-5" />
      <h2 className="text-lg font-semibold">Algo salió mal</h2>
    </div>
    <p className="mb-4">
      {error.message || "Ha ocurrido un error al cargar los datos."}
    </p>
    <Button onClick={resetErrorBoundary} variant="outline">Reintentar</Button>
  </div>
);

const TestPacks = () => {
  const { toast } = useToast();
  
  const {
    selectedTab,
    showImportDialog,
    showFormDialog,
    selectedTestPack,
    userRole,
    testPacks,
    stats,
    isLoadingTestPacks,
    isLoadingStats,
    setSelectedTab,
    setShowImportDialog,
    setShowFormDialog,
    handleTagRelease,
    handleDeleteTestPack,
    handleDownloadTemplate,
    handleExportData,
    refetchTestPacks,
    openNewTestPackForm,
    openImportDialog,
    handleFormSuccess,
    handleImportSuccess,
    openEditTestPackForm,
    fetchTestPacks,
    fetchStats
  } = useTestPacks();

  // Add a more robust initialization and refresh strategy
  useEffect(() => {
    console.log("Initial data fetch for Test Packs page");
    fetchTestPacks();
    fetchStats();
    
    // Set up a refresh interval for real-time updates
    const refreshInterval = setInterval(() => {
      console.log("Refreshing test packs data (interval)");
      fetchTestPacks();
      fetchStats();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [fetchTestPacks, fetchStats]);

  // Ensure stats are updated when the tab changes
  useEffect(() => {
    if (selectedTab === "dashboard") {
      console.log("Dashboard tab selected, fetching latest stats");
      fetchStats();
    }
  }, [selectedTab, fetchStats]);

  // Add data logging to help debug
  useEffect(() => {
    if (stats) {
      console.log("Current stats data:", stats);
    }
    if (testPacks) {
      console.log(`Loaded ${testPacks.length} test packs`);
    }
  }, [stats, testPacks]);
  
  // Enhanced delete handler with better error handling
  const enhancedDeleteHandler = useCallback(async (id: string) => {
    try {
      console.log("Starting deletion process for test pack:", id);
      await handleDeleteTestPack(id);
      
      // Force refresh after successful deletion
      await fetchTestPacks();
      await fetchStats();
      
      toast({
        title: "Éxito",
        description: "Test pack eliminado correctamente.",
      });
    } catch (error) {
      console.error("Error during deletion process:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el test pack. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
      
      // Try to refresh data anyway to ensure UI consistency
      fetchTestPacks();
    }
  }, [handleDeleteTestPack, fetchTestPacks, fetchStats, toast]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Paquetes e ITRs</h1>
        <TestPackToolbar 
          onCreateNew={openNewTestPackForm}
          onImport={openImportDialog}
          onDownloadTemplate={handleDownloadTemplate}
          onExport={handleExportData}
          onRefresh={() => {
            console.log("Manual refresh requested");
            fetchTestPacks();
            fetchStats();
          }}
          userRole={userRole}
        />
      </div>

      <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {
        console.log("Error boundary reset, fetching fresh data");
        fetchTestPacks();
        fetchStats();
      }}>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Lista de Test Packs</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="activity">Actividad</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-4">
            <TestPackList 
              testPacks={testPacks || []}
              isLoading={isLoadingTestPacks}
              onTagRelease={handleTagRelease}
              userRole={userRole}
              onClearFilters={() => {
                console.log("Clearing filters and refreshing data");
                fetchTestPacks();
              }}
              onEdit={openEditTestPackForm}
              onDelete={enhancedDeleteHandler}
            />
          </TabsContent>
          
          <TabsContent value="dashboard">
            <Suspense fallback={
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            }>
              {isLoadingStats ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <TestPackStats stats={stats || {
                  testPacks: { total: 0, completed: 0, progress: 0 },
                  tags: { total: 0, released: 0, progress: 0 },
                  systems: [],
                  itrs: [],
                  subsystems: []
                }} />
              )}
            </Suspense>
          </TabsContent>
          
          <TabsContent value="activity">
            <TestPackActivity />
          </TabsContent>
        </Tabs>
      </ErrorBoundary>
      
      {showImportDialog && (
        <TestPackImportDialog 
          open={showImportDialog} 
          onOpenChange={setShowImportDialog} 
          onSuccess={handleImportSuccess}
        />
      )}
      
      {showFormDialog && (
        <TestPackFormDialog
          open={showFormDialog}
          onOpenChange={setShowFormDialog}
          testPack={selectedTestPack}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default TestPacks;
