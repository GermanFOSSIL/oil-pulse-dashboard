
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

interface GanttProps {
  data: {
    id: string;
    task: string;
    start: string;
    end: string;
    progress: number;
    dependencies?: string;
  }[];
}

export const GanttChart: React.FC<GanttProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<string>("month");

  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => subMonths(prevDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  useEffect(() => {
    if (containerRef.current) {
      // Configuración del idioma español
      gantt.i18n.setLocale('es');
      
      // Configuraciones personalizadas
      gantt.config.date_format = "%Y-%m-%d %H:%i";
      gantt.config.scale_height = 50;
      gantt.config.row_height = 30;
      gantt.config.show_progress = true;
      gantt.config.fit_tasks = true;
      gantt.config.columns = [
        { name: "text", label: "Tarea", tree: true, width: 200 },
        { 
          name: "progress", 
          label: "Progreso", 
          align: "center", 
          width: 80,
          template: function(obj: any) {
            return Math.round(obj.progress * 100) + "%";
          }
        }
      ];

      // Definir traducciones completas para solucionar el error de tipos
      gantt.locale.labels = {
        new_task: "Nueva tarea",
        icon_save: "Guardar",
        icon_cancel: "Cancelar",
        icon_details: "Detalles",
        icon_edit: "Editar",
        icon_delete: "Eliminar",
        confirm_closing: "Sus cambios se perderán, ¿está seguro?",
        confirm_deleting: "La tarea será eliminada permanentemente, ¿está seguro?",
        section_description: "Descripción",
        section_time: "Período",
        section_type: "Tipo",
        
        /* grid columns */
        column_text: "Nombre de tarea",
        column_start_date: "Inicio",
        column_duration: "Duración",
        column_add: "",
        
        /* Propiedades adicionales */
        section_deadline: "Fecha límite",
        section_baselines: "Líneas base",
        column_wbs: "EDT",
        link: "Enlace",
        section_priority: "Prioridad",
        section_progress: "Progreso",
        section_milestone: "Hito",
        section_start_date: "Fecha de inicio",
        section_end_date: "Fecha de fin",
        section_color: "Color",
        section_parent: "Tarea padre",
        section_constraints: "Restricciones",
        section_resources: "Recursos",
        confirm_link_deleting: "¿Desea eliminar este enlace?",
        link_start: "(inicio)",
        link_end: "(fin)",
        type_task: "Tarea",
        type_project: "Proyecto",
        type_milestone: "Hito",
        minutes: "Minutos",
        hours: "Horas",
        days: "Días",
        weeks: "Semanas",
        months: "Meses",
        years: "Años",
        column_planned_start: "Inicio planeado",
        column_planned_end: "Fin planeado",
        column_planned_duration: "Duración planeada",
        column_progress: "Progreso",
        column_priority: "Prioridad",
        column_planned: "Planeado",
        column_predecessor: "Predecesor",
        column_successor: "Sucesor",
        column_slack: "Holgura",
        column_constraint_type: "Tipo de restricción",
        column_constraint_date: "Fecha de restricción",
        
        // Propiedades faltantes
        message_ok: "OK",
        message_cancel: "Cancelar",
        section_constraint: "Restricción",
        constraint_type: "Tipo de restricción",
        constraint_date: "Fecha de restricción",
        section_constraint_type: "Tipo de restricción",
        section_constraint_date: "Fecha de restricción",
        section_custom_fields: "Campos personalizados",
        section_dynamicforms: "Formularios dinámicos",
        section_resources_filter: "Filtro de recursos",
        section_details: "Detalles",
        section_wbs: "EDT",
        
        // Propiedades adicionales faltantes según el error
        asap: "Lo antes posible",
        alap: "Lo más tarde posible",
        snet: "Fecha de inicio lo antes posible",
        snlt: "Fecha de inicio lo más tarde posible",
        fnlt: "Fecha de fin lo más tarde posible",
        fnet: "Fecha de fin lo antes posible",
        target_start: "Inicio objetivo",
        target_end: "Fin objetivo",
        task_time: "Tiempo de tarea",
        task_baseline: "Línea base",
        scheduling_mode: "Modo de planificación",
        
        // Propiedades adicionales faltantes según el nuevo error
        mso: "Debe comenzar en",
        mfo: "Debe finalizar en",
        resources_filter_placeholder: "Escriba para filtrar",
        resources_filter_label: "Ocultar no asignados"
      };

      // Traducción del resto de elementos
      gantt.locale.date = {
        month_full: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
        month_short: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
        day_full: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
        day_short: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
      };

      // Personalizar apariencia similar a la imagen de referencia
      gantt.templates.task_class = function(start, end, task) {
        switch (task.status) {
          case "completed":
            return "gantt-task-completed";
          case "overdue":
            return "gantt-task-overdue";
          case "in-progress":
          default:
            return "gantt-task-in-progress";
        }
      };
      
      // Función para configurar la escala de tiempo según el modo de visualización
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
            { unit: "hour", step: 1, format: "%H:00" }
          ];
        }
      };
      
      configureTimeScale();

      // Personalizar la leyenda
      gantt.templates.progress_text = function(start, end, task) {
        return "<span style='text-align:center;'>" + Math.round(task.progress * 100) + "% </span>";
      };

      // Inicializar gantt
      gantt.init(containerRef.current);

      // Establecer fecha actual
      gantt.showDate(currentDate);

      // Ajustar estilos CSS personalizados para que coincida con la imagen de referencia
      const customStyles = `
        .gantt_task_line {
          border-radius: 20px;
        }
        .gantt-task-completed {
          background-color: #10b981 !important;
        }
        .gantt-task-in-progress {
          background-color: #f59e0b !important;
        }
        .gantt-task-overdue {
          background-color: #ef4444 !important;
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
      `;
      
      const styleElement = document.createElement('style');
      styleElement.innerHTML = customStyles;
      document.head.appendChild(styleElement);

      // Preparar los datos con formato específico
      const tasks = {
        data: data.map(item => {
          // Determinar el estado de la tarea para asignar el color
          let status = "in-progress";
          if (item.progress === 100) {
            status = "completed";
          } else if (new Date(item.end) < new Date()) {
            status = "overdue";
          }
          
          return {
            id: item.id,
            text: item.task,
            start_date: new Date(item.start),
            end_date: new Date(item.end),
            progress: item.progress / 100,
            status: status,
            parent: 0
          };
        }),
        links: data
          .filter(item => item.dependencies)
          .map(item => {
            const dependencies = item.dependencies?.split(',') || [];
            return dependencies.map(dep => ({
              id: `${dep}_${item.id}`,
              source: dep,
              target: item.id,
              type: "0"
            }));
          })
          .flat()
      };

      // Cargar datos en el gantt
      gantt.parse(tasks);
      
      // Refrescar cuando cambie la fecha
      gantt.showDate(currentDate);
      
      return () => {
        // Limpiar estilos personalizados
        styleElement.remove();
        gantt.clearAll();
      };
    }
  }, [data, currentDate, viewMode]);

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center">
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
      
      <div className="border rounded-lg">
        <div ref={containerRef} className="h-[500px] w-full" />
        <div className="flex justify-end p-4 border-t">
          <div className="flex items-center space-x-4">
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
              <span className="text-sm">Vencido</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
              <span className="text-sm">Actividad</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
