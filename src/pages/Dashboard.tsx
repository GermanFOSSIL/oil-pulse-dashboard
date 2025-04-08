
import { useEffect, useState } from "react";
import { AreaChart, BarChart3, Briefcase, Layers, ChevronRight } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressCard } from "@/components/ui/progress-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Area, AreaChart as RechartsAreaChart, CartesianGrid, Legend } from "recharts";
import { getDashboardStats, getProjects, getSystems, getSubsystems, getITRs } from "@/services/supabaseService";
import { initializeStorage } from "@/services/storageService";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ProjectSelector } from "@/components/ProjectSelector";
import { EnhancedGanttChart } from "@/components/EnhancedGanttChart";

interface DashboardStats {
  totalProjects: number;
  totalSystems: number;
  totalITRs: number;
  completionRate: number;
  projectsData: {
    title: string;
    value: number;
    description: string;
    variant: "success" | "warning" | "danger";
  }[];
  chartData: { name: string; value: number }[];
  areaChartData: { 
    name: string; 
    inspections: number; 
    completions: number; 
    issues: number;
  }[];
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [ganttData, setGanttData] = useState<any[]>([]);
  const [ganttLoading, setGanttLoading] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      await initializeStorage();
      const dashboardData = await getDashboardStats(selectedProjectId);
      setStats(dashboardData as DashboardStats);
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGanttData = async () => {
    if (!selectedProjectId) return;
    
    try {
      setGanttLoading(true);
      
      // Obtener proyecto seleccionado
      const projects = await getProjects();
      const currentProject = projects.find(p => p.id === selectedProjectId);
      
      if (!currentProject) {
        setGanttData([]);
        return;
      }
      
      // Obtener sistemas del proyecto
      const allSystems = await getSystems();
      const projectSystems = allSystems.filter(s => s.project_id === selectedProjectId);
      
      // Obtener todos los subsistemas
      const allSubsystems = await getSubsystems();
      
      // Obtener todos los ITRs
      const allITRs = await getITRs();
      
      // Formar estructura jerárquica para Gantt
      const ganttItems = [];
      
      // Añadir proyecto como nivel principal
      ganttItems.push({
        id: currentProject.id,
        task: currentProject.name,
        type: 'project',
        parent: '0',
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días atrás
        end: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 días adelante
        progress: currentProject.progress || 0,
        dependencies: ''
      });
      
      // Añadir sistemas como segundo nivel
      projectSystems.forEach(system => {
        ganttItems.push({
          id: system.id,
          task: system.name,
          type: 'system',
          parent: currentProject.id,
          start: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progress: system.completion_rate || 0,
          dependencies: ''
        });
        
        // Filtrar subsistemas del sistema actual
        const systemSubsystems = allSubsystems.filter(ss => ss.system_id === system.id);
        
        // Añadir subsistemas como tercer nivel
        systemSubsystems.forEach(subsystem => {
          ganttItems.push({
            id: subsystem.id,
            task: subsystem.name,
            type: 'subsystem',
            parent: system.id,
            start: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            progress: subsystem.completion_rate || 0,
            dependencies: ''
          });
          
          // Filtrar ITRs del subsistema actual
          const subsystemITRs = allITRs.filter(itr => itr.subsystem_id === subsystem.id);
          
          // Añadir ITRs como cuarto nivel
          subsystemITRs.forEach(itr => {
            const dueDate = itr.due_date ? new Date(itr.due_date) : new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
            const startDate = new Date(dueDate);
            startDate.setDate(startDate.getDate() - 15); // Restar 15 días para fecha inicio
            
            ganttItems.push({
              id: itr.id,
              task: itr.name,
              type: 'itr',
              parent: subsystem.id,
              start: startDate.toISOString().split('T')[0],
              end: dueDate.toISOString().split('T')[0],
              progress: itr.progress || 0,
              status: itr.status,
              dependencies: ''
            });
          });
        });
      });
      
      setGanttData(ganttItems);
    } catch (error) {
      console.error("Error al cargar datos del Gantt:", error);
    } finally {
      setGanttLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchGanttData();
  }, [selectedProjectId]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 60000); // Actualizar cada minuto
    
