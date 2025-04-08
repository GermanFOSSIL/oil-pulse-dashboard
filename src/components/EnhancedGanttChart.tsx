
import React, { useEffect, useRef, useState } from 'react';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { Button } from '@/components/ui/button';
import { Download, ChevronLeft, ChevronRight, Calendar, Search, FileText } from 'lucide-react';
import { format, addMonths, subMonths, getYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { useToast } from "@/hooks/use-toast";

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
  quantity?: number; // Nueva propiedad para la cantidad
}

interface EnhancedGanttProps {
  data: GanttItem[];
}

export const EnhancedGanttChart: React.FC<EnhancedGanttProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttChartRef = useRef<HTMLDivElement>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<string>("month");
  const [initialized, setInitialized] = useState(false);
  const todayMarkerRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => subMonths(prevDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

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
          'Cantidad': item.quantity || 1 // Exportamos la cantidad
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
        { wch: 10 }  // Ancho para la columna de cantidad
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
      if (!ganttChartRef.current) return;
      
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

  const updateTodayMarker = () => {
    if (!containerRef.current) return;
    
    if (todayMarkerRef.current) {
      todayMarkerRef.current.remove();
    }
    
    const today = new Date();
    const todayPos = gantt.posFromDate(today);
    
    if (isNaN(todayPos)) return;
    
    const line = document.createElement('div');
    line.className = 'today-line';
    line.style.left = todayPos + 'px';
    
    const taskArea = containerRef.current.querySelector('.gantt_task');
    if (taskArea) {
      taskArea.appendChild(line);
      todayMarkerRef.current = line;
    }
  };

  useEffect(() => {
    if (containerRef.current && !initialized) {
      gantt.config.date_format = "%Y-%m-%d";
      gantt.config.row_height = 30;
      gantt.config.min_column_width = 20;
      gantt.config.duration_unit = "day";
      gantt.config.duration_step = 1;
      gantt.config.scale_height = 50;
      gantt.config.subscales = [];
      gantt.config.task_height = 16;
      gantt.config.link_line_width = 2;
      gantt.config.link_arrow_size = 6;
      gantt.config.show_progress = true;
      gantt.config.fit_tasks = true;
      
      gantt.config.open_tree_initially = true;
      gantt.config.show_task_cells = true;
      gantt.config.smart_rendering = true;
      gantt.config.indent_size = 15;
      
      gantt.config.columns = [
        { name: "text", label: "Tarea", tree: true, width: 280, resize: true },
        { 
          name: "quantity", 
          label: "Cantidad", 
          align: "center", 
          width: 70, 
          resize: true, 
          template: function(task: any) {
            return task.quantity || 1;
          }
        },
        { 
          name: "progress", 
          label: "Progreso",
          align: "center", 
          width: 70,
          resize: true,
          template: function(task: any) {
            if (task.progress) {
              return Math.round(task.progress * 100) + "%";
            }
            return "";
          }
        },
        { 
          name: "status", 
          label: "Estado", 
          align: "center", 
          width: 80,
          resize: true,
          template: function(task: any) {
            if (task.status === "complete") return "Completado";
            if (task.status === "inprogress") return "En Progreso";
            if (task.status === "delayed") return "Retrasado";
            return "";
          }
        }
      ];
      
      gantt.templates.progress_text = function(start, end, task) {
        return "<span style='text-align:center;'>" + Math.round(task.progress * 100) + "% </span>";
      };

      gantt.templates.task_class = function(start, end, task) {
        if (task.type === "project") {
          return "gantt-task-project";
        } else if (task.type === "system") {
          return "gantt-task-system";
        } else if (task.type === "subsystem") {
          return "gantt-task-subsystem";
        } else {
          if (task.status === "complete") {
            return "gantt-task-complete";
          } else if (task.status === "delayed") {
            return "gantt-task-delayed";
          } else {
            return "gantt-task-itr";
          }
        }
      };
      
      gantt.templates.tooltip_text = function(start, end, task) {
        let statusText = "";
        if (task.status === "complete") statusText = "Completado";
        else if (task.status === "delayed") statusText = "Retrasado";
        else if (task.status === "inprogress") statusText = "En Progreso";
        
        let tooltipText = "<b>" + task.text + "</b><br/>";
        tooltipText += "Inicio: " + gantt.templates.tooltip_date_format(start) + "<br/>";
        tooltipText += "Fin: " + gantt.templates.tooltip_date_format(end) + "<br/>";
        tooltipText += "Progreso: " + Math.round(task.progress * 100) + "%<br/>";
        
        if (task.quantity && task.quantity > 1) {
          tooltipText += "Cantidad: " + task.quantity + "<br/>";
        }
        
        if (statusText) {
          tooltipText += "Estado: " + statusText;
        }
        
        return tooltipText;
      };
      
      gantt.i18n.setLocale({
        date: {
          month_full: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
          month_short: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
          day_full: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
          day_short: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
        },
        labels: {
          new_task: "Nueva tarea",
          section_description: "Descripción",
          section_time: "Tiempo",
          section_type: "Tipo",
          
          column_text: "Nombre de tarea",
          column_start_date: "Fecha inicio",
          column_duration: "Duración",
          column_progress: "Progreso",
          
          confirm_deleting: "¿Confirma eliminación?",
          section_priority: "Prioridad"
        }
      });
      
      const configureTimeScale = () => {
        if (viewMode === "month") {
          gantt.config.scales = [
            { unit: "month", step: 1, format: "%F %Y" },
            { unit: "day", step: 1, format: "%j" }
          ];
        } else if (viewMode === "week") {
          gantt.config.scales = [
            { unit: "week", step: 1, format: "Semana #%W" },
            { unit: "day", step: 1, format: "%j %D" }
          ];
        } else if (viewMode === "day") {
          gantt.config.scales = [
            { unit: "day", step: 1, format: "%j %D" },
            { unit: "hour", step: 2, format: "%H:00" }
          ];
        }
      };
      
      configureTimeScale();
      
      const customStyles = `
        .gantt_task_line {
          border-radius: 4px;
        }
        .gantt-task-project {
          background-color: #a855f7 !important;
          border-color: #9333ea !important;
          color: white !important;
          font-weight: bold;
          height: 22px !important;
          line-height: 22px !important;
          margin-top: -3px;
        }
        .gantt-task-system {
          background-color: #3b82f6 !important;
          border-color: #2563eb !important;
          color: white !important;
          height: 18px !important;
          line-height: 18px !important;
          margin-top: -1px;
        }
        .gantt-task-subsystem {
          background-color: #22c55e !important;
          border-color: #16a34a !important;
          color: white !important;
        }
        .gantt-task-itr {
          background-color: #f97316 !important;
          border-color: #ea580c !important;
          color: white !important;
        }
        .gantt-task-complete {
          background-color: #10b981 !important;
          border-color: #059669 !important;
          color: white !important;
        }
        .gantt-task-delayed {
          background-color: #ef4444 !important;
          border-color: #dc2626 !important;
          color: white !important;
        }
        .gantt_grid_head_cell {
          font-weight: bold;
        }
        .gantt_grid {
          background-color: #f3f4f6;
        }
        .gantt_task {
          background-color: #fff;
        }
        .gantt_task_row {
          border-bottom: 1px solid #e5e7eb;
        }
        .gantt_grid_scale, .gantt_task_scale {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        .today-line {
          position: absolute;
          top: 0;
          height: 100%;
          border-left: 2px dashed #f43f5e;
          z-index: 1;
        }
        .gantt_tree_icon.gantt_close, .gantt_tree_icon.gantt_open {
          width: 18px;
          height: 18px;
          border-radius: 3px;
          background-color: #f3f4f6;
          border: 1px solid #e5e7eb;
          font-size: 16px;
          line-height: 16px;
          text-align: center;
        }
        .gantt_grid_head_cell, .gantt_grid_data {
          padding-left: 10px;
        }
      `;
      
      const styleId = 'gantt-custom-styles';
      if (!document.getElementById(styleId)) {
        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.innerHTML = customStyles;
        document.head.appendChild(styleElement);
      }
      
      gantt.init(containerRef.current);
      setInitialized(true);
      
      gantt.attachEvent("onGanttRender", updateTodayMarker);
      
      return () => {
        gantt.clearAll();
        gantt.detachEvent("onGanttRender");
        
        if (todayMarkerRef.current) {
          todayMarkerRef.current.remove();
        }
      };
    }
  }, [initialized]);
  
  useEffect(() => {
    if (initialized && data.length > 0) {
      const processedData = data.map(item => {
        const startDate = item.start ? new Date(item.start) : new Date();
        const endDate = item.end ? new Date(item.end) : new Date(startDate);
        
        if (endDate <= startDate) {
          endDate.setDate(startDate.getDate() + 7);
        }
        
        return {
          id: item.id,
          text: item.task,
          start_date: startDate,
          end_date: endDate,
          progress: item.progress / 100,
          parent: item.parent || 0,
          type: item.type,
          status: item.status,
          quantity: item.quantity || 1, // Agregamos la cantidad
          open: true,
          duration: Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)),
          color_class: item.type === "project" ? "gantt-task-project" : 
                      item.type === "system" ? "gantt-task-system" : 
                      item.type === "subsystem" ? "gantt-task-subsystem" : 
                      item.status === "complete" ? "gantt-task-complete" : 
                      item.status === "delayed" ? "gantt-task-delayed" : "gantt-task-itr"
        };
      });

      // Configuración de escalas basada en el modo de vista seleccionado
      if (viewMode === "month") {
        gantt.config.scales = [
          { unit: "month", step: 1, format: "%F %Y" },
          { unit: "day", step: 1, format: "%j" }
        ];
      } else if (viewMode === "week") {
        gantt.config.scales = [
          { unit: "week", step: 1, format: "Semana #%W" },
          { unit: "day", step: 1, format: "%j %D" }
        ];
      } else if (viewMode === "day") {
        gantt.config.scales = [
          { unit: "day", step: 1, format: "%j %D" },
          { unit: "hour", step: 2, format: "%H:00" }
        ];
      }
      
      gantt.templates.task_class = (start, end, task) => {
        return task.color_class || "gantt-task-itr";
      };
      
      gantt.clearAll();
      gantt.parse({
        data: processedData,
        links: []
      });
      
      // Asegúrate de que showDate funcione correctamente
      try {
        gantt.showDate(currentDate);
      } catch (error) {
        console.error("Error al mostrar la fecha en el Gantt:", error);
        // Si falla, intentamos con setCurrentScale como alternativa
        try {
          gantt.setCurrentScale(viewMode === "day" ? "day" : viewMode === "week" ? "week" : "month");
        } catch (error) {
          console.error("Error al establecer la escala en el Gantt:", error);
        }
      }
      
      gantt.eachTask(function(task) {
        gantt.open(task.id);
      });
      
      gantt.render();
      setTimeout(updateTodayMarker, 100);
    }
  }, [data, currentDate, viewMode, initialized]);
  
  return (
    <div className="flex flex-col space-y-4" ref={ganttChartRef}>
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold mb-4">Cronograma de ITRs</h2>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth} className="h-9 w-9">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="font-medium h-9 px-3" onClick={goToToday}>
              <Calendar className="h-4 w-4 mr-2" />
              Hoy
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextMonth} className="h-9 w-9">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="ml-2 bg-white border rounded-md py-1 px-3 text-lg font-medium">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Vista por Mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Vista por Mes</SelectItem>
                <SelectItem value="week">Vista por Semana</SelectItem>
                <SelectItem value="day">Vista por Día</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={exportToExcel} disabled={exporting} className="h-9">
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" onClick={exportToPDF} disabled={exporting} className="h-9">
              <FileText className="h-4 w-4 mr-2" />
              {exporting ? "Exportando..." : "PDF"}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="border rounded-lg mx-4">
        {/* Timeline header with current year and date range */}
        <div className="border-b bg-gray-50 p-2 flex justify-between items-center">
          <div className="text-sm font-medium text-gray-700">
            Año: {getYear(currentDate)}
          </div>
          <div className="text-sm font-medium text-gray-700">
            Periodo visualizado: {format(currentDate, 'dd/MM/yyyy')} - {format(addMonths(currentDate, viewMode === "day" ? 0 : viewMode === "week" ? 0.25 : 1), 'dd/MM/yyyy')}
          </div>
        </div>
        <div ref={containerRef} className="h-[500px] w-full" />
        <div className="flex justify-end p-4 border-t">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <span className="text-sm">Proyecto</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm">Sistema</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm">Subsistema</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              <span className="text-sm">ITR</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-sm">Retrasado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
