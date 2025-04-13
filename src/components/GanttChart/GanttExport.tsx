
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { useToast } from "@/hooks/use-toast";
import { useState } from 'react';

interface GanttExportProps {
  data: any[];
  containerRef: React.RefObject<HTMLDivElement>;
}

export const GanttExport = ({ data, containerRef }: GanttExportProps) => {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const exportToExcel = () => {
    try {
      const exportData = data.map(item => {
        return {
          'Tarea': item.task,
          'Tipo': item.type || 'No definido',
          'Inicio': item.start,
          'Fin': item.end,
          'Progreso (%)': item.progress,
          'Estado': item.status || 'No definido',
          'Cantidad': item.quantity || 1
        };
      });
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      const colWidths = [
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 }
      ];
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, "Cronograma");
      
      XLSX.writeFile(wb, `Cronograma_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      
      toast({
        title: "Exportación exitosa",
        description: "El archivo Excel ha sido generado correctamente"
      });
    } catch (error) {
      console.error("Error exporting data to Excel:", error);
      toast({
        title: "Error de exportación",
        description: "No se pudo exportar a Excel. Inténtelo de nuevo.",
        variant: "destructive"
      });
    }
  };

  const exportToPDF = async () => {
    try {
      if (!containerRef.current) return;
      
      setExporting(true);
      toast({
        title: "Exportando a PDF",
        description: "Generando PDF de alta resolución. Esto puede tardar unos segundos..."
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3'
      });

      const ganttContainer = containerRef.current;
      if (!ganttContainer) {
        setExporting(false);
        return;
      }
      
      const canvas = await html2canvas(ganttContainer, {
        scale: 3,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      pdf.setProperties({
        title: 'Cronograma de ITRs',
        subject: 'Cronograma detallado del proyecto',
        author: 'Sistema de Gestión de Proyectos',
        keywords: 'cronograma, ITR, gantt',
        creator: 'Sistema de Gestión'
      });
      
      pdf.setFontSize(18);
      pdf.text('Cronograma de ITRs', 20, 15);
      pdf.setFontSize(12);
      pdf.text(`Fecha de exportación: ${format(new Date(), 'dd/MM/yyyy')}`, 20, 22);
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = Math.min(pdfWidth / imgWidth, (pdfHeight - 30) / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;
      
      pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      pdf.save(`Cronograma_ITRs_${format(new Date(), 'yyyyMMdd')}.pdf`);
      
      setExporting(false);
      toast({
        title: "PDF generado correctamente",
        description: "El cronograma ha sido exportado con éxito en alta resolución"
      });
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      setExporting(false);
      toast({
        title: "Error al exportar",
        description: "No se pudo generar el PDF. Inténtelo de nuevo.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={exportToExcel} disabled={exporting} className="h-9">
        <Download className="h-4 w-4 mr-2" />
        Excel
      </Button>
      <Button variant="outline" onClick={exportToPDF} disabled={exporting} className="h-9">
        <FileText className="h-4 w-4 mr-2" />
        {exporting ? "Exportando..." : "PDF"}
      </Button>
    </div>
  );
};
