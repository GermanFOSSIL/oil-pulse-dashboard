import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProgressCard } from "@/components/ui/progress-card";
import { StatCard } from "@/components/ui/stat-card";
import { EnhancedGanttChart } from "@/components/EnhancedGanttChart";
import { getProjects, getSystems, getSubsystems, getITRs } from "@/services/supabaseService";
import { getDashboardStats } from "@/services/dashboardService";
import { format, subMonths, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { ProjectSelector } from "@/components/ProjectSelector";
import { Calendar as CalendarIcon, Download, ChevronLeft, ChevronRight, Search, FileText, PieChart } from "lucide-react";
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
  PieChart as RechartsPieChart,
  Pie
} from "recharts";
import { Button } from "@/components/ui/button";
import * as XLSX from 'xlsx';
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DatabaseActivityTimeline } from "@/components/DatabaseActivityTimeline";
import { generateReport } from "@/services/reportService";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [ganttData, setGanttData] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<string>("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState<string>("");
  const ganttContainerRef = useRef<HTMLDivElement>(null);

  const fetchProjectData = async (projectId: string | null) => {
    setLoading(true);
    try {
      const dashboardStats = await getDashboardStats(projectId);
      setStats(dashboardStats);

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

      const filteredGanttItems = searchTerm 
        ? ganttItems.filter(item => item.task.toLowerCase().includes(searchTerm.toLowerCase()))
        : ganttItems;

      setGanttData(filteredGanttItems);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData(selectedProjectId);
  }, [selectedProjectId, searchTerm]);

  useEffect(() => {
    if (ganttContainerRef.current) {
      // This would be implemented to control the gantt view
      // For now we'll just use the ref to reference the container
    }
  }, [currentDate, currentView]);

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

  const exportPDFReport = async () => {
    try {
      const reportUrl = await generateReport('project_status', selectedProjectId);
      
      window.open(reportUrl, '_blank');
    } catch (error) {
      console.error("Error generating PDF report:", error);
    }
  };

  const navigateGantt = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(prevDate => 
        currentView === 'year' ? new Date(prevDate.getFullYear() - 1, prevDate.getMonth(), 1) :
        currentView === 'month' ? subMonths(prevDate, 1) :
        new Date(prevDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      );
    } else {
      setCurrentDate(prevDate => 
        currentView === 'year' ? new Date(prevDate.getFullYear() + 1, prevDate.getMonth(), 1) :
        currentView === 'month' ? addMonths(prevDate, 1) :
        new Date(prevDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      );
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

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border shadow-sm rounded-md">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm">{payload[0].value} ({payload[0].payload.percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  const projectStatusData = !loading && stats.projectsData ? [
    { name: 'Completados', value: stats.projectsData.filter((p: any) => p.variant === 'success').length, fill: '#22c55e', percentage: Math.round(stats.projectsData.filter((p: any) => p.variant === 'success').length / stats.totalProjects * 100) || 0 },
    { name: 'En Progreso', value: stats.projectsData.filter((p: any) => p.variant === 'warning').length, fill: '#f59e0b', percentage: Math.round(stats.projectsData.filter((p: any) => p.variant === 'warning').length / stats.totalProjects * 100) || 0 },
    { name: 'Retrasados', value: stats.projectsData.filter((p: any) => p.variant === 'danger').length, fill: '#ef4444', percentage: Math.round(stats.projectsData.filter((p: any) => p.variant === 'danger').length / stats.totalProjects * 100) || 0 },
  ] : [];

  const itrStatusData = !loading && stats.summary ? [
    { name: 'Completados', value: stats.summary.completedITRs || 0, fill: '#22c55e', percentage: Math.round(((stats.summary.completedITRs || 0) / (stats.totalITRs || 1)) * 100) },
    { name: 'En Progreso', value: stats.summary.inProgressITRs || 0, fill: '#f59e0b', percentage: Math.round(((stats.summary.inProgressITRs || 0) / (stats.totalITRs || 1)) * 100) },
    { name: 'Retrasados', value: stats.summary.delayedITRs || 0, fill: '#ef4444', percentage: Math.round(((stats.summary.delayedITRs || 0) / (stats.totalITRs || 1)) * 100) },
  ] : [];

  const displayPeriod = () => {
    if (currentView === 'year') {
      return currentDate.getFullYear().toString();
    } else if (currentView === 'month') {
      return format(currentDate, 'MMMM yyyy', { locale: es });
    } else {
      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + 6);
      return `${format(currentDate, 'd MMM', { locale: es })} - ${format(endDate, 'd MMM yyyy', { locale: es })}`;
    }
  };

  const calculateDateRange = () => {
    const today = new Date();
    
    if (currentView === 'year') {
      return {
        start: `${currentDate.getFullYear()}/01/01`,
        end: `${currentDate.getFullYear()}/12/31`
      };
    } else if (currentView === 'month') {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      return {
        start: format(monthStart, 'yyyy/MM/dd'),
        end: format(monthEnd, 'yyyy/MM/dd')
      };
    } else {
      const weekStart = currentDate;
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return {
        start: format(weekStart, 'yyyy/MM/dd'),
        end: format(weekEnd, 'yyyy/MM/dd')
      };
    }
  };

  // Modificar la función renderActiveShape para evitar el error TypeScript
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  
    return (
      <g>
        <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="#333">
          {payload.name}
        </text>
        <text x={cx} y={cy} textAnchor="middle" fill="#333">
          {value}
        </text>
        <text x={cx} y={cy} dy={20} textAnchor="middle" fill="#999">
          {`${(percent * 100).toFixed(0)}%`}
        </text>
        <Pie
          activeIndex={0}
          activeShape={(props) => renderActiveShape(props)}
          data={[{ name: payload.name, value }]}
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          dataKey="value"
        />
      </g>
    );
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
            Exportar Excel
          </Button>
          <Button variant="outline" onClick={exportPDFReport}>
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
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

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Estado de Proyectos</CardTitle>
                <CardDescription>Distribución de proyectos por estado</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={projectStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                      >
                        {projectStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado de ITRs</CardTitle>
                <CardDescription>Distribución de ITRs por estado</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={itrStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                      >
                        {itrStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Cronograma de ITRs</CardTitle>
                <CardDescription>Filtrado por: {displayPeriod()}</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Input 
                  placeholder="Buscar..." 
                  className="w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  prefix={<Search className="h-4 w-4 text-muted-foreground" />}
                />
                <Select 
                  value={currentView} 
                  onValueChange={(value) => setCurrentView(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Vista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Semana</SelectItem>
                    <SelectItem value="month">Mes</SelectItem>
                    <SelectItem value="year">Año</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-1">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => navigateGantt('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => navigateGantt('next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent ref={ganttContainerRef}>
              <EnhancedGanttChart 
                data={ganttData} 
                startDate={calculateDateRange().start}
                endDate={calculateDateRange().end}
                viewMode={currentView}
              />
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
                            position="right" 
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

          <DatabaseActivityTimeline />
        </>
      )}
    </div>
  );
};

export default Dashboard;
