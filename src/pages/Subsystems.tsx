
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSubsystems, Subsystem, getSystems, System, deleteSubsystem, getITRsBySubsystemId } from "@/services/supabaseService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubsystemFormModal } from "@/components/modals/SubsystemFormModal";

interface SubsystemWithDetails extends Subsystem {
  systemName?: string;
  projectName?: string;
  itrsCount?: number;
}

const Subsystems = () => {
  const [subsystems, setSubsystems] = useState<SubsystemWithDetails[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSubsystem, setSelectedSubsystem] = useState<Subsystem | undefined>(undefined);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsystemsData, systemsData] = await Promise.all([
        getSubsystems(),
        getSystems()
      ]);
      
      // Create a mapping of system IDs to system objects
      const systemsMap = new Map<string, System>();
      systemsData.forEach(system => systemsMap.set(system.id, system));
      
      // Get ITR counts for each subsystem
      const enrichedSubsystems = await Promise.all(
        subsystemsData.map(async (subsystem) => {
          const itrs = await getITRsBySubsystemId(subsystem.id);
          const system = systemsMap.get(subsystem.system_id);
          
          return {
            ...subsystem,
            systemName: system?.name || 'Sistema Desconocido',
            itrsCount: itrs.length
          };
        })
      );
      
      setSubsystems(enrichedSubsystems);
      setSystems(systemsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de subsistemas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    {
      header: "Nombre del Subsistema",
      accessorKey: "name" as const,
    },
    {
      header: "Sistema",
      accessorKey: "systemName" as const,
    },
    {
      header: "ITRs",
      accessorKey: "itrsCount" as const,
    },
    {
      header: "Tasa de Completado",
      accessorKey: "completion_rate" as const,
      cell: (subsystem: SubsystemWithDetails) => (
        <div className="flex items-center">
          <div className="w-full bg-secondary/10 rounded-full h-2.5 mr-2">
            <div
              className={`h-2.5 rounded-full ${
                (subsystem.completion_rate || 0) === 100
                  ? "bg-status-complete"
                  : (subsystem.completion_rate || 0) < 50
                  ? "bg-status-delayed"
                  : "bg-status-inprogress"
              }`}
              style={{ width: `${subsystem.completion_rate || 0}%` }}
            ></div>
          </div>
          <span>{subsystem.completion_rate || 0}%</span>
        </div>
      ),
    },
  ];

  const handleEditSubsystem = (subsystem: SubsystemWithDetails) => {
    setSelectedSubsystem(subsystem);
    setShowModal(true);
  };

  const handleDeleteSubsystem = async (subsystem: SubsystemWithDetails) => {
    if (confirm(`¿Está seguro que desea eliminar ${subsystem.name}?`)) {
      try {
        await deleteSubsystem(subsystem.id);
        toast({
          title: "Subsistema eliminado",
          description: "El subsistema ha sido eliminado correctamente",
        });
        fetchData();
      } catch (error) {
        console.error("Error al eliminar subsistema:", error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el subsistema",
          variant: "destructive"
        });
      }
    }
  };

  const handleNewSubsystem = () => {
    setSelectedSubsystem(undefined);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedSubsystem(undefined);
  };

  const handleModalSuccess = () => {
    fetchData();
    setShowModal(false);
    setSelectedSubsystem(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subsistemas</h1>
          <p className="text-muted-foreground">
            Gestiona los subsistemas dentro de tus sistemas
          </p>
        </div>
        <Button onClick={handleNewSubsystem}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Subsistema
        </Button>
      </div>

      {subsystems.length === 0 && !loading ? (
        <Card>
          <CardHeader>
            <CardTitle>No hay subsistemas</CardTitle>
            <CardDescription>
              No se encontraron subsistemas en la base de datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Puede importar datos utilizando la función de importación en la página de configuración.</p>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          data={subsystems}
          columns={columns}
          onEdit={handleEditSubsystem}
          onDelete={handleDeleteSubsystem}
          loading={loading}
        />
      )}

      {showModal && (
        <SubsystemFormModal
          open={showModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          subsystem={selectedSubsystem}
          systems={systems}
        />
      )}
    </div>
  );
};

export default Subsystems;
