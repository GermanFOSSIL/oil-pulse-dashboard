
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  TestPack,
  getTestPacks,
  getTestPacksStats,
  createTestPack,
  updateTestPack,
  updateTestPackStatusBasedOnTags,
  updateTag,
  exportToExcel,
  generateImportTemplate,
  importFromExcel,
  deleteTestPack
} from "@/services/testPackService";
import { useAuth } from "@/contexts/AuthContext";

interface TestPackStatsData {
  testPacks: {
    total: number;
    completed: number;
    progress: number;
  };
  tags: {
    total: number;
    released: number;
    progress: number;
  };
  systems: { name: string; value: number }[];
  subsystems: { name: string; value: number }[];
  itrs: { name: string; value: number }[];
}

export const useTestPacks = () => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const userRole = userProfile?.role || 'user';
  const [selectedTab, setSelectedTab] = useState("list");
  const [testPacks, setTestPacks] = useState<TestPack[] | null>(null);
  const [stats, setStats] = useState<TestPackStatsData | null>(null);
  const [isLoadingTestPacks, setIsLoadingTestPacks] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isDeletingTestPack, setIsDeletingTestPack] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [selectedTestPack, setSelectedTestPack] = useState<TestPack | null>(null);

  const fetchTestPacks = useCallback(async () => {
    setIsLoadingTestPacks(true);
    try {
      console.log("Fetching test packs...");
      const packs = await getTestPacks();
      console.log(`Successfully fetched ${packs.length} test packs`);
      setTestPacks(packs);
    } catch (error: any) {
      console.error("Error fetching test packs:", error);
      toast({
        title: "Error",
        description:
          "No se pudieron cargar los test packs. Por favor, verifique su conexión e inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTestPacks(false);
    }
  }, [toast]);

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      console.log("Fetching test pack stats...");
      const statsData = await getTestPacksStats();
      console.log("Successfully fetched test pack stats:", statsData);
      setStats(statsData);
    } catch (error: any) {
      console.error("Error fetching test pack stats:", error);
      toast({
        title: "Error",
        description:
          "No se pudieron cargar las estadísticas. Por favor, verifique su conexión e inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStats(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTestPacks();
    fetchStats();
    
    // Set up polling for real-time updates
    const pollingInterval = setInterval(() => {
      console.log("Polling for test pack updates...");
      fetchTestPacks();
      if (selectedTab === "dashboard") {
        fetchStats();
      }
    }, 30000); // Poll every 30 seconds
    
    return () => clearInterval(pollingInterval);
  }, [fetchTestPacks, fetchStats, selectedTab]);

  const handleFormSuccess = () => {
    setShowFormDialog(false);
    setSelectedTestPack(null);
    
    console.log("Test pack saved successfully, refreshing data...");
    fetchTestPacks();
    fetchStats();
    
    toast({
      title: "Éxito",
      description: "Test pack guardado correctamente.",
    });
  };

  const handleImportSuccess = () => {
    setShowImportDialog(false);
    
    console.log("Test packs imported successfully, refreshing data...");
    fetchTestPacks();
    fetchStats();
    
    toast({
      title: "Éxito",
      description: "Test packs importados correctamente.",
    });
  };

  const openNewTestPackForm = () => {
    setSelectedTestPack(null);
    setShowFormDialog(true);
  };

  const openEditTestPackForm = (testPack: TestPack) => {
    setSelectedTestPack(testPack);
    setShowFormDialog(true);
  };

  const openImportDialog = () => {
    setShowImportDialog(true);
  };

  const handleTagRelease = async (tagId: string) => {
    try {
      console.log(`Toggling release status for tag: ${tagId}`);
      
      // Find the tag in the current data to get its current status
      const tag = testPacks?.flatMap(tp => tp.tags || []).find(t => t.id === tagId);
      if (!tag) {
        throw new Error("TAG no encontrado");
      }
      
      const newState = tag.estado === 'liberado' ? 'pendiente' : 'liberado';
      const releaseDate = newState === 'liberado' ? new Date().toISOString() : null;
      
      console.log(`Updating tag ${tagId} to status: ${newState}`);
      await updateTag(tagId, { 
        estado: newState,
        fecha_liberacion: releaseDate
      });
      
      toast({
        title: "Éxito",
        description: newState === 'liberado' 
          ? "TAG liberado correctamente." 
          : "TAG marcado como pendiente correctamente.",
      });
      
      console.log("Tag updated successfully, refreshing data...");
      fetchTestPacks();
      fetchStats();
    } catch (error: any) {
      console.error("Error releasing tag:", error);
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el TAG. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTestPack = async (id: string): Promise<boolean> => {
    if (isDeletingTestPack) {
      console.log("Delete operation already in progress, ignoring request");
      return false;
    }
    
    try {
      console.log(`Starting deletion process for test pack ID: ${id}`);
      setIsDeletingTestPack(true);
      
      // Find the test pack in current data to get its name for user feedback
      const testPackToDelete = testPacks?.find(tp => tp.id === id);
      const testPackName = testPackToDelete?.nombre_paquete || 'Test Pack';
      
      console.log(`Calling deleteTestPack service for ID: ${id}`);
      const result = await deleteTestPack(id);
      
      if (result.success) {
        console.log(`Test pack ${id} deleted successfully`);
        
        // Optimistically update the UI by removing the deleted test pack
        setTestPacks(prevTestPacks => 
          prevTestPacks ? prevTestPacks.filter(tp => tp.id !== id) : null
        );
        
        toast({
          title: "Éxito",
          description: `${testPackName} ha sido eliminado correctamente.`,
        });
        
        // Refresh data to ensure UI is in sync with the database
        console.log("Refreshing data after successful deletion");
        fetchTestPacks();
        fetchStats();
        
        return true;
      } else {
        console.error(`Error deleting test pack ${id}:`, result.message);
        toast({
          title: "Error",
          description: result.message || "No se pudo eliminar el test pack. Por favor, inténtelo de nuevo.",
          variant: "destructive",
        });
        
        // Refresh data anyway to ensure UI consistency
        fetchTestPacks();
        return false;
      }
    } catch (error: any) {
      console.error(`Error in handleDeleteTestPack for ${id}:`, error);
      toast({
        title: "Error",
        description:
          error.message || "Error al eliminar el test pack. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
      
      // Try to refresh data to ensure UI consistency
      fetchTestPacks();
      return false;
    } finally {
      setIsDeletingTestPack(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      console.log("Generating and downloading template...");
      const templateBuffer = generateImportTemplate();
      
      const blob = new Blob([templateBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'TestPacks_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Éxito",
        description: "Plantilla descargada correctamente.",
      });
    } catch (error: any) {
      console.error("Error downloading template:", error);
      toast({
        title: "Error",
        description:
          error.message || "Error al descargar la plantilla. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleExportData = async () => {
    try {
      console.log("Exporting test pack data...");
      const excelBuffer = await exportToExcel();
      
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'TestPacks_Export.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Éxito",
        description: "Datos exportados correctamente.",
      });
    } catch (error: any) {
      console.error("Error exporting data:", error);
      toast({
        title: "Error",
        description:
          error.message || "Error al exportar datos. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const refetchTestPacks = () => {
    console.log("Manual refresh requested");
    fetchTestPacks();
  };

  return {
    selectedTab,
    testPacks,
    stats,
    isLoadingTestPacks,
    isLoadingStats,
    isDeletingTestPack,
    showImportDialog,
    showFormDialog,
    selectedTestPack,
    userRole,
    setSelectedTab,
    setTestPacks,
    setStats,
    setIsLoadingTestPacks,
    setIsLoadingStats,
    setShowImportDialog,
    setShowFormDialog,
    setSelectedTestPack,
    fetchTestPacks,
    fetchStats,
    handleTagRelease,
    handleDeleteTestPack,
    handleDownloadTemplate,
    handleExportData,
    refetchTestPacks,
    openNewTestPackForm,
    openEditTestPackForm,
    openImportDialog,
    handleFormSuccess,
    handleImportSuccess,
  };
};
