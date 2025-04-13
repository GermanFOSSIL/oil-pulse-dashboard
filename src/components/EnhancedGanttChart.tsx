
import React, { useEffect, useRef, useState } from 'react';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { format, addMonths, getYear } from 'date-fns';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GanttChartHeader } from './GanttChart/GanttChartHeader';
import { GanttLegend } from './GanttChart/GanttLegend';

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
  quantity?: number;
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
  const [exporting, setExporting] = useState(false);

  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + 1);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
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
      // Configure Gantt chart settings
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
      
      // Templates and custom styling
      gantt.templates.progress_text = function() { return ""; };
      gantt.templates.rightside_text = function(start, end, task) {
        return "<span class='gantt-task-progress-value'>" + Math.round(task.progress * 100) + "%</span>";
      };

      gantt.templates.task_class = function(start, end, task) {
        let baseClass = "";
        
        if (task.type === "project") {
          baseClass = "gantt-task-project";
        } else if (task.type === "system") {
          baseClass = "gantt-task-system";
        } else if (task.type === "subsystem") {
          baseClass = "gantt-task-subsystem";
        } else {
          if (task.status === "complete") {
            baseClass = "gantt-task-complete";
          } else if (task.status === "delayed") {
            baseClass = "gantt-task-delayed";
          } else {
            baseClass = "gantt-task-itr";
          }
        }
        
        return baseClass;
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
      
      // Localization
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
      
      // Add custom styling
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
        .gantt-task-progress-value {
          position: absolute;
          right: -40px;
          top: 0;
          background-color: rgba(255, 255, 255, 0.7);
          padding: 0 4px;
          border-radius: 2px;
          font-size: 11px;
          color: #333;
        }
        .gantt_task_content {
          padding-right: 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 11px;
          font-weight: 500;
        }
      `;
      
      // Add styles to the document
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
          quantity: item.quantity || 1,
          open: true,
          duration: Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)),
          color_class: item.type === "project" ? "gantt-task-project" : 
                      item.type === "system" ? "gantt-task-system" : 
                      item.type === "subsystem" ? "gantt-task-subsystem" : 
                      item.status === "complete" ? "gantt-task-complete" : 
                      item.status === "delayed" ? "gantt-task-delayed" : "gantt-task-itr"
        };
      });

      // Configure time scale based on selected view mode
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
      
      // Set current date and display
      try {
        gantt.showDate(currentDate);
      } catch (error) {
        console.error("Error al mostrar la fecha en el Gantt:", error);
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
      <CardHeader>
        <CardTitle>Cronograma de Proyectos</CardTitle>
        <CardDescription>
          Planificación y progreso de Test Packs e ITRs
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <GanttChartHeader
          currentDate={currentDate}
          viewMode={viewMode}
          goToPreviousMonth={goToPreviousMonth}
          goToNextMonth={goToNextMonth}
          goToToday={goToToday}
          setViewMode={setViewMode}
          exporting={exporting}
          data={data}
          containerRef={containerRef}
        />
        
        <div className="border rounded-lg mx-4">
          <div className="border-b bg-gray-50 p-2 flex justify-between items-center">
            <div className="text-sm font-medium text-gray-700">
              Año: {getYear(currentDate)}
            </div>
            <div className="text-sm font-medium text-gray-700">
              Periodo visualizado: {format(currentDate, 'dd/MM/yyyy')} - {format(addMonths(currentDate, viewMode === "day" ? 0 : viewMode === "week" ? 0.25 : 1), 'dd/MM/yyyy')}
            </div>
          </div>
          <div ref={containerRef} className="h-[500px] w-full" />
          <GanttLegend />
        </div>
      </CardContent>
    </div>
  );
};
