
import { useState, useEffect } from "react";
import { ProjectSelector } from "@/components/ProjectSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getSubsystems, Subsystem, getSystemsByProjectId, System } from "@/services/supabaseService";
import { ITRWithDetails } from "@/types/itr-types";
import { ITRList } from "@/components/itr/ITRList";
import { fetchITRsWithDetails, createTestITRs } from "@/services/itrService";
import { addSampleITRs } from "@/scripts/addSampleData";

const ITRs = () => {
  const [itrs, setITRs] = useState<ITRWithDetails[]>([]);
  const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [addingSampleData, setAddingSampleData] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const subsystemsData = await getSubsystems();
      setSubsystems(subsystemsData);
      
      if (selectedProjectId) {
        const systemsData = await getSystemsByProjectId(selectedProjectId);
        setSystems(systemsData);
        
        const enrichedITRs = await fetchITRsWithDetails(selectedProjectId);
        setITRs(enrichedITRs);
      } else {
        const enrichedITRs = await fetchITRsWithDetails(null);
        setITRs(enrichedITRs);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
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
          if (result.data && result.data.project) {
            setSelectedProjectId(result.data.project.id);
          }
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
    </div>
  );
};

export default ITRs;
