
import { useEffect, useState } from "react";
import { 
  AreaChart, BarChart3, Briefcase, Layers, 
  CheckCircle, AlertTriangle, Clock, Calendar, ChartGantt
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Area, AreaChart as RechartsAreaChart, CartesianGrid, Legend } from "recharts";
import { getDashboardStats, getProjects, getSystems, getSubsystems, getITRs } from "@/services/supabaseService";
import { Button } from "@/components/ui/button";
import { ProjectSelector } from "@/components/ProjectSelector";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { EnhancedGanttChart } from "@/components/EnhancedGanttChart";

interface DashboardStats {
  totalProjects: number;
  totalSystems: number;
  totalSubsystems: number;
  totalITRs: number;
  completionRate: number;
  itrsByStatus: {
    complete: number;
    inprogress: number;
    delayed: number;
  };
  chartData: { name: string; value: number }[];
  areaChartData: { 
    name: string; 
    inspections: number; 
    completions: number; 
    issues: number;
  }[];
}

interface GanttItem {
  id: string;
  task: string;
  start: string;
  end: string;
  progress: number;
  type?: string;
  parent?: string;
  status?: string;
  dependencies?: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [ganttData, setGanttData] = useState<GanttItem[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch basic counts
      const projects = await getProjects();
      const systems = await getSystems();
      const subsystems = await getSubsystems();
      const itrs = await getITRs();
      
      // Filter by selected project if needed
      const filteredSystems = selectedProjectId 
        ? systems.filter(s => s.project_id === selectedProjectId)
        : systems;
      
      const filteredSubsystemIds = filteredSystems.flatMap(system => {
        const systemSubsystems = subsystems.filter(ss => ss.system_id === system.id);
        return systemSubsystems.map(ss => ss.id);
      });
      
      const filteredITRs = itrs.filter(itr => 
        selectedProjectId ? filteredSubsystemIds.includes(itr.subsystem_id) : true
      );
      
      // Calculate overall completion rate
      let completionSum = 0;
      let completionCount = 0;
      
      filteredSystems.forEach(system => {
        if (system.completion_rate !== null) {
          completionSum += system.completion_rate;
          completionCount++;
        }
      });
      
      const overallCompletionRate = completionCount > 0 
        ? Math.round(completionSum / completionCount) 
        : 0;
      
      // Count ITRs by status
      const itrsByStatus = {
        complete: filteredITRs.filter(itr => itr.status === 'complete').length,
        inprogress: filteredITRs.filter(itr => itr.status === 'inprogress').length,
        delayed: filteredITRs.filter(itr => itr.status === 'delayed').length
      };
      
      // Generate chart data for monthly progress
      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const currentMonth = new Date().getMonth();
      
      const chartData = Array.from({ length: 6 }, (_, i) => {
        const monthIndex = (currentMonth - 5 + i + 12) % 12; // Get last 6 months
        return {
          name: monthNames[monthIndex],
          value: 40 + Math.floor(Math.random() * 30) // Simulate increasing trend
        };
      });
      
      // Generate area chart data
      const areaChartData = monthNames.map((month, index) => {
        const baseNumber = 20 + index * 5;
        return {
          name: month,
          inspections: baseNumber + Math.floor(Math.random() * 15),
          completions: baseNumber - 5 + Math.floor(Math.random() * 10),
          issues: Math.floor(Math.random() * 10)
        };
      });
      
      setStats({
        totalProjects: selectedProjectId ? 1 : projects.length,
        totalSystems: filteredSystems.length,
        totalSubsystems: filteredSubsystemIds.length,
        totalITRs: filteredITRs.length,
        completionRate: overallCompletionRate,
        itrsByStatus,
        chartData,
        areaChartData
      });

      // Generate Gantt chart data
      const ganttItems: GanttItem[] = [];
      
      // Add projects
      const projectsToShow = selectedProjectId 
        ? projects.filter(p => p.id === selectedProjectId) 
        : projects;
      
      projectsToShow.forEach(project => {
        // Add project as a parent task
        ganttItems.push({
          id: `project-${project.id}`,
          task: project.name,
          start: new Date(project.created_at).toISOString().split('T')[0],
          end: new Date(new Date(project.created_at).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progress: project.progress || 0,
          type: "project"
        });
        
        // Add systems for this project
        const projectSystems = filteredSystems.filter(s => s.project_id === project.id);
        
        projectSystems.forEach(system => {
          const systemStartDate = new Date(system.created_at);
          const systemEndDate = new Date(systemStartDate.getTime() + 60 * 24 * 60 * 60 * 1000);
          
          ganttItems.push({
            id: `system-${system.id}`,
            task: system.name,
            start: systemStartDate.toISOString().split('T')[0],
            end: systemEndDate.toISOString().split('T')[0],
            progress: system.completion_rate || 0,
            type: "system",
            parent: `project-${project.id}`
          });
          
          // Add subsystems for this system
          const systemSubsystems = subsystems.filter(ss => ss.system_id === system.id);
          
          systemSubsystems.forEach(subsystem => {
            const subsystemStartDate = new Date(subsystem.created_at);
            const subsystemEndDate = new Date(subsystemStartDate.getTime() + 30 * 24 * 60 * 60 * 1000);
            
            ganttItems.push({
              id: `subsystem-${subsystem.id}`,
              task: subsystem.name,
              start: subsystemStartDate.toISOString().split('T')[0],
              end: subsystemEndDate.toISOString().split('T')[0],
              progress: subsystem.completion_rate || 0,
              type: "subsystem",
              parent: `system-${system.id}`
            });
            
            // Add ITRs for this subsystem
            const subsystemITRs = filteredITRs.filter(itr => itr.subsystem_id === subsystem.id);
            
            subsystemITRs.forEach(itr => {
              const itrStartDate = new Date(itr.created_at);
              // Use due_date if available, otherwise calculate based on creation date
              const itrEndDate = itr.due_date 
                ? new Date(itr.due_date) 
                : new Date(itrStartDate.getTime() + 14 * 24 * 60 * 60 * 1000);
              
              ganttItems.push({
                id: `itr-${itr.id}`,
                task: itr.name,
                start: itrStartDate.toISOString().split('T')[0],
                end: itrEndDate.toISOString().split('T')[0],
                progress: itr.progress || 0,
                type: "task",
                parent: `subsystem-${subsystem.id}`,
                status: itr.status
              });
            });
          });
        });
      });
      
      setGanttData(ganttItems);
      
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Set up refresh interval
    const interval = setInterval(() => {
      fetchData();
    }, 60000); // refresh every minute
    
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

  if (!stats) {
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Proyectos</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">Proyectos activos</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sistemas</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSystems}</div>
            <p className="text-xs text-muted-foreground">
              {selectedProjectId ? "En este proyecto" : "A través de todos los proyectos"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ITRs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalITRs}</div>
            <p className="text-xs text-muted-foreground">Total de registros de inspección</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Completado</CardTitle>
            <AreaChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {selectedProjectId ? "De este proyecto" : "Promedio en todos los proyectos"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ITR Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-green-50 dark:bg-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ITRs Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.itrsByStatus.complete}</div>
            <div className="mt-2 h-2 w-full rounded-full bg-green-100 dark:bg-green-950/50">
              <div 
                className="h-2 rounded-full bg-green-500" 
                style={{ 
                  width: `${stats.totalITRs > 0 ? (stats.itrsByStatus.complete / stats.totalITRs) * 100 : 0}%` 
                }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {stats.totalITRs > 0 
                ? `${Math.round((stats.itrsByStatus.complete / stats.totalITRs) * 100)}% del total` 
                : "No hay ITRs"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ITRs En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.itrsByStatus.inprogress}</div>
            <div className="mt-2 h-2 w-full rounded-full bg-amber-100 dark:bg-amber-950/50">
              <div 
                className="h-2 rounded-full bg-amber-500" 
                style={{ 
                  width: `${stats.totalITRs > 0 ? (stats.itrsByStatus.inprogress / stats.totalITRs) * 100 : 0}%` 
                }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {stats.totalITRs > 0 
                ? `${Math.round((stats.itrsByStatus.inprogress / stats.totalITRs) * 100)}% del total` 
                : "No hay ITRs"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-red-50 dark:bg-red-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ITRs Retrasados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.itrsByStatus.delayed}</div>
            <div className="mt-2 h-2 w-full rounded-full bg-red-100 dark:bg-red-950/50">
              <div 
                className="h-2 rounded-full bg-red-500" 
                style={{ 
                  width: `${stats.totalITRs > 0 ? (stats.itrsByStatus.delayed / stats.totalITRs) * 100 : 0}%` 
                }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {stats.totalITRs > 0 
                ? `${Math.round((stats.itrsByStatus.delayed / stats.totalITRs) * 100)}% del total` 
                : "No hay ITRs"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gantt Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ChartGantt className="mr-2 h-5 w-5" />
            Cronograma de Tareas del Proyecto
          </CardTitle>
          <CardDescription>
            Vista de sistemas, subsistemas e ITRs con fechas planificadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ganttData.length > 0 ? (
            <EnhancedGanttChart data={ganttData} />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay datos disponibles para el cronograma</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
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
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Progreso']}
                  labelFormatter={(label) => `Mes: ${label}`}
                />
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

      {/* Critical Path Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Ruta Crítica del Proyecto</CardTitle>
          <CardDescription>
            Actividades críticas que pueden afectar la fecha de entrega
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-4 h-full w-px bg-muted"></div>
            
            {[1, 2, 3, 4].map((item, index) => (
              <div key={index} className="mb-8 grid gap-2 last:mb-0 md:grid-cols-[1fr_4fr]">
                <div className="flex items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-muted bg-background z-10">
                    <span className="flex h-2 w-2 rounded-full bg-primary"></span>
                  </div>
                  <div className="ml-4 text-sm">
                    {`${new Date().getDate() + index * 7}/${new Date().getMonth() + 1}`}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold tracking-tight">
                    {index === 0 && "Revisión del Sistema de Control"}
                    {index === 1 && "Pruebas de Integración"}
                    {index === 2 && "Validación Final de Seguridad"}
                    {index === 3 && "Entrega del Proyecto"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {index === 0 && "Verificación de todos los sistemas de control automatizado, 5 días de trabajo."}
                    {index === 1 && "Integración de sistemas eléctricos y mecánicos, 7 días de trabajo."}
                    {index === 2 && "Validación de todos los sistemas de seguridad, 4 días de trabajo."}
                    {index === 3 && "Entrega final del proyecto al cliente, 1 día."}
                  </p>
                  <div className="mt-2 flex items-center text-xs text-muted-foreground">
                    <Calendar className="mr-1 h-3 w-3" />
                    <span>
                      {index === 0 && "Responsable: Ing. Eléctrico"}
                      {index === 1 && "Responsable: Jefe de Proyecto"}
                      {index === 2 && "Responsable: Ing. de Seguridad"}
                      {index === 3 && "Responsable: Director de Proyecto"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => fetchData()}>
          Actualizar datos
        </Button>
        <Button onClick={() => navigate('/itrs')}>
          Ver ITRs
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
