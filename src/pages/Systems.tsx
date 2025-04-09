
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSystems, deleteSystem, getSystemsByProjectId } from "@/services/systemService";
import { getProjects } from "@/services/projectService";
import { System, Project } from "@/services/types";
import { SystemFormModal } from "@/components/modals/SystemFormModal";
import { ProjectSelector } from "@/components/ProjectSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle, AlertCircle } from "@/components/ui/alert";

const Systems = () => {
  const [systems, setSystems] = useState<System[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsMap, setProjectsMap] = useState<{ [key: string]: Project }>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<System | undefined>(undefined);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const projectsData = await getProjects();
      setProjects(projectsData);
      
      // Crear un mapa de proyectos para búsqueda rápida
      const projectsMap: { [key: string]: Project } = {};
      projectsData.forEach(project => {
        projectsMap[project.id] = project;
      });
      setProjectsMap(projectsMap);

      if (selectedProjectId) {
        // Si hay un proyecto seleccionado, obtener solo los sistemas de ese proyecto
        const systemsData = await getSystemsByProjectId(selectedProjectId);
        setSystems(systemsData);
      } else {
        setSystems([]);
      }
    } catch (error) {
      console.error("Error al obtener datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedProjectId]);

  const columns = [
    {
      header: "Nombre del Sistema",
      accessorKey: "name" as const,
    },
    {
      header: "Proyecto",
      accessorKey: "project_id" as const,
      cell: (system: System) => (
        <span>{projectsMap[system.project_id]?.name || "Desconocido"}</span>
      ),
    },
    {
      header: "Fecha Inicio",
      accessorKey: "start_date" as const,
      cell: (system: System) => (
        <span>{system.start_date ? new Date(system.start_date).toLocaleDateString('es-ES') : 'Sin Fecha'}</span>
      ),
    },
    {
      header: "Fecha Fin",
      accessorKey: "end_date" as const,
      cell: (system: System) => (
        <span>{system.end_date ? new Date(system.end_date).toLocaleDateString('es-ES') : 'Sin Fecha'}</span>
      ),
    },
    {
      header: "Tasa de Completado",
      accessorKey: "completion_rate" as const,
      cell: (system: System) => (
        <div className="flex items-center">
          <div className="w-full bg-secondary/10 rounded-full h-2.5 mr-2">
            <div
              className="bg-secondary h-2.5 rounded-full"
              style={{ width: `${system.completion_rate}%` }}
            ></div>
          </div>
          <span>{system.completion_rate}%</span>
        </div>
      ),
    },
  ];

  const handleEditSystem = (system: System) => {
    setSelectedSystem(system);
    setShowModal(true);
  };

  const handleDeleteSystem = async (system: System) => {
    if (confirm(`¿Estás seguro de que deseas eliminar ${system.name}?`)) {
      try {
        await deleteSystem(system.id);
        toast({
          title: "Sistema eliminado",
          description: "El sistema se ha eliminado correctamente",
        });
        fetchData();
      } catch (error) {
        console.error("Error al eliminar sistema:", error);
      }
    }
  };

  const handleNewSystem = () => {
    if (!selectedProjectId) {
      toast({
        title: "Seleccione un proyecto",
        description: "Debe seleccionar un proyecto antes de crear un sistema",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedSystem(undefined);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedSystem(undefined);
  };

  const handleSelectProject = (projectId: string | null) => {
    setSelectedProjectId(projectId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sistemas</h1>
          <p className="text-muted-foreground">
            Gestiona los sistemas dentro de tus proyectos
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <ProjectSelector 
            onSelectProject={handleSelectProject}
            selectedProjectId={selectedProjectId}
          />
          <Button onClick={handleNewSystem}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Sistema
          </Button>
        </div>
      </div>

      {!selectedProjectId && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Selección requerida</AlertTitle>
          <AlertDescription>
            Seleccione un proyecto para ver y gestionar los sistemas.
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
            <p>Utilice el botón "Nuevo Sistema" para crear uno.</p>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          data={systems}
          columns={columns}
          onEdit={handleEditSystem}
          onDelete={handleDeleteSystem}
          loading={loading}
        />
      )}

      {showModal && (
        <SystemFormModal
          open={showModal}
          onClose={handleModalClose}
          onSuccess={fetchData}
          system={selectedSystem}
          projects={projects}
          defaultProjectId={selectedProjectId || undefined}
        />
      )}
    </div>
  );
};

export default Systems;
