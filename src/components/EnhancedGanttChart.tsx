
import React, { useEffect, useRef, useState } from 'react';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar, Search } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

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
        let typeClass = "";
        
        if (task.type === "project") {
          typeClass = "gantt-task-project";
        } else if (task.type === "system") {
          typeClass = "gantt-task-system";
        } else if (task.type === "subsystem") {
          typeClass = "gantt-task-subsystem";
        } else {
          // ITRs
          if (task.status === "complete") {
            return "gantt-task-complete";
          } else if (task.status === "delayed") {
            return "gantt-task-delayed";
          } else {
            return "gantt-task-inprogress";
          }
        }
        
        return typeClass;
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
      
      // Ajustar estilos CSS personalizados
      const customStyles = `
        .gantt_task_line {
          border-radius: 4px;
        }
        .gantt-task-project {
          background-color: #a855f7;
          border-color: #9333ea;
          color: white;
          font-weight: bold;
          height: 22px !important;
          line-height: 22px !important;
          margin-top: -3px;
        }
        .gantt-task-system {
          background-color: #3b82f6;
          border-color: #2563eb;
          color: white;
          height: 18px !important;
          line-height: 18px !important;
          margin-top: -1px;
        }
        .gantt-task-subsystem {
          background-color: #0ea5e9;
          border-color: #0284c7;
          color: white;
        }
        .gantt-task-complete {
          background-color: #10b981 !important;
          border-color: #059669 !important;
        }
        .gantt-task-inprogress {
          background-color: #f59e0b !important;
          border-color: #d97706 !important;
        }
        .gantt-task-delayed {
          background-color: #ef4444 !important;
          border-color: #dc2626 !important;
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
      // Preparar los datos con el formato requerido por dhtmlxGantt
      const tasks = {
        data: data.map(item => ({
          id: item.id,
          text: item.task,
          start_date: new Date(item.start),
          end_date: new Date(item.end),
          progress: item.progress / 100, // Convert from percentage to decimal
          parent: item.parent || 0,
          type: item.type,
          status: item.status,
          open: true,
          duration: Math.ceil((new Date(item.end).getTime() - new Date(item.start).getTime()) / (24 * 60 * 60 * 1000))
        })),
        links: []
      };
      
      // Actualizar escala temporal según la vista seleccionada
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
      gantt.parse(tasks);
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
    <div className="flex flex-col space-y-4">
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
              <div className="w-3 h-3 bg-sky-500 rounded-full mr-2"></div>
              <span className="text-sm">Subsistema</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm">Completado</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
              <span className="text-sm">En curso</span>
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
