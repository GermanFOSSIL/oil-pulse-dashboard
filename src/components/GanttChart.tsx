
import React, { useEffect, useRef } from 'react';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

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

  useEffect(() => {
    if (containerRef.current) {
      // Configuración del idioma español
      gantt.i18n.setLocale('es');
      
      // Configuraciones personalizadas
      gantt.config.date_format = "%Y-%m-%d %H:%i";
      gantt.config.scale_height = 50;
      gantt.config.row_height = 30;
      gantt.config.columns = [
        { name: "text", label: "Tarea", tree: true, width: '*' },
        { name: "start_date", label: "Inicio", align: "center", width: 100 },
        { name: "duration", label: "Duración", align: "center", width: 80 },
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
        
        /* Añadiendo las propiedades faltantes que causaban el error */
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
        
        // Añadiendo propiedades faltantes según el error
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
        section_wbs: "EDT"
      };

      // Traducción del resto de elementos
      gantt.locale.date = {
        month_full: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
        month_short: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
        day_full: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
        day_short: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
      };

      // Configurar la escala de tiempo
      gantt.config.scales = [
        { unit: "month", step: 1, format: "%F, %Y" },
        { unit: "week", step: 1, format: "Semana #%W" },
        { unit: "day", step: 1, format: "%j %D" }
      ];

      // Inicializar gantt
      gantt.init(containerRef.current);

      // Preparar los datos
      const tasks = {
        data: data.map(item => ({
          id: item.id,
          text: item.task,
          start_date: new Date(item.start),
          end_date: new Date(item.end),
          progress: item.progress / 100,
          parent: 0
        })),
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
    }

    return () => {
      gantt.clearAll();
    };
  }, [data]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}></div>
  );
};
