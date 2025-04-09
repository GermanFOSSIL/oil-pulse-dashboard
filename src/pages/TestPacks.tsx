
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTestPacks } from "@/hooks/useTestPacks";
import { PlusCircle, Search, FileSpreadsheet, Filter, RefreshCw } from "lucide-react";
import TestPackList from "@/components/testpack/TestPackList";
import TestPackStats from "@/components/testpack/TestPackStats";
import TestPackFormModal from "@/components/testpack/TestPackFormModal";
import BatchUploadModal from "@/components/testpack/BatchUploadModal";
import { DatabaseActivityTimeline } from "@/components/DatabaseActivityTimeline";
import { useToast } from "@/hooks/use-toast";

const TestPacks = () => {
  const { testPacks, loading, statsData, fetchTestPacks } = useTestPacks();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isBatchUploadModalOpen, setIsBatchUploadModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  
  const filteredTestPacks = testPacks.filter(
    (testPack) => testPack.nombre_paquete.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchTestPacks();
      toast({
        title: "Actualizado",
        description: "Los datos se han actualizado correctamente",
      });
    } catch (error) {
      console.error("Error al actualizar datos:", error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
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
          <Button 
            variant="outline" 
            className="h-10"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Actualizando..." : "Actualizar"}
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
          <TestPackList 
            testPacks={filteredTestPacks} 
            loading={loading} 
            onRefresh={fetchTestPacks}
          />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
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
  );
};

export default TestPacks;
