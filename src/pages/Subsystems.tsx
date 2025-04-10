import { useState, useEffect } from "react";
import { getSubsystems, getSystemsByProjectId } from "@/services/supabaseService";
import { Subsystem, System } from "@/services/types"; // Updated import
import { ProjectSelector } from "@/components/ProjectSelector";
import { SubsystemList } from "@/components/subsystem/SubsystemList";
import { SubsystemFormModal } from "@/components/modals/SubsystemFormModal";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Subsystems = () => {
  const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      if (selectedProjectId) {
        const systemsData = await getSystemsByProjectId(selectedProjectId);
        setSystems(systemsData);

        const systemIds = systemsData.map(system => system.id);
        const subsystemsData = await getSubsystems();
        const filteredSubsystems = subsystemsData.filter(
          subsystem => systemIds.includes(subsystem.system_id)
        );
        setSubsystems(filteredSubsystems);
      } else {
        setSystems([]);
        setSubsystems([]);
      }
    } catch (error) {
      console.error("Error fetching subsystems:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los subsistemas",
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subsistemas</h1>
          <p className="text-muted-foreground">
            Gestiona los subsistemas de tus proyectos.
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
            Debe seleccionar un proyecto para ver y gestionar los subsistemas.
          </AlertDescription>
        </Alert>
      )}

      {selectedProjectId ? (
        <SubsystemList
          subsystems={subsystems}
          systems={systems}
          loading={loading}
          onOpenModal={() => setIsModalOpen(true)}
          onRefresh={fetchData}
          selectedProjectId={selectedProjectId}
        />
      ) : (
        <Card className="border-dashed border-muted">
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-muted-foreground">
              Seleccione un proyecto para ver los subsistemas asociados.
            </p>
          </CardContent>
        </Card>
      )}

      <SubsystemFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        systems={systems}
        selectedProjectId={selectedProjectId}
      />
    </div>
  );
};

export default Subsystems;
