import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { EnhancedGanttChart } from "@/components/EnhancedGanttChart";
import { getProjects, getSystems, getSubsystems, getITRs } from "@/services/supabaseService";
import { getDashboardStats } from "@/services/dashboardService";
import { format, addMonths, subMonths } from "date-fns";
import { BarChart3, CheckCircle2, Clock3, Tag } from "lucide-react";
import { DatabaseActivityTimeline } from "@/components/DatabaseActivityTimeline";
import { useToast } from "@/hooks/use-toast";
import { KPICard } from "@/components/DashboardWidgets/KPICard";
import { TestPacksChart } from "@/components/Dashboard/TestPacksChart";
import { MonthlyEfficiencyChart } from "@/components/Dashboard/MonthlyEfficiencyChart";
import { TagsChart } from "@/components/Dashboard/TagsChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardSkeleton } from "@/components/Dashboard/DashboardSkeleton";
import { DashboardActions } from "@/components/Dashboard/DashboardActions";
import { RemindersCard } from "@/components/Dashboard/RemindersCard";

const Dashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [ganttData, setGanttData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("general");
  
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
      
      const systemsData = dashboardStats.chartData || [];
      
      // Create default tags data if not available
      const tagsData = [
        { name: 'Liberados', value: dashboardStats.tags?.released || 0 },
        { name: 'Pendientes', value: dashboardStats.tags?.total - (dashboardStats.tags?.released || 0) || 0 }
      ];
      
      // Ensure we have monthly data, or generate mock data
      const monthlyData = dashboardStats.areaChartData || generateMonthlyMockData();
      
      setKpiChartData({
        testPacks: testPackData,
        systems: systemsData,
        tags: tagsData,
        monthlyActivity: monthlyData
      });

      // Fetch Gantt chart data
      let projectsData: any[] = [];
      let ganttSystemsData: any[] = [];
      let subsystemsData: any[] = [];
      let itrsData: any[] = [];

      const projects = await getProjects();
      const allSystems = await getSystems();
      const allSubsystems = await getSubsystems();
      const allITRs = await getITRs();

      if (projectId) {
        projectsData = projects.filter(p => p.id === projectId);
        ganttSystemsData = allSystems.filter(s => s.project_id === projectId);
      } else {
        projectsData = projects;
        ganttSystemsData = allSystems;
      }
      
      const systemIds = ganttSystemsData.map(s => s.id);
      subsystemsData = allSubsystems.filter(sub => systemIds.includes(sub.system_id));
      
      const subsystemIds = subsystemsData.map(sub => sub.id);
      itrsData = allITRs.filter(itr => subsystemIds.includes(itr.subsystem_id));

      const ganttItems = buildGanttItems(projectsData, ganttSystemsData, subsystemsData, itrsData);
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

  const buildGanttItems = useCallback((projects: any[], systems: any[], subsystems: any[], itrs: any[]) => {
    const ganttItems = [];
    
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
      <DashboardActions 
        selectedProjectId={selectedProjectId}
        onSelectProject={handleSelectProject}
        stats={stats}
        kpiChartData={kpiChartData}
        ganttData={ganttData}
        loading={loading}
      />

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div id="dashboard-content" className="space-y-6">
          <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="general">Visión General</TabsTrigger>
              <TabsTrigger value="graficos">Gráficos</TabsTrigger>
              <TabsTrigger value="planificacion">Planificación</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-6">
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
              
              <div className="grid gap-4 md:grid-cols-2">
                <DatabaseActivityTimeline />
                <RemindersCard />
              </div>
            </TabsContent>
            
            <TabsContent value="graficos" className="space-y-6">
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
            </TabsContent>
            
            <TabsContent value="planificacion" className="space-y-6">
              <Card className="overflow-hidden">
                <EnhancedGanttChart data={ganttData} />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
