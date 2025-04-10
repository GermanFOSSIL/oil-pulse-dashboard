
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPICard } from "@/components/DashboardWidgets/KPICard";
import { EnhancedGanttChart } from "@/components/EnhancedGanttChart";
import { ProjectSelector } from "@/components/ProjectSelector";
import { MonthlyEfficiencyChart } from "@/components/Dashboard/MonthlyEfficiencyChart";
import { TestPacksChart } from "@/components/Dashboard/TestPacksChart";
import { TagsChart } from "@/components/Dashboard/TagsChart";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getDashboardStats, getDashboardChartsData } from "@/services/dashboardService";

const Dashboard = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [testPacksData, setTestPacksData] = useState<any[]>([]);
  const [tagsData, setTagsData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const dashboardStats = await getDashboardStats(selectedProjectId);
        setStats(dashboardStats);
        
        // Fetch chart data
        const chartsData = await getDashboardChartsData(selectedProjectId);
        
        if (chartsData) {
          // Set monthly efficiency data
          setMonthlyData(chartsData.monthlyData || []);
          
          // Set test packs chart data
          let testPacksSystemData = chartsData.systemsData || [];
          setTestPacksData(testPacksSystemData);
          
          // Set tags data
          let tagsChartData = chartsData.tagsData || [];
          setTagsData(tagsChartData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [selectedProjectId]);

  const handleExportPDF = async () => {
    const dashboardElement = document.getElementById("dashboard-content");
    if (!dashboardElement) return;

    try {
      const canvas = await html2canvas(dashboardElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      
      pdf.addImage(imgData, 'JPEG', imgX, 10, imgWidth * ratio, imgHeight * ratio);
      pdf.save('dashboard-report.pdf');
    } catch (error) {
      console.error("Error exporting PDF:", error);
    }
  };

  const handleExportExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Add Dashboard Summary Sheet
      if (stats) {
        const summaryData = [
          ['Metric', 'Value'],
          ['Total Projects', stats.totalProjects],
          ['Completed Projects', stats.completedProjects],
          ['In Progress Projects', stats.inProgressProjects],
          ['Delayed Projects', stats.delayedProjects],
          ['Total Systems', stats.totalSystems],
          ['Total ITRs', stats.totalITRs],
          ['Completed ITRs', stats.completedITRs],
          ['Overall Completion Rate', `${stats.completionRate}%`],
        ];
        
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Dashboard Summary');
      }
      
      // Add Monthly Data Sheet
      if (monthlyData && monthlyData.length > 0) {
        const monthlySheet = XLSX.utils.json_to_sheet(monthlyData);
        XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Data');
      }
      
      // Add Systems Data Sheet
      if (testPacksData && testPacksData.length > 0) {
        const systemsSheet = XLSX.utils.json_to_sheet(testPacksData);
        XLSX.utils.book_append_sheet(workbook, systemsSheet, 'Systems Data');
      }
      
      XLSX.writeFile(workbook, 'dashboard-data.xlsx');
    } catch (error) {
      console.error("Error exporting Excel:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <ProjectSelector onSelectProject={setSelectedProjectId} selectedProjectId={selectedProjectId} />
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" /> Excel
          </Button>
        </div>
      </div>

      <div id="dashboard-content">
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Visión General</TabsTrigger>
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
            <TabsTrigger value="planning">Planificación</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {!isLoading && stats ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <KPICard 
                    title="Proyectos Totales" 
                    value={stats.totalProjects} 
                    description="Proyectos en la plataforma" 
                    className="bg-blue-50"
                  />
                  <KPICard 
                    title="Sistemas" 
                    value={stats.totalSystems} 
                    description="Sistemas registrados" 
                    className="bg-purple-50" 
                  />
                  <KPICard 
                    title="ITRs Totales" 
                    value={stats.totalITRs} 
                    description="Formularios de inspección" 
                    className="bg-green-50" 
                  />
                  <KPICard 
                    title="Tasa de Completado" 
                    value={`${stats.completionRate}%`} 
                    description="Promedio general" 
                    className="bg-amber-50" 
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="col-span-1">
                    <CardHeader className="pb-2">
                      <CardTitle>Estado de Proyectos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>Completados</span>
                          <span className="font-semibold">{stats.completedProjects}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>En Progreso</span>
                          <span className="font-semibold">{stats.inProgressProjects}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Retrasados</span>
                          <span className="font-semibold">{stats.delayedProjects}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="col-span-1">
                    <CardHeader className="pb-2">
                      <CardTitle>ITRs por Estado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>Completados</span>
                          <span className="font-semibold">{stats.completedITRs}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>En Progreso</span>
                          <span className="font-semibold">{stats.inProgressITRs}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Pendientes</span>
                          <span className="font-semibold">{stats.pendingITRs}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="col-span-1">
                    <CardHeader className="pb-2">
                      <CardTitle>Distribución de Sistemas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {stats.topSystems && stats.topSystems.map((system: any, index: number) => (
                          <div key={index} className="flex justify-between items-center">
                            <span>{system.name}</span>
                            <span className="font-semibold">{system.count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              // Loading state
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-md"></div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="charts" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <MonthlyEfficiencyChart 
                data={monthlyData} 
                className="col-span-1 md:col-span-2"
                onExport={handleExportPDF}
              />
              <TestPacksChart 
                data={testPacksData} 
                className="col-span-1" 
                onExport={handleExportExcel}
              />
              <TagsChart 
                data={tagsData} 
                className="col-span-1" 
              />
            </div>
          </TabsContent>

          <TabsContent value="planning" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cronograma de Proyectos</CardTitle>
              </CardHeader>
              <CardContent>
                {!isLoading && stats?.ganttData ? (
                  <EnhancedGanttChart 
                    tasks={stats.ganttData} 
                    height={500} 
                  />
                ) : (
                  <div className="h-[500px] bg-gray-200 animate-pulse rounded-md"></div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
