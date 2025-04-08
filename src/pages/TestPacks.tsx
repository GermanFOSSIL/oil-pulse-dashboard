
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getTestPacks, 
  updateTag, 
  generateImportTemplate, 
  exportToExcel,
  getTestPacksStats,
  TestPack
} from "@/services/testPackService";

import TestPackList from "@/components/testpacks/TestPackList";
import TestPackActivity from "@/components/testpacks/TestPackActivity";
import TestPackStats from "@/components/testpacks/TestPackStats";
import TestPackImportDialog from "@/components/testpacks/TestPackImportDialog";
import TestPackFormDialog from "@/components/testpacks/TestPackFormDialog";
import TestPackToolbar from "@/components/testpacks/TestPackToolbar";

const TestPacks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("list");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [selectedTestPack, setSelectedTestPack] = useState<TestPack | null>(null);
  
  const getUserRole = async () => {
    if (!user) return 'user';
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      return data?.role || 'user';
    } catch (error) {
      console.error("Error fetching user role:", error);
      return 'user';
    }
  };
  
  const [userRole, setUserRole] = useState<string>('user');
  
  useState(() => {
    getUserRole().then(role => setUserRole(role));
  });

  const { data: testPacks, isLoading: isLoadingTestPacks, refetch: refetchTestPacks } = useQuery({
    queryKey: ['testPacks'],
    queryFn: getTestPacks,
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['testPacksStats'],
    queryFn: getTestPacksStats,
    enabled: selectedTab === 'dashboard'
  });

  const updateTagMutation = useMutation({
    mutationFn: (tagId: string) => updateTag(tagId, { 
      estado: 'liberado',
      fecha_liberacion: new Date().toISOString() 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testPacks'] });
      queryClient.invalidateQueries({ queryKey: ['testPack'] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Paquetes e ITRs</h1>
        <TestPackToolbar 
          onCreateNew={() => setShowFormDialog(true)}
          onImport={() => setShowImportDialog(true)}
          onDownloadTemplate={handleDownloadTemplate}
          onExport={handleExportData}
          onRefresh={() => refetchTestPacks()}
          userRole={userRole}
        />
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Lista de Test Packs</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <TestPackList 
            testPacks={testPacks}
            isLoading={isLoadingTestPacks}
            onTagRelease={handleTagRelease}
            userRole={userRole}
            onClearFilters={() => refetchTestPacks()}
          />
        </TabsContent>
        
        <TabsContent value="dashboard">
          {isLoadingStats ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <TestPackStats stats={stats} />
          )}
        </TabsContent>
        
        <TabsContent value="activity">
          <TestPackActivity />
        </TabsContent>
      </Tabs>
      
      {showImportDialog && (
        <TestPackImportDialog 
          open={showImportDialog} 
          onOpenChange={setShowImportDialog} 
          onSuccess={() => {
            refetchTestPacks();
          }}
        />
      )}
      
      {showFormDialog && (
        <TestPackFormDialog
          open={showFormDialog}
          onOpenChange={setShowFormDialog}
          testPack={selectedTestPack}
          onSuccess={() => {
            refetchTestPacks();
            setSelectedTestPack(null);
            setShowFormDialog(false);
          }}
        />
      )}
    </div>
  );
};

export default TestPacks;
