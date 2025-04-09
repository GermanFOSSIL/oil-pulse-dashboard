import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Download, Image, FileText } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Define the stats data interface for clarity
interface StatsData {
  testPacks: {
    total: number;
    completed: number;
    progress: number;
  };
  tags: {
    total: number;
    released: number;
    progress: number;
  };
  systems: { name: string; value: number }[];
  subsystems: { name: string; value: number }[];
  itrs: { name: string; value: number }[];
}

interface TestPackStatsProps {
  stats: StatsData;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const TestPackStats = ({ stats }: TestPackStatsProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const exportAsPNG = async () => {
    if (!dashboardRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        backgroundColor: "white",
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'TestPacks_Dashboard.png';
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Exportación exitosa",
        description: "Dashboard exportado como PNG correctamente.",
      });
    } catch (error) {
      console.error("Error exporting dashboard:", error);
      toast({
        title: "Error",
        description: "No se pudo exportar el dashboard. Inténtelo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPDF = async () => {
    if (!dashboardRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        backgroundColor: "white",
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
      });
      
      const imgWidth = 280;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save('TestPacks_Dashboard.pdf');
      
      toast({
        title: "Exportación exitosa",
        description: "Dashboard exportado como PDF correctamente.",
      });
    } catch (error) {
      console.error("Error exporting dashboard:", error);
      toast({
        title: "Error",
        description: "No se pudo exportar el dashboard. Inténtelo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Ensure we have valid data to display
  const validTagsData = stats.tags && typeof stats.tags.total === 'number' && typeof stats.tags.released === 'number';
  const tagsTotal = validTagsData ? stats.tags.total : 0;
  const tagsReleased = validTagsData ? stats.tags.released : 0;
  const tagsPending = tagsTotal - tagsReleased;
  
  // Prepare data for pie charts
  const tagsStatusData = [
    { name: 'Liberados', value: tagsReleased },
    { name: 'Pendientes', value: tagsPending }
  ].filter(item => item.value > 0); // Only show non-zero values

  return (
    <div className="space-y-4" ref={dashboardRef}>
      <div className="flex justify-end space-x-2 mb-4">
        <Button 
          variant="outline" 
          onClick={exportAsPNG}
          disabled={isExporting}
          className="flex items-center gap-1"
        >
          <Image className="h-4 w-4 mr-1" />
          Descargar como PNG
        </Button>
        <Button 
          variant="outline" 
          onClick={exportAsPDF}
          disabled={isExporting}
          className="flex items-center gap-1"
        >
          <FileText className="h-4 w-4 mr-1" />
          Descargar como PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Test Packs</CardTitle>
            <CardDescription>Total de paquetes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.testPacks?.total || 0}</div>
            <div className="text-muted-foreground text-sm mt-1">
              {stats.testPacks?.completed || 0} completados
            </div>
            <Progress value={stats.testPacks?.progress || 0} className="h-2 mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">TAGs</CardTitle>
            <CardDescription>Total de tags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tagsTotal}</div>
            <div className="text-muted-foreground text-sm mt-1">
              {tagsReleased} de {tagsTotal} liberados
            </div>
            <Progress value={stats.tags?.progress || 0} className="h-2 mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Sistemas</CardTitle>
            <CardDescription>Total de sistemas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.systems?.length || 0}</div>
            <div className="text-muted-foreground text-sm mt-1">
              Configurados
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">ITRs</CardTitle>
            <CardDescription>Total de ITRs vinculados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.itrs?.length || 0}</div>
            <div className="text-muted-foreground text-sm mt-1">
              Asociados a test packs
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="h-[400px]">
          <CardHeader>
            <CardTitle>Estado de TAGs</CardTitle>
            <CardDescription>Distribución de tags liberados y pendientes</CardDescription>
          </CardHeader>
          <CardContent>
            {tagsStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tagsStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {tagsStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} TAGs`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="h-[400px]">
          <CardHeader>
            <CardTitle>Distribución por Sistema</CardTitle>
            <CardDescription>Cantidad de test packs por sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.systems && stats.systems.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.systems}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.systems.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Test Packs`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestPackStats;
