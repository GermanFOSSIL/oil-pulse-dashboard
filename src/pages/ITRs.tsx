
import { useState, useEffect } from "react";
import { ProjectSelector } from "@/components/ProjectSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getSubsystems, Subsystem, getSystemsByProjectId, System } from "@/services/supabaseService";
import { ITRWithDetails } from "@/types/itr-types";
import { ITRList } from "@/components/itr/ITRList";
import { fetchITRsWithDetails, createTestITRs } from "@/services/itrService";
import { addSampleITRs } from "@/scripts/addSampleData";
import { DatabaseActivityTimeline } from "@/components/DatabaseActivityTimeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useLoadingTimeout } from "@/hooks/use-loading-timeout";
import { LoadingFallback } from "@/components/ui/loading-fallback";
import { Skeleton } from "@/components/ui/skeleton";

const ITRs = () => {
  const [itrs, setITRs] = useState<ITRWithDetails[]>([]);
  const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [addingSampleData, setAddingSampleData] = useState(false);
  const [activeTab, setActiveTab] = useState("itrs");
  const { toast } = useToast();
  const { hasTimedOut } = useLoadingTimeout({ loading, timeoutMs: 10000 });

  const fetchData = async () => {
    console.log("Iniciando fetchData en ITRs.tsx");
    setLoading(true);
    setError(null);
    
    try {
      if (selectedProjectId) {
        console.log(`Obteniendo datos para el proyecto: ${selectedProjectId}`);
        
        // Recolectar sistemas primero
        const systemsData = await getSystemsByProjectId(selectedProjectId);
        console.log(`Sistemas obtenidos: ${systemsData.length}`);
        setSystems(systemsData);
        
        // Obtener subsistemas
        const subsystemsData = await getSubsystems();
        console.log(`Subsistemas obtenidos: ${subsystemsData.length}`);
        setSubsystems(subsystemsData);
        
        // Obtener ITRs con detalles
        const enrichedITRs = await fetchITRsWithDetails(selectedProjectId);
        console.log(`ITRs enriquecidos obtenidos: ${enrichedITRs.length}`);
        setITRs(enrichedITRs);
      } else {
        console.log("No hay proyecto seleccionado, limpiando datos");
        setSystems([]);
        setSubsystems([]);
        setITRs([]);
      }
    } catch (err) {
      console.error("Error al obtener datos:", err);
      setError(err instanceof Error ? err : new Error("Error desconocido al cargar datos"));
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de ITRs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedProjectId]);

  const handleSelectProject = (projectId: string | null) => {
    setSelectedProjectId(projectId);
  };

  const handleAddSampleData = async () => {
    if (!selectedProjectId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un proyecto primero",
        variant: "destructive"
      });
      return;
    }
    
    setAddingSampleData(true);
    try {
      const testResult = await createTestITRs();
      
      if (testResult.success) {
        toast({
          title: "ITRs de prueba añadidos",
          description: "Se han añadido 4 ITRs de prueba correctamente",
        });
        fetchData();
      } else {
        const result = await addSampleITRs();
        if (result.success) {
          toast({
            title: "Datos de muestra añadidos",
            description: "Se han añadido ITRs de muestra correctamente",
          });
          fetchData();
        } else {
          toast({
            title: "Error",
            description: "No se pudieron añadir los datos de muestra",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Error adding sample data:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al añadir datos de muestra",
        variant: "destructive"
      });
    } finally {
      setAddingSampleData(false);
    }
  };

  // Renderizado para mostrar error o timeout
  if ((error || hasTimedOut) && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ITRs</h1>
            <p className="text-muted-foreground">
              Gestión de Registros de Inspección (ITRs)
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <ProjectSelector 
              onSelectProject={handleSelectProject}
              selectedProjectId={selectedProjectId}
            />
          </div>
        </div>

        <LoadingFallback 
          title={hasTimedOut ? "Tiempo de carga excedido" : "Error de carga"}
          description={hasTimedOut 
            ? "La operación ha tardado demasiado tiempo. Por favor, inténtalo de nuevo."
            : `Error: ${error?.message || "Error desconocido"}`
          }
          onRetry={fetchData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ITRs</h1>
          <p className="text-muted-foreground">
            Gestión de Registros de Inspección (ITRs)
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <ProjectSelector 
            onSelectProject={handleSelectProject}
            selectedProjectId={selectedProjectId}
          />
        </div>
      </div>

      {!selectedProjectId && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Selección requerida</AlertTitle>
          <AlertDescription>
            Debe seleccionar un proyecto para ver y gestionar los ITRs.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="itrs">ITRs</TabsTrigger>
          <TabsTrigger value="activity">Actividad Reciente</TabsTrigger>
        </TabsList>
        
        <TabsContent value="itrs" className="mt-6">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-[200px] w-full rounded-md" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-[100px] rounded-md" />
                <Skeleton className="h-[100px] rounded-md" />
                <Skeleton className="h-[100px] rounded-md" />
              </div>
            </div>
          ) : selectedProjectId ? (
            <ITRList 
              itrs={itrs}
              subsystems={subsystems}
              systems={systems}
              loading={loading}
              selectedProjectId={selectedProjectId}
              onRefresh={fetchData}
              onAddSampleData={handleAddSampleData}
              addingSampleData={addingSampleData}
            />
          ) : (
            <Card className="border-dashed border-muted">
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-muted-foreground">
                  Seleccione un proyecto para ver los ITRs asociados.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="activity" className="mt-6">
          <DatabaseActivityTimeline />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ITRs;
