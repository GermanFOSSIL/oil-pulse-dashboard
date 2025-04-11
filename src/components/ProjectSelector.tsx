
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProjects, Project } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";

interface ProjectSelectorProps {
  onSelectProject: (projectId: string | null) => void;
  selectedProjectId: string | null;
}

export const ProjectSelector = ({ onSelectProject, selectedProjectId }: ProjectSelectorProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const projectsData = await getProjects();
        setProjects(projectsData);
      } catch (error) {
        console.error("Error al cargar proyectos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los proyectos",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [toast]);

  const handleProjectChange = (value: string) => {
    if (value === "all") {
      onSelectProject(null);
    } else {
      onSelectProject(value);
    }
  };

  if (loading) {
    return (
      <div className="w-[250px] h-10 bg-secondary/20 animate-pulse rounded-md"></div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Proyecto:</span>
      <Select
        value={selectedProjectId || "all"}
        onValueChange={handleProjectChange}
        disabled={projects.length === 0}
      >
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Seleccionar proyecto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los proyectos</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
