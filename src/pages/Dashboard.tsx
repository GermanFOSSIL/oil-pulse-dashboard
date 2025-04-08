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
  Area,
  Cell,
  LabelList,
  PieChart,
  Pie,
  Sector
} from "recharts";
import { Button } from "@/components/ui/button";
import * as XLSX from 'xlsx';
import { DatabaseActivityTimeline } from "@/components/DatabaseActivityTimeline";
import { ChartContainer } from "@/components/ui/chart";

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${value}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const KPIPieChart = ({ data, title, color }: { data: any[], title: string, color: string }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={60}
          fill={color}
          dataKey="value"
          onMouseEnter={onPieEnter}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [ganttData, setGanttData] = useState<any[]>([]);
  const [kpiChartData, setKpiChartData] = useState({
    projects: [] as any[],
    systems: [] as any[],
    itrs: [] as any[],
    completion: [] as any[]
  });

  const fetchProjectData = async (projectId: string | null) => {
    setLoading(true);
    try {
      const dashboardStats = await getDashboardStats(projectId);
      setStats(dashboardStats);

      setKpiChartData({
        projects: [
          { name: 'Completados', value: dashboardStats.completedProjects || 0 },
          { name: 'En Progreso', value: dashboardStats.inProgressProjects || 0 },
          { name: 'Retrasados', value: dashboardStats.delayedProjects || 0 }
        ],
        systems: [
          { name: 'Sistemas', value: dashboardStats.totalSystems || 0 }
        ],
        itrs: [
          { name: 'Completados', value: dashboardStats.completedITRs || 0 },
          { name: 'En Progreso', value: dashboardStats.inProgressITRs || 0 },
          { name: 'Retrasados', value: dashboardStats.delayedITRs || 0 }
        ],
        completion: [
          { name: 'Completado', value: dashboardStats.completionRate || 0 },
          { name: 'Pendiente', value: 100 - (dashboardStats.completionRate || 0) }
        ]
      });

      let projectsData: any[] = [];
      let systemsData: any[] = [];
      let subsystemsData: any[] = [];
      let itrsData: any[] = [];

      const projects = await getProjects();
      const allSystems = await getSystems();
      const allSubsystems = await getSubsystems();
      const allITRs = await getITRs();

      if (projectId) {
        projectsData = projects.filter(p => p.id === projectId);
        systemsData = allSystems.filter(s => s.project_id === projectId);
      } else {
        projectsData = projects;
        systemsData = allSystems;
      }
      
      const systemIds = systemsData.map(s => s.id);
      subsystemsData = allSubsystems.filter(sub => systemIds.includes(sub.system_id));
      
      const subsystemIds = subsystemsData.map(sub => sub.id);
      itrsData = allITRs.filter(itr => subsystemIds.includes(itr.subsystem_id));

      const ganttItems = [];
      
      for (const project of projectsData) {
        ganttItems.push({
          id: `project-${project.id}`,
          task: project.name,
          start: project.start_date || new Date().toISOString(),
          end: project.end_date || new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
          progress: project.progress || 0,
          type: 'project',
          status: project.status,
          quantity: 1
        });
      }

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
          status: 'inprogress',
          quantity: 1
        });
      }

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
          status: 'inprogress',
          quantity: 1
        });
      }

      const itrGroups: Record<string, {
        count: number,
        progress: number,
        subsystemId: string,
        start: string,
        end: string,
        status: string
      }> = {};
      
      itrsData.forEach(itr => {
        const key = `${itr.name}-${itr.subsystem_id}`;
        
        if (!itrGroups[key]) {
          itrGroups[key] = {
            count: 0,
            progress: 0,
            subsystemId: itr.subsystem_id,
            start: itr.start_date || new Date().toISOString(),
            end: itr.end_date || new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
            status: itr.status
          };
        }
        
        itrGroups[key].count += 1;
        itrGroups[key].progress += itr.progress || 0;
      });
      
      Object.entries(itrGroups).forEach(([key, group], index) => {
        const itrName = key.split('-')[0];
        const avgProgress = group.count > 0 ? Math.round(group.progress / group.count) : 0;
        
        ganttItems.push({
          id: `itr-group-${index}`,
          task: itrName,
          start: group.start,
          end: group.end,
          progress: avgProgress,
          parent: `subsystem-${group.subsystemId}`,
          type: 'task',
          status: group.status,
          quantity: group.count
        });
      });

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
      const wb = XLSX.utils.book_new();
      
      const kpiData = [
        ['Métrica', 'Valor'],
        ['Total Proyectos', stats.totalProjects],
        ['Total Sistemas', stats.totalSystems],
        ['Total ITRs', stats.totalITRs],
        ['Tasa de Cumplimiento', `${stats.completionRate}%`]
      ];
      
      const kpiWs = XLSX.utils.aoa_to_sheet(kpiData);
      XLSX.utils.book_append_sheet(wb, kpiWs, "KPIs");
      
      if (stats.projectsData && stats.projectsData.length > 0) {
        const projectsExportData = stats.projectsData.map((project: any) => ({
          'Proyecto': project.title,
          'Progreso': `${project.value}%`,
          'Descripción': project.description
        }));
        
        const projectsWs = XLSX.utils.json_to_sheet(projectsExportData);
        XLSX.utils.book_append_sheet(wb, projectsWs, "Proyectos");
      }
      
      if (stats.chartData && stats.chartData.length > 0) {
        const chartExportData = stats.chartData.map((item: any) => ({
          'Sistema': item.name,
          'Progreso': `${item.value}%`,
          'ITRs Completados': item.completedITRs,
          'Total ITRs': item.totalITRs
        }));
        
        const chartWs = XLSX.utils.json_to_sheet(chartExportData);
        XLSX.utils.book_append_sheet(wb, chartWs, "Sistemas");
      }
      
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
      
      const ganttExportData = ganttData.map(item => ({
        'Tarea': item.task,
        'Tipo': item.type,
        'Inicio': item.start,
        'Fin': item.end,
        'Progreso': `${item.progress}%`,
        'Estado': item.status,
        'Cantidad': item.quantity || 1
      }));
      
      const ganttWs = XLSX.utils.json_to_sheet(ganttExportData);
      XLSX.utils.book_append_sheet(wb, ganttWs, "Cronograma");
      
      XLSX.writeFile(wb, `Dashboard_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    } catch (error) {
      console.error("Error exporting dashboard data:", error);
    }
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border shadow-sm rounded-md">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">Progreso: {data.value}%</p>
          <p className="text-sm">ITRs Completados: {data.completedITRs || 0}/{data.totalITRs || 0}</p>
        </div>
      );
    }
    return null;
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
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Proyectos</CardTitle>
                <CardDescription>Total: {stats.totalProjects}</CardDescription>
              </CardHeader>
              <CardContent>
                <KPIPieChart 
                  data={kpiChartData.projects} 
                  title="Proyectos"
                  color="#9b87f5"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Sistemas</CardTitle>
                <CardDescription>Total: {stats.totalSystems}</CardDescription>
              </CardHeader>
              <CardContent>
                <KPIPieChart 
                  data={kpiChartData.systems} 
                  title="Sistemas"
                  color="#0EA5E9"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>ITRs</CardTitle>
                <CardDescription>Total: {stats.totalITRs}</CardDescription>
              </CardHeader>
              <CardContent>
                <KPIPieChart 
                  data={kpiChartData.itrs} 
                  title="ITRs"
                  color="#F97316"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Cumplimiento</CardTitle>
                <CardDescription>Tasa: {stats.completionRate}%</CardDescription>
              </CardHeader>
              <CardContent>
                <KPIPieChart 
                  data={kpiChartData.completion} 
                  title="Cumplimiento"
                  color="#8B5CF6"
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cronograma de ITRs</CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedGanttChart data={ganttData} />
            </CardContent>
          </Card>

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
                      Completitud de ITRs por sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.chartData}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                        <YAxis stroke="#888888" fontSize={12} />
                        <Tooltip content={<CustomBarTooltip />} />
                        <Bar
                          dataKey="value"
                          name="Progreso"
                          radius={[4, 4, 0, 0]}
                        >
                          {stats.chartData && stats.chartData.map((entry: any, index: number) => (
                            <Cell 
                              key={`cell-${index}`}
                              fill="#3b82f6"
                            />
                          ))}
                          <LabelList 
                            dataKey="value" 
                            position="top" 
                            formatter={(value: any) => `${value}%`} 
                          />
                        </Bar>
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

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <DatabaseActivityTimeline />
            
            <Card>
              <CardHeader>
                <CardTitle>Próximos Eventos</CardTitle>
                <CardDescription>
                  Fechas importantes a tener en cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 h-full w-px bg-muted"></div>
                  
                  {[
                    {
                      date: new Date(new Date().setDate(new Date().getDate() + 7)),
                      title: "Revisión del Sistema de Control",
                      description: "Verificación de todos los sistemas de control automatizado, 5 días de trabajo.",
                      responsible: "Ing. Eléctrico"
                    },
                    {
                      date: new Date(new Date().setDate(new Date().getDate() + 14)),
                      title: "Pruebas de Integración",
                      description: "Integración de sistemas eléctricos y mecánicos, 7 días de trabajo.",
                      responsible: "Jefe de Proyecto"
                    },
                    {
                      date: new Date(new Date().setDate(new Date().getDate() + 21)),
                      title: "Validación Final de Seguridad",
                      description: "Validación de todos los sistemas de seguridad, 4 días de trabajo.",
                      responsible: "Ing. de Seguridad"
                    }
                  ].map((event, index) => (
                    <div key={index} className="mb-8 grid last:mb-0">
                      <div className="flex items-start">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-muted bg-background z-10 mr-4">
                          <span className="flex h-2 w-2 rounded-full bg-primary"></span>
                        </div>
                        <div className="text-sm mr-4">
                          {`${event.date.getDate()}/${event.date.getMonth() + 1}`}
                        </div>
                        <div className="flex-1 rounded-lg border p-4">
                          <h3 className="font-semibold tracking-tight">{event.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                          <div className="mt-2 flex items-center text-xs text-muted-foreground">
                            <CalendarIcon className="mr-1 h-3 w-3" />
                            <span>Responsable: {event.responsible}</span>
                          </div>
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
