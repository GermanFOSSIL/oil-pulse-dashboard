
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  getTestPacks, 
  updateTag, 
  exportToExcel, 
  generateImportTemplate,
  getTestPacksStats,
  TestPack 
} from "@/services/testPackService";
import { supabase } from "@/integrations/supabase/client";
import { getSystemsWithSubsystems, getProjectsHierarchy } from "@/services/systemService";

// Custom hook to manage Test Packs functionality
export const useTestPacks = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("list");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [selectedTestPack, setSelectedTestPack] = useState<TestPack | null>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [projectsData, setProjectsData] = useState<any[]>([]);

  // Get user role
  const getUserRole = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) return 'user';
      
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.session.user.id)
        .single();
      
      return data?.role || 'user';
    } catch (error) {
      console.error("Error fetching user role:", error);
      return 'user';
    }
  };
  
  // Load project hierarchy data
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        const data = await getProjectsHierarchy();
        setProjectsData(data);
      } catch (error) {
        console.error("Error loading project hierarchy:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar la jerarquía de proyectos",
          variant: "destructive"
        });
      }
    };
    
    loadProjectData();
    getUserRole().then(role => setUserRole(role));
  }, [toast]);

  // Queries for test packs data
  const { 
    data: testPacks, 
    isLoading: isLoadingTestPacks, 
    refetch: refetchTestPacks,
    error: testPacksError
  } = useQuery({
    queryKey: ['testPacks'],
    queryFn: getTestPacks,
    retry: 3,
    retryDelay: 1000
  });

  const { 
    data: stats, 
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['testPacksStats'],
    queryFn: getTestPacksStats,
    enabled: selectedTab === 'dashboard',
    retry: 3,
    retryDelay: 1000,
    staleTime: 60000 // 1 minute
  });

  // Refetch stats when tab changes to dashboard
  useEffect(() => {
    if (selectedTab === 'dashboard') {
      refetchStats();
    }
  }, [selectedTab, refetchStats]);

  // Log errors for debugging
  useEffect(() => {
    if (testPacksError) {
      console.error("Error fetching test packs:", testPacksError);
    }
    
    if (statsError) {
      console.error("Error fetching stats:", statsError);
    }
  }, [testPacksError, statsError]);

  // Mutation for updating tags
  const updateTagMutation = useMutation({
    mutationFn: (tagId: string) => updateTag(tagId, { 
      estado: 'liberado',
      fecha_liberacion: new Date().toISOString() 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testPacks'] });
      queryClient.invalidateQueries({ queryKey: ['testPack'] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
      queryClient.invalidateQueries({ queryKey: ['testPacksStats'] });
      toast({
        title: "TAG actualizado",
        description: "El estado del TAG ha sido actualizado correctamente.",
      });
    },
    onError: (error) => {
      console.error("Error updating tag:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el TAG. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    },
  });

  // Handler functions
  const handleTagRelease = (tagId: string) => {
    updateTagMutation.mutate(tagId);
  };

  const handleDownloadTemplate = () => {
    try {
      const excelBuffer = generateImportTemplate();
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'TestPacks_Import_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Plantilla descargada",
        description: "La plantilla para importación ha sido descargada correctamente."
      });
    } catch (error) {
      console.error("Error downloading template:", error);
      toast({
        title: "Error",
        description: "No se pudo descargar la plantilla. Por favor, inténtelo de nuevo.",
        variant: "destructive"
      });
    }
  };

  const handleExportData = async () => {
    try {
      const excelBuffer = await exportToExcel();
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'TestPacks_Export.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Datos exportados",
        description: "Los datos han sido exportados correctamente a Excel."
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Error",
        description: "No se pudieron exportar los datos. Por favor, inténtelo de nuevo.",
        variant: "destructive"
      });
    }
  };

  const openNewTestPackForm = () => {
    setSelectedTestPack(null);
    setShowFormDialog(true);
  };

  const openImportDialog = () => {
    setShowImportDialog(true);
  };

  const handleFormSuccess = () => {
    refetchTestPacks();
    queryClient.invalidateQueries({ queryKey: ['testPacksStats'] });
    setSelectedTestPack(null);
    setShowFormDialog(false);
  };

  const handleImportSuccess = () => {
    setShowImportDialog(false);
    refetchTestPacks();
    queryClient.invalidateQueries({ queryKey: ['testPacksStats'] });
  };

  return {
    // State
    selectedTab,
    showImportDialog,
    showFormDialog,
    selectedTestPack,
    userRole,
    testPacks,
    stats,
    projectsData,
    
    // Loading states
    isLoadingTestPacks,
    isLoadingStats,
    
    // Setters
    setSelectedTab,
    setShowImportDialog,
    setShowFormDialog,
    setSelectedTestPack,
    
    // Actions
    handleTagRelease,
    handleDownloadTemplate,
    handleExportData,
    refetchTestPacks,
    openNewTestPackForm,
    openImportDialog,
    handleFormSuccess,
    handleImportSuccess
  };
};
