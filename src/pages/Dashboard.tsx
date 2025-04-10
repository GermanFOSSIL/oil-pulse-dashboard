
import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EnhancedGanttChart } from "@/components/EnhancedGanttChart";
import { getProjects, getSystems, getSubsystems, getITRs, getDashboardStats } from "@/services/supabaseService";
import { format, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { ProjectSelector } from "@/components/ProjectSelector";
import { 
  CalendarIcon, 
  Download, 
  FileText, 
  BarChart3, 
  CheckCircle2, 
  Clock3, 
  AlertTriangle,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { DatabaseActivityTimeline } from "@/components/DatabaseActivityTimeline";
import { useToast } from "@/hooks/use-toast";
import { KPICard } from "@/components/DashboardWidgets/KPICard";
import { TestPacksChart } from "@/components/Dashboard/TestPacksChart";
import { MonthlyEfficiencyChart } from "@/components/Dashboard/MonthlyEfficiencyChart";
import { TagsChart } from "@/components/Dashboard/TagsChart";
import { StatsData } from "@/services/types";

// Dashboard skeleton loader
const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="bg-gray-100 h-16"></CardHeader>
          <CardContent>
            <div className="h-10 bg-gray-100 rounded-md mb-2"></div>
            <div className="h-4 bg-gray-100 rounded-md w-3/4"></div>
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="lg:col-span-2 overflow-hidden">
        <CardHeader className="bg-gray-100 h-12"></CardHeader>
        <CardContent className="p-0">
          <div className="h-80 bg-gray-100"></div>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader className="bg-gray-100 h-12"></CardHeader>
        <CardContent className="p-0">
          <div className="h-80 bg-gray-100"></div>
        </CardContent>
      </Card>
    </div>
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-100 h-12"></CardHeader>
      <CardContent className="p-0">
        <div className="h-96 bg-gray-100"></div>
      </CardContent>
    </Card>
  </div>
);

const Dashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [ganttData, setGanttData] = useState<any[]>([]);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  
  // KPI data for charts
  const [kpiChartData, setKpiChartData] = useState({
    testPacks: [] as any[],
    systems: [] as any[],
    tags: [] as any[],
    monthlyActivity: [] as any[]
  });

  const fetchProjectData = useCallback(async (projectId: string | null) => {
    setLoading(true);
    try {
      const dashboardStats = await getDashboardStats(projectId);
      setStats(dashboardStats);

      // Prepare KPI chart data
      const testPackData = [
        { name: 'Completados', value: dashboardStats.completedProjects || 0 },
        { name: 'En Progreso', value: dashboardStats.inProgressProjects || 0 },
        { name: 'Retrasados', value: dashboardStats.delayedProjects || 0 }
      ];
      
      const systemData = dashboardStats.chartData || [];
      
      const tagsData = dashboardStats.tags ? [
        { name: 'Liberados', value: dashboardStats.tags.released || 0 },
        { name: 'Pendientes', value: dashboardStats.tags.total - (dashboardStats.tags.released || 0) || 0 }
      ] : [];
      
      // Ensure we have monthly data, or generate mock data
      const monthlyData = dashboardStats.areaChartData || generateMonthlyMockData();
      
      setKpiChartData({
        testPacks: testPackData,
        systems: systemData,
        tags: tagsData,
        monthlyActivity: monthlyData
      });

      // Fetch Gantt chart data
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

      // Build Gantt chart data structure
      const ganttItems = buildGanttItems(projectsData, systemsData, subsystemsData, itrsData);
      setGanttData(ganttItems);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del dashboard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Generate mock monthly data if needed
  const generateMonthlyMockData = useCallback(() => {
    const currentDate = new Date();
    const monthlyData = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(currentDate, i);
      const monthName = format(date, 'MMM', { locale: es });
      
      monthlyData.push({
        name: monthName,
        inspections: Math.floor(Math.random() * 50) + 30,
        completions: Math.floor(Math.random() * 40) + 20,
        issues: Math.floor(Math.random() * 10) + 5
      });
    }
    
    return monthlyData;
  }, []);

  // Build Gantt chart data items
  const buildGanttItems = useCallback((projects: any[], systems: any[], subsystems: any[], itrs: any[]) => {
    const ganttItems = [];
    
    // Add projects
    for (const project of projects) {
      ganttItems.push({
        id: `project-${project.id}`,
        task: project.name,
        start: project.start_date || new Date().toISOString(),
        end: project.end_date || addMonths(new Date(), 3).toISOString(),
        progress: project.progress || 0,
        type: 'project',
        status: project.status,
        quantity: 1
      });
    }

    // Add systems
    for (const system of systems) {
      const projectId = system.project_id;
      ganttItems.push({
        id: `system-${system.id}`,
        task: system.name,
        start: system.start_date || new Date().toISOString(),
        end: system.end_date || addMonths(new Date(), 2).toISOString(),
        progress: system.completion_rate || 0,
        parent: `project-${projectId}`,
        type: 'system',
        status: 'inprogress',
        quantity: 1
      });
    }

    // Add subsystems
    for (const subsystem of subsystems) {
      const systemId = subsystem.system_id;
      ganttItems.push({
        id: `subsystem-${subsystem.id}`,
        task: subsystem.name,
        start: subsystem.start_date || new Date().toISOString(),
        end: subsystem.end_date || addMonths(new Date(), 1).toISOString(),
        progress: subsystem.completion_rate || 0,
        parent: `system-${systemId}`,
        type: 'subsystem',
        status: 'inprogress',
        quantity: 1
      });
    }

    // Group ITRs by name and subsystem
    const itrGroups: Record<string, {
      count: number,
      progress: number,
      subsystemId: string,
      start: string,
      end: string,
      status: string
    }> = {};
    
    itrs.forEach(itr => {
      const key = `${itr.name}-${itr.subsystem_id}`;
      
      if (!itrGroups[key]) {
        itrGroups[key] = {
          count: 0,
          progress: 0,
          subsystemId: itr.subsystem_id,
          start: itr.start_date || new Date().toISOString(),
          end: itr.end_date || addMonths(new Date(), 0.5).toISOString(),
          status: itr.status
        };
      }
      
      itrGroups[key].count += 1;
      itrGroups[key].progress += itr.progress || 0;
    });
    
    // Add ITR groups to Gantt
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

    return ganttItems;
  }, []);

  useEffect(() => {
    fetchProjectData(selectedProjectId);
  }, [selectedProjectId, fetchProjectData]);

  const handleSelectProject = (projectId: string | null) => {
    setSelectedProjectId(projectId);
  };

  // Export dashboard data to Excel
  const exportDashboardData = useCallback(async () => {
    setExportLoading('excel');
    try {
      const wb = XLSX.utils.book_new();
      
      // KPI Summary sheet
      const kpiData = [
        ['Métrica', 'Valor'],
        ['Total Test Packs', stats.testPacks?.total || 0],
        ['Test Packs Completados', stats.testPacks?.completed || 0],
        ['Progreso Test Packs', `${stats.testPacks?.progress || 0}%`],
        ['Total Tags', stats.tags?.total || 0],
        ['Tags Liberados', stats.tags?.released || 0],
        ['Progreso Tags', `${stats.tags?.progress || 0}%`]
      ];
      
      const kpiWs = XLSX.utils.aoa_to_sheet(kpiData);
      XLSX.utils.book_append_sheet(wb, kpiWs, "Resumen");
      
      // Systems data
      if (kpiChartData.systems && kpiChartData.systems.length > 0) {
        const systemsExportData = kpiChartData.systems.map((system: any) => ({
          'Sistema': system.name,
          'Test Packs': system.value,
          'Progreso': `${system.progress || 0}%`,
          'Tags Liberados': system.completedITRs || 0,
          'Total Tags': system.totalITRs || 0,
        }));
        
        const systemsWs = XLSX.utils.json_to_sheet(systemsExportData);
        XLSX.utils.book_append_sheet(wb, systemsWs, "Sistemas");
      }
      
      // Monthly activity data
      if (kpiChartData.monthlyActivity && kpiChartData.monthlyActivity.length > 0) {
        const activityExportData = kpiChartData.monthlyActivity.map((item: any) => ({
          'Mes': item.name,
          'Inspecciones': item.inspections || 0,
          'Completados': item.completions || 0,
          'Problemas': item.issues || 0
        }));
        
        const activityWs = XLSX.utils.json_to_sheet(activityExportData);
        XLSX.utils.book_append_sheet(wb, activityWs, "Actividad Mensual");
      }
      
      // Gantt data
      if (ganttData && ganttData.length > 0) {
        const ganttExportData = ganttData.map(item => ({
          'Tarea': item.task,
          'Tipo': item.type,
          'Inicio': format(new Date(item.start), 'dd/MM/yyyy'),
          'Fin': format(new Date(item.end), 'dd/MM/yyyy'),
          'Progreso': `${item.progress}%`,
          'Estado': item.status,
          'Cantidad': item.quantity || 1
        }));
        
        const ganttWs = XLSX.utils.json_to_sheet(ganttExportData);
        XLSX.utils.book_append_sheet(wb, ganttWs, "Cronograma");
      }
      
      // Generate file name with current date
      const fileName = `Dashboard_FossilEnergies_${format(new Date(), 'yyyyMMdd')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: "Exportación completada",
        description: `Los datos se han exportado exitosamente a ${fileName}`,
      });
    } catch (error) {
      console.error("Error exporting dashboard data:", error);
      toast({
        title: "Error",
        description: "No se pudieron exportar los datos del dashboard",
        variant: "destructive",
      });
    } finally {
      setExportLoading(null);
    }
  }, [stats, kpiChartData, ganttData, toast]);

  // Export dashboard as PDF
  const exportDashboardAsPdf = useCallback(async () => {
    setExportLoading('pdf');
    try {
      // Target the dashboard content container
      const dashboardElement = document.getElementById('dashboard-content');
      if (!dashboardElement) {
        throw new Error('No se pudo encontrar el contenido del dashboard');
      }
      
      // Capture the dashboard as an image
      const canvas = await html2canvas(dashboardElement, {
        scale: 1.5, // Higher scale for better quality
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // Calculate dimensions to fit in A4 page
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add header
      pdf.setFontSize(18);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Dashboard Fossil Energies', 105, 15, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 22, { align: 'center' });
      
      // Add project filter if selected
      if (selectedProjectId) {
        const projectName = stats.projectName || 'Proyecto seleccionado';
        pdf.text(`Proyecto: ${projectName}`, 105, 29, { align: 'center' });
      }
      
      // Add image
      let heightLeft = imgHeight;
      let position = 35; // Start after header
      
      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - position);
      
      // Add new pages if content is longer than one page
      while (heightLeft > 0) {
        position = 0;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -pageHeight + position + imgHeight, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Generate file name with current date
      const fileName = `Dashboard_FossilEnergies_${format(new Date(), 'yyyyMMdd')}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "Exportación completada",
        description: `El dashboard se ha exportado exitosamente como ${fileName}`,
      });
    } catch (error) {
      console.error("Error exporting dashboard as PDF:", error);
      toast({
        title: "Error",
        description: "No se pudo exportar el dashboard como PDF",
        variant: "destructive",
      });
    } finally {
      setExportLoading(null);
    }
  }, [selectedProjectId, stats, toast]);

  // Compute KPI stats
  const kpiStats = useMemo(() => {
    return {
      testPacks: {
        total: stats.testPacks?.total || 0,
        completed: stats.testPacks?.completed || 0,
        progress: stats.testPacks?.progress || 0
      },
      tags: {
        total: stats.tags?.total || 0,
        released: stats.tags?.released || 0,
        progress: stats.tags?.progress || 0
      },
      systems: stats.totalSystems || 0,
      itrs: {
        completed: stats.completedITRs || 0,
        inProgress: stats.inProgressITRs || 0,
        delayed: stats.delayedITRs || 0,
        total: stats.totalITRs || 0
      }
    };
  }, [stats]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Sistema de Gestión de Proyectos y Test Packs
          </p>
        </div>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
          <ProjectSelector
            onSelectProject={handleSelectProject}
            selectedProjectId={selectedProjectId}
          />
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={exportDashboardData}
              disabled={!!exportLoading || loading}
              className="w-full sm:w-auto"
            >
              {exportLoading === 'excel' ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Exportando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Excel
                </span>
              )}
            </Button>
            <Button 
              variant="default" 
              onClick={exportDashboardAsPdf}
              disabled={!!exportLoading || loading}
              className="w-full sm:w-auto"
            >
              {exportLoading === 'pdf' ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Exportando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  PDF
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div id="dashboard-content" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Test Packs"
              value={kpiStats.testPacks.total}
              description={`${kpiStats.testPacks.completed} completados (${kpiStats.testPacks.progress}%)`}
              icon={<BarChart3 className="h-4 w-4" />}
              className="border-l-4 border-l-primary"
            />
            
            <KPICard
              title="Tags"
              value={kpiStats.tags.total}
              description={`${kpiStats.tags.released} liberados (${kpiStats.tags.progress}%)`}
              icon={<Tag className="h-4 w-4" />}
              className="border-l-4 border-l-orange-500"
            />
            
            <KPICard
              title="Completados"
              value={kpiStats.itrs.completed}
              description={`de ${kpiStats.itrs.total} ITRs totales`}
              icon={<CheckCircle2 className="h-4 w-4" />}
              className="border-l-4 border-l-green-500"
            />
            
            <KPICard
              title="Pendientes"
              value={kpiStats.itrs.inProgress + kpiStats.itrs.delayed}
              description={`${kpiStats.itrs.delayed} con retraso`}
              icon={<Clock3 className="h-4 w-4" />}
              className="border-l-4 border-l-red-500"
            />
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <TestPacksChart 
              data={kpiChartData.systems} 
              className="lg:col-span-2"
            />
            
            <TagsChart 
              data={kpiChartData.tags} 
            />
          </div>
          
          <MonthlyEfficiencyChart 
            data={kpiChartData.monthlyActivity} 
          />

          {/* Gantt Chart */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Cronograma de ITRs</CardTitle>
              <CardDescription>
                Planificación y progreso de Test Packs e ITRs
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <EnhancedGanttChart data={ganttData} />
            </CardContent>
          </Card>

          {/* Database Activity */}
          <div className="grid gap-4 md:grid-cols-2">
            <DatabaseActivityTimeline />
            
            <Card>
              <CardHeader>
                <CardTitle>Recordatorios</CardTitle>
                <CardDescription>
                  Actividades pendientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 h-full w-px bg-muted"></div>
                  
                  {[
                    {
                      date: addMonths(new Date(), 0.25),
                      title: "Verificación de Tags pendientes",
                      description: "Revisar Tags pendientes de liberación del sistema eléctrico",
                      priority: "high"
                    },
                    {
                      date: addMonths(new Date(), 0.5),
                      title: "Reporte mensual de avance",
                      description: "Preparar reporte mensual de avance para cliente",
                      priority: "medium"
                    },
                    {
                      date: addMonths(new Date(), 0.75),
                      title: "Revisión de sistema mecánico",
                      description: "Completar inspección de sistema mecánico",
                      priority: "low"
                    }
                  ].map((event, index) => {
                    let priorityColor = "bg-blue-500";
                    if (event.priority === "high") priorityColor = "bg-red-500";
                    if (event.priority === "medium") priorityColor = "bg-orange-500";
                    
                    return (
                      <div key={index} className="mb-8 grid last:mb-0">
                        <div className="flex items-start">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full border border-muted bg-background z-10 mr-4`}>
                            <span className={`flex h-2 w-2 rounded-full ${priorityColor}`}></span>
                          </div>
                          <div className="text-sm mr-4">
                            {`${format(event.date, 'dd/MM')}`}
                          </div>
                          <div className="flex-1 rounded-lg border p-4">
                            <h3 className="font-semibold tracking-tight">{event.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                            <div className="mt-2 flex items-center text-xs text-muted-foreground">
                              <CalendarIcon className="mr-1 h-3 w-3" />
                              <span>
                                {format(event.date, 'dd MMM yyyy', { locale: es })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
