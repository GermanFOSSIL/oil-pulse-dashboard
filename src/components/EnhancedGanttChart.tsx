
import React, { useEffect, useRef, useState } from 'react';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { Button } from '@/components/ui/button';
import { Download, ChevronLeft, ChevronRight, Calendar, Search, FileText } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
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

  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => subMonths(prevDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Function to export Gantt data to Excel
  const exportToExcel = () => {
    try {
      // Format data for export
      const exportData = data.map(item => {
        return {
          'Tarea': item.task,
          'Tipo': item.type || 'No definido',
          'Inicio': item.start,
          'Fin': item.end,
          'Progreso (%)': item.progress,
          'Estado': item.status || 'No definido'
        };
      });
      
      // Create workbook and add the data
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const colWidths = [
        { wch: 30 }, // Tarea
        { wch: 15 }, // Tipo
        { wch: 15 }, // Inicio
        { wch: 15 }, // Fin
        { wch: 15 }, // Progreso
        { wch: 15 }, // Estado
      ];
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, "Cronograma");
      
      // Generate Excel file and trigger download
      XLSX.writeFile(wb, `Cronograma_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    } catch (error) {
      console.error("Error exporting data to Excel:", error);
    }
  };

  // Function to export Gantt chart as PDF
  const exportToPDF = async () => {
    try {
      if (!ganttChartRef.current) return;

      // Create new landscape A3 PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3'
      });

      // Get the gantt chart container
      const ganttContainer = ganttChartRef.current;
      
      // Use html2canvas to capture the Gantt chart
      const canvas = await html2canvas(ganttContainer, {
        scale: 2, // Higher scale for better quality
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Add title to PDF
      pdf.setFontSize(16);
      pdf.text('Cronograma de ITRs', 20, 15);
      pdf.setFontSize(10);
      pdf.text(`Fecha de exportación: ${format(new Date(), 'dd/MM/yyyy')}`, 20, 22);
      
      // Calculate dimensions to fit the page while maintaining aspect ratio
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = Math.min(pdfWidth / imgWidth, (pdfHeight - 30) / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30; // Start after the title
      
      // Add the image to the PDF
      pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Save the PDF
      pdf.save(`Cronograma_ITRs_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
    }
  };

  // Function to add today marker
  const updateTodayMarker = () => {
    if (!containerRef.current) return;
    
    // Remove existing marker if any
    if (todayMarkerRef.current) {
      todayMarkerRef.current.remove();
    }
    
    const today = new Date();
    const todayPos = gantt.posFromDate(today);
    
    if (isNaN(todayPos)) return; // Skip if position is not valid
    
    const line = document.createElement('div');
    line.className = 'today-line';
    line.style.left = todayPos + 'px';
    
    // Get the task area to append the marker
    const taskArea = containerRef.current.querySelector('.gantt_task');
    if (taskArea) {
      taskArea.appendChild(line);
      todayMarkerRef.current = line;
    }
  };

  useEffect(() => {
    if (containerRef.current && !initialized) {
      // Configuraciones generales
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
      
      // Habilitar soporte para tareas con estructura jerárquica
      gantt.config.open_tree_initially = true;
      gantt.config.show_task_cells = true;
      gantt.config.smart_rendering = true;
      gantt.config.indent_size = 15;
      
      // Columnas para la tabla lateral
      gantt.config.columns = [
        { name: "text", label: "Tarea", tree: true, width: 280, resize: true },
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
      
      // Personalizar la leyenda
      gantt.templates.progress_text = function(start, end, task) {
        return "<span style='text-align:center;'>" + Math.round(task.progress * 100) + "% </span>";
      };

      // Personalizar apariencia de las barras según el tipo y estado
      gantt.templates.task_class = function(start, end, task) {
        // First check the type
        if (task.type === "project") {
          return "gantt-task-project";
        } else if (task.type === "system") {
          return "gantt-task-system";
        } else if (task.type === "subsystem") {
          return "gantt-task-subsystem";
        } else {
          // For ITRs, check status
          if (task.status === "complete") {
            return "gantt-task-complete";
          } else if (task.status === "delayed") {
            return "gantt-task-delayed";
          } else {
            return "gantt-task-itr"; // ITRs normales
          }
        }
      };
      
      // Personalizar tooltip
      gantt.templates.tooltip_text = function(start, end, task) {
        let statusText = "";
        if (task.status === "complete") statusText = "Completado";
        else if (task.status === "delayed") statusText = "Retrasado";
        else if (task.status === "inprogress") statusText = "En Progreso";
        
        let tooltipText = "<b>" + task.text + "</b><br/>";
        tooltipText += "Inicio: " + gantt.templates.tooltip_date_format(start) + "<br/>";
        tooltipText += "Fin: " + gantt.templates.tooltip_date_format(end) + "<br/>";
        tooltipText += "Progreso: " + Math.round(task.progress * 100) + "%<br/>";
        
        if (statusText) {
          tooltipText += "Estado: " + statusText;
        }
        
        return tooltipText;
      };
      
      // Establecer idioma español
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
          
          /* grid columns */
          column_text: "Nombre de tarea",
          column_start_date: "Fecha inicio",
          column_duration: "Duración",
          column_progress: "Progreso",
          
          /* Other labels */
          confirm_deleting: "¿Confirma eliminación?",
          section_priority: "Prioridad"
        }
      });
      
      // Configurar la escala de tiempo según la vista
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
      
      // Estilos CSS personalizados con colores actualizados
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
      
      const styleElement = document.createElement('style');
      styleElement.innerHTML = customStyles;
      document.head.appendChild(styleElement);
      
      // Inicializar gantt
      gantt.init(containerRef.current);
      setInitialized(true);
      
      // Register event listener for rendering complete to add today marker
      gantt.attachEvent("onGanttRender", updateTodayMarker);
      
      return () => {
        // Limpiar
        styleElement.remove();
        gantt.clearAll();
        
        // Detach event listeners
        gantt.detachEvent("onGanttRender");
        
        // Remove today marker if exists
        if (todayMarkerRef.current) {
          todayMarkerRef.current.remove();
        }
      };
    }
  }, [initialized]);
  
  // Actualizar los datos cuando cambian o al cambiar la fecha/vista
  useEffect(() => {
    if (initialized && data.length > 0) {
      // Ensure all dates are valid
      const processedData = data.map(item => {
        // Create valid dates or default to now() for start and one week later for end
        const startDate = item.start ? new Date(item.start) : new Date();
        const endDate = item.end ? new Date(item.end) : new Date(startDate);
        
        // If end date is before or same as start date, set it to one week later
        if (endDate <= startDate) {
          endDate.setDate(startDate.getDate() + 7);
        }
        
        return {
          id: item.id,
          text: item.task,
          start_date: startDate,
          end_date: endDate,
          progress: item.progress / 100, // Convert from percentage to decimal
          parent: item.parent || 0,
          type: item.type,
          status: item.status,
          open: true,
          duration: Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
        };
      });

      // Configurar escala temporal según la vista seleccionada
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
      
      // Cargar datos y mostrar fecha actual
      gantt.clearAll();
      gantt.parse({
        data: processedData,
        links: []
      });
      gantt.showDate(currentDate);
      
      // Expandir todos los nodos
      gantt.eachTask(function(task) {
        gantt.open(task.id);
      });
      
      // Ajustar la vista completa si es necesario
      gantt.render();
      
      // Update today marker after data is loaded
      setTimeout(updateTodayMarker, 100);
    }
  }, [data, currentDate, viewMode, initialized]);
  
  return (
    <div className="flex flex-col space-y-4" ref={ganttChartRef}>
      <div className="flex justify-between items-center px-4 pt-2">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="font-medium" onClick={goToToday}>
            <Calendar className="h-4 w-4 mr-2" />
            Hoy
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-medium ml-2">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Vista por Mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Vista por Mes</SelectItem>
              <SelectItem value="week">Vista por Semana</SelectItem>
              <SelectItem value="day">Vista por Día</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={exportToPDF}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>
      
      <div className="border rounded-lg mx-4">
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
