
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Plus, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSubsystems, Subsystem, getSystems, System, deleteSubsystem, getITRsBySubsystemId } from "@/services/supabaseService";
import { getSystemsByProjectId } from "@/services/systemService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubsystemFormModal } from "@/components/modals/SubsystemFormModal";
import { DatabaseActivityTimeline } from "@/components/DatabaseActivityTimeline";
import { ProjectSelector } from "@/components/ProjectSelector";
import { Alert, AlertDescription, AlertTitle, AlertCircle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SubsystemWithDetails extends Subsystem {
  systemName?: string;
  projectName?: string;
  itrsCount?: number;
  itrsQuantity?: number;
}

const Subsystems = () => {
  const [subsystems, setSubsystems] = useState<SubsystemWithDetails[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSubsystem, setSelectedSubsystem] = useState<Subsystem | undefined>(undefined);
  const [systemFilter, setSystemFilter] = useState<string>("all");
  const [completionFilter, setCompletionFilter] = useState<string>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      if (selectedProjectId) {
        // Obtener sistemas del proyecto seleccionado
        const systemsData = await getSystemsByProjectId(selectedProjectId);
        setSystems(systemsData);
        
        if (systemsData.length === 0) {
          setSubsystems([]);
          setLoading(false);
          return;
        }
        
        const systemIds = systemsData.map(system => system.id);
        const subsystemsData = await getSubsystems(systemIds);
        
        const systemsMap = new Map<string, System>();
        systemsData.forEach(system => systemsMap.set(system.id, system));
        
        const enrichedSubsystems = await Promise.all(
          subsystemsData.map(async (subsystem) => {
            const itrs = await getITRsBySubsystemId(subsystem.id);
            const system = systemsMap.get(subsystem.system_id);
            
            const totalQuantity = itrs.reduce((sum, itr) => {
              return sum + ((itr as any).quantity || 1);
            }, 0);
            
            return {
              ...subsystem,
              systemName: system?.name || 'Sistema Desconocido',
              itrsCount: itrs.length,
              itrsQuantity: totalQuantity
            };
          })
        );
        
        setSubsystems(enrichedSubsystems);
      } else {
        setSystems([]);
        setSubsystems([]);
      }
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
  }, [selectedProjectId]);

  const filteredSubsystems = subsystems.filter(subsystem => {
    if (systemFilter !== "all" && subsystem.systemName !== systemFilter) {
      return false;
    }
    
    if (completionFilter === "completed" && (subsystem.completion_rate || 0) < 100) {
      return false;
    } else if (completionFilter === "inprogress" && (subsystem.completion_rate || 0) === 100) {
      return false;
    }
    
    return true;
  });

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
      header: "ITRs (Cantidad Total)",
      accessorKey: "itrsQuantity" as const,
      cell: (subsystem: SubsystemWithDetails) => (
        <div>
          {subsystem.itrsCount} ITRs ({subsystem.itrsQuantity || 0} unidades)
        </div>
      ),
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
    if (!selectedProjectId) {
      toast({
        title: "Seleccione un proyecto",
        description: "Debe seleccionar un proyecto antes de crear un subsistema",
        variant: "destructive"
      });
      return;
    }
    
    if (systems.length === 0) {
      toast({
        title: "No hay sistemas",
        description: "Debe crear al menos un sistema para el proyecto seleccionado antes de crear subsistemas",
        variant: "destructive"
      });
      return;
    }
    
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

  const handleSelectProject = (projectId: string | null) => {
    setSelectedProjectId(projectId);
    setSystemFilter("all");
  };

  const uniqueSystems = Array.from(new Set(subsystems.map(s => s.systemName))).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subsistemas</h1>
          <p className="text-muted-foreground">
            Gestiona los subsistemas dentro de tus sistemas
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <ProjectSelector 
            onSelectProject={handleSelectProject}
            selectedProjectId={selectedProjectId}
          />
          <Button onClick={handleNewSubsystem}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Subsistema
          </Button>
        </div>
      </div>

      {!selectedProjectId && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Selección requerida</AlertTitle>
          <AlertDescription>
            Seleccione un proyecto para ver y gestionar los subsistemas.
          </AlertDescription>
        </Alert>
      )}

      {selectedProjectId && systems.length === 0 && !loading ? (
        <Card>
          <CardHeader>
            <CardTitle>No hay sistemas</CardTitle>
            <CardDescription>
              No se encontraron sistemas para el proyecto seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Primero debe crear sistemas para poder añadir subsistemas.</p>
          </CardContent>
        </Card>
      ) : selectedProjectId && subsystems.length === 0 && !loading ? (
        <Card>
          <CardHeader>
            <CardTitle>No hay subsistemas</CardTitle>
            <CardDescription>
              No se encontraron subsistemas para los sistemas del proyecto seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Utilice el botón "Nuevo Subsistema" para crear uno.</p>
          </CardContent>
        </Card>
      ) : selectedProjectId && (
        <>
          <div className="flex justify-start items-center mb-4 space-x-2">
            <div className="w-[180px]">
              <Select
                value={systemFilter}
                onValueChange={setSystemFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por sistema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los sistemas</SelectItem>
                  {uniqueSystems.map((system, index) => (
                    <SelectItem key={index} value={system as string}>
                      {system}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-[180px]">
              <Select
                value={completionFilter}
                onValueChange={setCompletionFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por completado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Completados</SelectItem>
                  <SelectItem value="inprogress">En progreso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable
            data={filteredSubsystems}
            columns={columns}
            onEdit={handleEditSubsystem}
            onDelete={handleDeleteSubsystem}
            loading={loading}
          />
        </>
      )}

      <DatabaseActivityTimeline />

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
