
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Project, getProjects, deleteProject } from "@/services/supabaseService";
import { ProjectFormModal } from "@/components/modals/ProjectFormModal";

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>(undefined);
  const { toast } = useToast();

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error("Error al obtener proyectos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const columns = [
    {
      header: "Nombre del Proyecto",
      accessorKey: "name" as const,
    },
    {
      header: "Ubicación",
      accessorKey: "location" as const,
    },
    {
      header: "Fecha Inicio",
      accessorKey: "start_date" as const,
      cell: (project: Project) => (
        <span>{project.start_date ? new Date(project.start_date).toLocaleDateString('es-ES') : 'Sin Fecha'}</span>
      ),
    },
    {
      header: "Fecha Fin",
      accessorKey: "end_date" as const,
      cell: (project: Project) => (
        <span>{project.end_date ? new Date(project.end_date).toLocaleDateString('es-ES') : 'Sin Fecha'}</span>
      ),
    },
    {
      header: "Estado",
      accessorKey: "status" as const,
      cell: (project: Project) => (
        <StatusBadge status={project.status} />
      ),
    },
    {
      header: "Progreso",
      accessorKey: "progress" as const,
      cell: (project: Project) => (
        <div className="w-full bg-secondary/10 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${
              project.status === "complete"
                ? "bg-status-complete"
                : project.status === "delayed"
                ? "bg-status-delayed"
                : "bg-status-inprogress"
            }`}
            style={{ width: `${project.progress || 0}%` }}
          ></div>
        </div>
      ),
    },
  ];

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  const handleDeleteProject = async (project: Project) => {
    if (confirm(`¿Estás seguro de que deseas eliminar ${project.name}?`)) {
      try {
        await deleteProject(project.id);
        toast({
          title: "Proyecto eliminado",
          description: "El proyecto se ha eliminado correctamente",
        });
        fetchProjects();
      } catch (error) {
        console.error("Error al eliminar proyecto:", error);
      }
    }
  };

  const handleNewProject = () => {
    setSelectedProject(undefined);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedProject(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proyectos</h1>
          <p className="text-muted-foreground">
            Gestiona tus proyectos de petróleo y gas
          </p>
        </div>
        <Button onClick={handleNewProject}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      <DataTable
        data={projects}
        columns={columns}
        onEdit={handleEditProject}
        onDelete={handleDeleteProject}
        loading={loading}
      />

      {showModal && (
        <ProjectFormModal
          open={showModal}
          onClose={handleModalClose}
          onSuccess={fetchProjects}
          project={selectedProject}
        />
      )}
    </div>
  );
};

export default Projects;