    return () => clearInterval(interval);
  }, [selectedProjectId]);

  const handleSelectProject = (projectId: string | null) => {
    setSelectedProjectId(projectId);
  };

  if (loading && !stats) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const isEmpty = !stats || (
    stats.totalProjects === 0 &&
    stats.totalSystems === 0 &&
    stats.totalITRs === 0
  );

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Resumen de la gestión de proyectos y métricas clave
            </p>
          </div>
          <ProjectSelector 
            onSelectProject={handleSelectProject}
            selectedProjectId={selectedProjectId}
          />
        </div>
        
        <Card className="p-8">
          <div className="text-center space-y-6">
            <div className="mx-auto max-w-md">
              <h2 className="text-2xl font-bold">No hay datos disponibles</h2>
              <p className="text-muted-foreground mt-2">
                La aplicación no tiene datos cargados. Puede importar datos desde la sección de configuración.
              </p>
            </div>
            <Button onClick={() => navigate('/configuration')}>
              Ir a configuración
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de la gestión de proyectos y métricas clave
          </p>
        </div>
        <ProjectSelector 
          onSelectProject={handleSelectProject}
          selectedProjectId={selectedProjectId}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Proyectos"
          value={stats.totalProjects.toString()}
          description="Proyectos activos de petróleo y gas"
          icon={<Briefcase className="h-4 w-4" />}
          trend={{ value: 0, positive: true }}
        />
        <StatCard
          title="Sistemas"
          value={stats.totalSystems.toString()}
          description="A través de todos los proyectos"
          icon={<Layers className="h-4 w-4" />}
          trend={{ value: 0, positive: true }}
        />
        <StatCard
          title="ITRs"
          value={stats.totalITRs.toString()}
          description="Total de registros de inspección"
          icon={<BarChart3 className="h-4 w-4" />}
          trend={{ value: 0, positive: true }}
        />
        <StatCard
          title="Tasa de Completado"
          value={`${stats.completionRate}%`}
          description="Promedio en todos los proyectos"
          icon={<AreaChart className="h-4 w-4" />}
          trend={{ value: 0, positive: true }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.projectsData.map((project, index) => (
          <ProgressCard
            key={index}
            title={project.title}
            value={project.value}
            description={project.description}
            variant={project.variant}
            className="col-span-1"
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Progreso del Proyecto</CardTitle>
            <CardDescription>
              Tasas de finalización mensuales en todos los proyectos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.chartData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--secondary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad ITR</CardTitle>
            <CardDescription>
              Tendencias de inspección y finalización
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsAreaChart data={stats.areaChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="inspections" 
                  stroke="hsl(var(--secondary))" 
                  fill="hsl(var(--secondary)/0.2)" 
                  stackId="1" 
                  name="Inspecciones"
                />
                <Area 
                  type="monotone" 
                  dataKey="completions" 
                  stroke="#22c55e" 
                  fill="#22c55e20" 
                  stackId="2" 
                  name="Completados"
                />
                <Area 
                  type="monotone" 
                  dataKey="issues" 
                  stroke="#ef4444" 
                  fill="#ef444420" 
                  stackId="3" 
                  name="Problemas"
                />
              </RechartsAreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Cronograma de Tareas</CardTitle>
          <CardDescription>
            Planificación y progreso de las tareas del proyecto
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          {ganttLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : ganttData.length > 0 ? (
            <EnhancedGanttChart data={ganttData} />
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">No hay tareas programadas para este proyecto</p>
              {selectedProjectId && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/itrs')}
                  className="mx-auto"
                >
                  Ir a gestión de ITRs
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
