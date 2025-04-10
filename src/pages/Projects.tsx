
import { useState, useEffect } from "react";
import { ProjectList } from "@/components/project/ProjectList";
import { ProjectFormModal } from "@/components/modals/ProjectFormModal";
import { useToast } from "@/hooks/use-toast";
import { getProjects } from "@/services/projectService";
import { Project } from "@/services/types";

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const projectsData = await getProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setSelectedProject(null);
    setIsFormModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsFormModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsFormModalOpen(false);
    setSelectedProject(null);
  };

  const handleProjectCreated = () => {
    fetchProjects();
  };

  const handleProjectUpdated = () => {
    fetchProjects();
  };

  const handleProjectDeleted = () => {
    fetchProjects();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage and monitor your projects.
          </p>
        </div>
        <div>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2"
          >
            Add Project
          </button>
        </div>
      </div>
      <ProjectList
        projects={projects}
        loading={loading}
        onEdit={handleEditProject}
        onDelete={handleProjectDeleted}
      />
      <ProjectFormModal
        open={isFormModalOpen}
        onClose={handleCloseModal}
        project={selectedProject}
        onProjectCreated={handleProjectCreated}
        onProjectUpdated={handleProjectUpdated}
      />
    </div>
  );
};

export default Projects;
