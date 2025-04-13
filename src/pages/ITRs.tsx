
import { useState, useEffect } from "react";
import { getITRsWithDetails } from "@/services/itrService";
import { getSubsystems } from "@/services/supabaseService";
import { ProjectSelector } from "@/components/ProjectSelector";
import ITRList from "@/components/itr/ITRList";
import { ITRWithDetails } from "@/types/itr-types";
import { useToast } from "@/hooks/use-toast";
import { ITRFormModal } from "@/components/modals/ITRFormModal";

const ITRs = () => {
  const [itrs, setITRs] = useState<ITRWithDetails[]>([]);
  const [subsystems, setSubsystems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedITR, setSelectedITR] = useState<ITRWithDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchITRs = async () => {
    if (!selectedProjectId) {
      setITRs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const itrData = await getITRsWithDetails(selectedProjectId);
      setITRs(itrData);
    } catch (error) {
      console.error("Error fetching ITRs:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los ITRs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubsystems = async () => {
    try {
      const subsystemsData = await getSubsystems();
      setSubsystems(subsystemsData);
    } catch (error) {
      console.error("Error fetching subsystems:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los subsistemas",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchSubsystems();
  }, []);

  useEffect(() => {
    fetchITRs();
  }, [selectedProjectId]);

  const handleSelectProject = (projectId: string | null) => {
    setSelectedProjectId(projectId);
  };

  const handleAddITR = () => {
    setSelectedITR(null);
    setIsModalOpen(true);
  };

  const handleEditITR = (itr: ITRWithDetails) => {
    setSelectedITR(itr);
    setIsModalOpen(true);
  };

  const handleDeleteITR = async (itr: ITRWithDetails) => {
    // Implementar lógica de eliminación
    console.log("Delete ITR:", itr);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedITR(null);
  };

  const handleITRCreated = () => {
    fetchITRs();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ITRs</h1>
          <p className="text-muted-foreground">
            Gestiona los ITRs de tus proyectos
          </p>
        </div>
        <ProjectSelector
          onSelectProject={handleSelectProject}
          selectedProjectId={selectedProjectId}
        />
      </div>

      <ITRList
        itrs={itrs}
        loading={loading}
        onAddITR={handleAddITR}
        onEditITR={handleEditITR}
        onDeleteITR={handleDeleteITR}
        selectedSubsystemId={null}
      />

      <ITRFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleITRCreated}
        itr={selectedITR}
        subsystems={subsystems.filter(sub => {
          // Filtrar subsistemas por proyecto si hay un proyecto seleccionado
          if (!selectedProjectId) return true;
          
          // Aquí necesitaríamos la relación subsistema -> sistema -> proyecto
          // Esta es una implementación básica que asume que tienes la estructura de datos correcta
          return true; // Implementa el filtro correcto según tu estructura de datos
        })}
      />
    </div>
  );
};

export default ITRs;
