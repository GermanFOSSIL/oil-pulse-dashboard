
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProgressCard } from "@/components/ui/progress-card";
import { StatCard } from "@/components/ui/stat-card";
import { EnhancedGanttChart } from "@/components/EnhancedGanttChart";
import { getProjects, getSystems, getSubsystems, getITRs, getDashboardStats } from "@/services/supabaseService";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ProjectSelector } from "@/components/ProjectSelector";
import { Calendar as CalendarIcon, Download } from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  AreaChart as RechartsAreaChart,
  Area
} from "recharts";
import { Button } from "@/components/ui/button";
import * as XLSX from 'xlsx';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [ganttData, setGanttData] = useState<any[]>([]);

  const fetchProjectData = async (projectId: string | null) => {
    setLoading(true);
    try {
      // Fetch dashboard stats
      const dashboardStats = await getDashboardStats(projectId);
      setStats(dashboardStats);

      // Fetch data for Gantt chart
      let projectsData: any[] = [];
      let systemsData: any[] = [];
      let subsystemsData: any[] = [];
      let itrsData: any[] = [];

      const projects = await getProjects();
      const allSystems = await getSystems();
      const allSubsystems = await getSubsystems();
      const allITRs = await getITRs();

      // Filter data based on selected project
      if (projectId) {
        projectsData = projects.filter(p => p.id === projectId);
        systemsData = allSystems.filter(s => s.project_id === projectId);
      } else {
        projectsData = projects;
        systemsData = allSystems;
      }
      
      // Get subsystems for the systems
      const systemIds = systemsData.map(s => s.id);
      subsystemsData = allSubsystems.filter(sub => systemIds.includes(sub.system_id));
      
      // Get ITRs for the subsystems
      const subsystemIds = subsystemsData.map(sub => sub.id);
      itrsData = allITRs.filter(itr => subsystemIds.includes(itr.subsystem_id));

      // Format Gantt data
      const ganttItems = [];
      
      // Add projects to Gantt
      for (const project of projectsData) {
        ganttItems.push({
          id: `project-${project.id}`,
          task: project.name,
          start: project.start_date || new Date().toISOString(),
          end: project.end_date || new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
          progress: project.progress || 0,
          type: 'project',
          status: project.status
        });
      }

      // Add systems to Gantt
      for (const system of systemsData) {
        const projectId = system.project_id;
        ganttItems.push({
          id: `system-${system.id}`,
          task: system.name,
          start: system.start_date || new Date().toISOString(),
          end: system.end_date || new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString(),
          progress: system.completion_rate || 0,
          parent: `project-${projectId}`,
          type: 'system',
          status: 'inprogress'
        });
      }

      // Add subsystems to Gantt
      for (const subsystem of subsystemsData) {
        const systemId = subsystem.system_id;
        ganttItems.push({
          id: `subsystem-${subsystem.id}`,
          task: subsystem.name,
          start: subsystem.start_date || new Date().toISOString(),
          end: subsystem.end_date || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
          progress: subsystem.completion_rate || 0,
          parent: `system-${systemId}`,
          type: 'subsystem',
          status: 'inprogress'
        });
      }

      // Add ITRs to Gantt
      for (const itr of itrsData) {
        const subsystemId = itr.subsystem_id;
        ganttItems.push({
          id: `itr-${itr.id}`,
          task: itr.name,
          start: itr.start_date || new Date().toISOString(),
          end: itr.end_date || new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
          progress: itr.progress || 0,
          parent: `subsystem-${subsystemId}`,
          type: 'task',
          status: itr.status
        });
      }

      setGanttData(ganttItems);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData(selectedProjectId);
  }, [selectedProjectId]);

  const handleSelectProject = (projectId: string | null) => {
    setSelectedProjectId(projectId);
  };

  const exportDashboardData = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Export KPI data
      const kpiData = [
        ['Métrica', 'Valor'],
        ['Total Proyectos', stats.totalProjects],
        ['Total Sistemas', stats.totalSystems],
        ['Total ITRs', stats.totalITRs],
        ['Tasa de Cumplimiento', `${stats.completionRate}%`]
      ];
      
      const kpiWs = XLSX.utils.aoa_to_sheet(kpiData);
      XLSX.utils.book_append_sheet(wb, kpiWs, "KPIs");
      
      // Export project data if available
      if (stats.projectsData && stats.projectsData.length > 0) {
        const projectsExportData = stats.projectsData.map((project: any) => ({
          'Proyecto': project.title,
          'Progreso': `${project.value}%`,
          'Descripción': project.description
        }));
        
        const projectsWs = XLSX.utils.json_to_sheet(projectsExportData);
        XLSX.utils.book_append_sheet(wb, projectsWs, "Proyectos");
      }
      
      // Export chart data if available
      if (stats.chartData && stats.chartData.length > 0) {
        const chartExportData = stats.chartData.map((item: any) => ({
          'Sistema': item.name,
          'Progreso': `${item.value}%`
        }));
        
        const chartWs = XLSX.utils.json_to_sheet(chartExportData);
        XLSX.utils.book_append_sheet(wb, chartWs, "Sistemas");
      }
      
      // Export activity data if available
      if (stats.areaChartData && stats.areaChartData.length > 0) {
        const activityExportData = stats.areaChartData.map((item: any) => ({
          'Mes': item.name,
          'Inspecciones': item.inspections,
          'Completados': item.completions,
          'Problemas': item.issues
        }));
        
        const activityWs = XLSX.utils.json_to_sheet(activityExportData);
        XLSX.utils.book_append_sheet(wb, activityWs, "Actividad");
      }
      
      // Export Gantt data
      const ganttExportData = ganttData.map(item => ({
        'Tarea': item.task,
        'Tipo': item.type,
        'Inicio': item.start,
        'Fin': item.end,
        'Progreso': `${item.progress}%`,
        'Estado': item.status
      }));
      
      const ganttWs = XLSX.utils.json_to_sheet(ganttExportData);
      XLSX.utils.book_append_sheet(wb, ganttWs, "Cronograma");
      
      // Generate Excel file and trigger download
      XLSX.writeFile(wb, `Dashboard_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    } catch (error) {
      console.error("Error exporting dashboard data:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Sistema de Gestión de Proyectos y Registros de Inspección
          </p>
        </div>
        <div className="flex space-x-2">
          <ProjectSelector
            onSelectProject={handleSelectProject}
            selectedProjectId={selectedProjectId}
          />
          <Button variant="outline" onClick={exportDashboardData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-gray-100" />
              <CardContent className="h-16 mt-2 bg-gray-100" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Proyectos" 
              value={stats.totalProjects} 
              description="Total de proyectos" 
            />
            <StatCard 
              title="Sistemas" 
              value={stats.totalSystems} 
              description="Total de sistemas" 
            />
            <StatCard 
              title="ITRs" 
              value={stats.totalITRs} 
              description="Total de registros" 
            />
            <StatCard 
              title="Cumplimiento" 
              value={`${stats.completionRate}%`} 
              description="Tasa promedio" 
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cronograma de ITRs</CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedGanttChart data={ganttData} />
            </CardContent>
          </Card>

          {/* Always visible sections for Sistemas and Línea de Tiempo */}
          <div className="space-y-6">
            {/* Sistemas section */}
            <Card>
              <CardHeader>
                <CardTitle>Sistemas</CardTitle>
                <CardDescription>
                  Tasas de finalización en todos los sistemas
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Línea de Tiempo section */}
            <Card>
              <CardHeader>
                <CardTitle>Línea de Tiempo</CardTitle>
                <CardDescription>
                  Fechas importantes y próximos eventos
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
                          <CalendarIcon className="mr-1 h-3 w-3" />
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
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
