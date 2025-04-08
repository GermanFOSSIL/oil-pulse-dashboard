
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TestPackList from "@/components/testpacks/TestPackList";
import TestPackActivity from "@/components/testpacks/TestPackActivity";
import TestPackStats from "@/components/testpacks/TestPackStats";
import TestPackImportDialog from "@/components/testpacks/TestPackImportDialog";
import TestPackFormDialog from "@/components/testpacks/TestPackFormDialog";
import TestPackToolbar from "@/components/testpacks/TestPackToolbar";
import { useTestPacks } from "@/hooks/useTestPacks";

const TestPacks = () => {
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
    handleTagRelease,
    handleDownloadTemplate,
    handleExportData,
    refetchTestPacks,
    openNewTestPackForm,
    openImportDialog,
    handleFormSuccess,
    handleImportSuccess
  } = useTestPacks();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Paquetes e ITRs</h1>
        <TestPackToolbar 
          onCreateNew={openNewTestPackForm}
          onImport={openImportDialog}
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
