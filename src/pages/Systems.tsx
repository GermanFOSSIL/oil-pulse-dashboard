import { useState, useEffect } from "react";
import { ProjectSelector } from "@/components/ProjectSelector";
import { SystemList } from "@/components/system/SystemList";
import { SystemFormModal } from "@/components/modals/SystemFormModal";
import { useToast } from "@/hooks/use-toast";
import { getSystems, getSystemsByProjectId } from "@/services/supabaseService";
import { getProjects } from "@/services/projectService";
import { Project, System } from "@/services/types"; // Updated import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Systems = () => {
  const [systems, setSystems] = useState<System[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSystemFormModalOpen, setIsSystemFormModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      if (selectedProjectId) {
        const systemsData = await getSystemsByProjectId(selectedProjectId);
        setSystems(systemsData);
      } else {
        const allSystemsData = await getSystems();
        setSystems(allSystemsData);
      }
    } catch (error) {
      console.error("Error fetching systems:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los sistemas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedProjectId]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsData = await getProjects();
        setProjects(projectsData);
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los proyectos",
          variant: "destructive"
        });
      }
    };

    fetchProjects();
  }, [toast]);

  const handleSelectProject = (projectId: string | null) => {
    setSelectedProjectId(projectId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sistemas</h1>
          <p className="text-muted-foreground">
            Administración de Sistemas
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <ProjectSelector
            onSelectProject={handleSelectProject}
            selectedProjectId={selectedProjectId}
          />
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2"
            onClick={() => setIsSystemFormModalOpen(true)}
          >
            Agregar Sistema
          </button>
        </div>
      </div>

      {!selectedProjectId && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Selección requerida</AlertTitle>
          <AlertDescription>
            Debe seleccionar un proyecto para ver y gestionar los sistemas.
          </AlertDescription>
        </Alert>
      )}

      <SystemList
        systems={systems}
        loading={loading}
        selectedProjectId={selectedProjectId}
        onRefresh={fetchData}
      />

      <SystemFormModal
        isOpen={isSystemFormModalOpen}
        onClose={() => setIsSystemFormModalOpen(false)}
        projects={projects}
        onSuccess={() => {
          setIsSystemFormModalOpen(false);
          fetchData();
        }}
      />
    </div>
  );
};

export default Systems;
