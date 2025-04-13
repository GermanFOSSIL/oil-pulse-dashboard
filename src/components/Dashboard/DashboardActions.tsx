
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProjectSelector } from "@/components/ProjectSelector";
import { Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface DashboardActionsProps {
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  stats: any;
  kpiChartData: any;
  ganttData: any[];
  loading: boolean;
}

export const DashboardActions = ({
  selectedProjectId,
  onSelectProject,
  stats,
  kpiChartData,
  ganttData,
  loading
}: DashboardActionsProps) => {
  const { toast } = useToast();
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  const exportDashboardData = async () => {
    setExportLoading('excel');
    try {
      const wb = XLSX.utils.book_new();
      
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
  };

  const exportDashboardAsPdf = async () => {
    setExportLoading('pdf');
    try {
      const dashboardElement = document.getElementById('dashboard-content');
      if (!dashboardElement) {
        throw new Error('No se pudo encontrar el contenido del dashboard');
      }
      
      const canvas = await html2canvas(dashboardElement, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      pdf.setFontSize(18);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Dashboard Fossil Energies', 105, 15, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 22, { align: 'center' });
      
      if (selectedProjectId) {
        const projectName = stats.projectName || 'Proyecto seleccionado';
        pdf.text(`Proyecto: ${projectName}`, 105, 29, { align: 'center' });
      }
      
      let heightLeft = imgHeight;
      let position = 35;
      
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - position);
      
      while (heightLeft > 0) {
        position = 0;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -pageHeight + position + imgHeight, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
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
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Sistema de Gestión de Proyectos y Test Packs
        </p>
      </div>
      <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
        <ProjectSelector
          onSelectProject={onSelectProject}
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
  );
};
