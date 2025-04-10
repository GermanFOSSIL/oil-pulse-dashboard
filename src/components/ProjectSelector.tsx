
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { getProjects } from "@/services/supabaseService";
import { ChevronDown, Check } from "lucide-react";

export interface ProjectSelectorProps {
  onSelectProject: (projectId: string | null) => void;
  selectedProjectId: string | null;
  className?: string;
}

export const ProjectSelector = ({ 
  onSelectProject, 
  selectedProjectId,
  className = "" 
}: ProjectSelectorProps) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsData = await getProjects();
        setProjects(projectsData);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const selectedProject = selectedProjectId
    ? projects.find(project => project.id === selectedProjectId)
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`w-full justify-between ${className}`} disabled={loading}>
          <span className="truncate">
            {loading
              ? "Cargando proyectos..."
              : selectedProject
              ? selectedProject.name
              : "Todos los proyectos"
            }
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem onClick={() => onSelectProject(null)}>
          <span className="flex items-center">
            {!selectedProjectId && <Check className="mr-2 h-4 w-4" />}
            <span className={!selectedProjectId ? "font-medium" : ""}>Todos los proyectos</span>
          </span>
        </DropdownMenuItem>
        {projects.map((project) => (
          <DropdownMenuItem 
            key={project.id} 
            onClick={() => onSelectProject(project.id)}
          >
            <span className="flex items-center">
              {selectedProjectId === project.id && <Check className="mr-2 h-4 w-4" />}
              <span className={selectedProjectId === project.id ? "font-medium" : ""}>{project.name}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
