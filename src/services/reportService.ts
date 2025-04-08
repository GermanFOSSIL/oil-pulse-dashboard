
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const translateStatus = (status: string): string => {
  switch (status) {
    case 'complete':
      return 'Completado';
    case 'inprogress':
      return 'En Progreso';
    case 'delayed':
      return 'Retrasado';
    default:
      return status;
  }
};

export const generateReport = async (reportType: string, projectId: string | null = null): Promise<string> => {
  try {
    console.log(`Generando reporte ${reportType} para el proyecto ${projectId || 'todos'}`);
    
    let reportData: any = {};
    let reportTitle = "Reporte General";
    let fileName = `reporte_${Date.now()}.pdf`;
    
    let projectInfo = null;
    if (projectId) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (projectError) {
        console.error("Error al obtener información del proyecto:", projectError);
      } else {
        projectInfo = project;
        reportTitle = `Reporte: ${project.name}`;
        fileName = `reporte_${project.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.pdf`;
      }
    }
    
    switch (reportType) {
      case 'project_status': {
        let systemsQuery = supabase.from('systems').select('*');
        if (projectId) {
          systemsQuery = systemsQuery.eq('project_id', projectId);
        }
        const { data: systems, error: systemsError } = await systemsQuery;
        
        if (systemsError) {
          throw systemsError;
        }
        
        let subsystemsQuery = supabase.from('subsystems').select('id');
        if (systems.length > 0) {
          subsystemsQuery = subsystemsQuery.in('system_id', systems.map(s => s.id));
        }
        const { data: subsystems, error: subsystemsError } = await subsystemsQuery;
        
        if (subsystemsError) {
          throw subsystemsError;
        }
        
        let itrsQuery = supabase.from('itrs').select('*');
        if (subsystems.length > 0) {
          itrsQuery = itrsQuery.in('subsystem_id', subsystems.map(s => s.id));
        }
        const { data: itrs, error: itrsError } = await itrsQuery;
        
        if (itrsError) {
          throw itrsError;
        }
        
        reportData = {
          project: projectInfo,
          systems: systems || [],
          itrs: itrs || [],
          summary: {
            totalSystems: systems?.length || 0,
            totalITRs: itrs?.length || 0,
            completedITRs: itrs?.filter(itr => itr.status === 'complete').length || 0,
            inProgressITRs: itrs?.filter(itr => itr.status === 'inprogress').length || 0,
            delayedITRs: itrs?.filter(itr => itr.status === 'delayed').length || 0,
          }
        };
        
        break;
      }
      
      case 'itrs': {
        let itrsQuery = supabase.from('itrs').select('*, subsystems(name, system_id, systems:system_id(name, project_id, projects:project_id(name)))');
        
        if (projectId) {
          const { data: systems } = await supabase
            .from('systems')
            .select('id')
            .eq('project_id', projectId);
          
          if (systems && systems.length > 0) {
            const systemIds = systems.map(s => s.id);
            
            const { data: subsystems } = await supabase
              .from('subsystems')
              .select('id')
              .in('system_id', systemIds);
            
            if (subsystems && subsystems.length > 0) {
              const subsystemIds = subsystems.map(s => s.id);
              itrsQuery = itrsQuery.in('subsystem_id', subsystemIds);
            } else {
              reportData = { itrs: [] };
              break;
            }
          } else {
            reportData = { itrs: [] };
            break;
          }
        }
        
        const { data: itrs, error: itrsError } = await itrsQuery;
        
        if (itrsError) {
          throw itrsError;
        }
        
        reportData = {
          project: projectInfo,
          itrs: itrs || [],
          summary: {
            totalITRs: itrs?.length || 0,
            completedITRs: itrs?.filter(itr => itr.status === 'complete').length || 0,
            inProgressITRs: itrs?.filter(itr => itr.status === 'inprogress').length || 0,
            delayedITRs: itrs?.filter(itr => itr.status === 'delayed').length || 0,
          }
        };
        
        break;
      }
      
      case 'tasks': {
        let tasksQuery = supabase.from('tasks').select('*, subsystems(name, system_id, systems:system_id(name, project_id, projects:project_id(name)))');
        
        if (projectId) {
          const { data: systems } = await supabase
            .from('systems')
            .select('id')
            .eq('project_id', projectId);
          
          if (systems && systems.length > 0) {
            const systemIds = systems.map(s => s.id);
            
            const { data: subsystems } = await supabase
              .from('subsystems')
              .select('id')
              .in('system_id', systemIds);
            
            if (subsystems && subsystems.length > 0) {
              const subsystemIds = subsystems.map(s => s.id);
              tasksQuery = tasksQuery.in('subsystem_id', subsystemIds);
            } else {
              reportData = { tasks: [] };
              break;
            }
          } else {
            reportData = { tasks: [] };
            break;
          }
        }
        
        const { data: tasks, error: tasksError } = await tasksQuery;
        
        if (tasksError) {
          throw tasksError;
        }
        
        reportData = {
          project: projectInfo,
          tasks: tasks || [],
          summary: {
            totalTasks: tasks?.length || 0,
            completedTasks: tasks?.filter(task => task.status === 'complete').length || 0,
            inProgressTasks: tasks?.filter(task => task.status === 'inprogress').length || 0,
            pendingTasks: tasks?.filter(task => task.status === 'pending').length || 0,
          }
        };
        
        break;
      }
    }
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(18);
    doc.text(reportTitle, pageWidth / 2, 20, { align: 'center' });
    
    const currentDate = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.setFontSize(10);
    doc.text(`Fecha: ${currentDate}`, pageWidth / 2, 28, { align: 'center' });
    
    if (projectInfo) {
      doc.setFontSize(12);
      doc.text('Información del Proyecto', 14, 40);
      
      doc.setFontSize(10);
      doc.text(`Nombre: ${projectInfo.name}`, 20, 48);
      doc.text(`Ubicación: ${projectInfo.location || 'No especificada'}`, 20, 54);
      doc.text(`Estado: ${translateStatus(projectInfo.status)}`, 20, 60);
      doc.text(`Progreso: ${projectInfo.progress || 0}%`, 20, 66);
      
      if (projectInfo.start_date) {
        doc.text(`Fecha de inicio: ${new Date(projectInfo.start_date).toLocaleDateString('es-ES')}`, 20, 72);
      }
      
      if (projectInfo.end_date) {
        doc.text(`Fecha de finalización: ${new Date(projectInfo.end_date).toLocaleDateString('es-ES')}`, 20, 78);
      }
    }
    
    let yPos = projectInfo ? 90 : 40;
    
    if (reportType === 'project_status') {
      if (reportData.systems && reportData.systems.length > 0) {
        doc.setFontSize(12);
        doc.text('Sistemas', 14, yPos);
        yPos += 10;
        
        const systemsData = reportData.systems.map((system: any) => [
          system.name,
          `${system.completion_rate || 0}%`,
          system.start_date ? new Date(system.start_date).toLocaleDateString('es-ES') : '-',
          system.end_date ? new Date(system.end_date).toLocaleDateString('es-ES') : '-'
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['Nombre', 'Avance', 'Fecha Inicio', 'Fecha Fin']],
          body: systemsData,
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }
      
      doc.setFontSize(12);
      doc.text('Resumen de ITRs', 14, yPos);
      yPos += 10;
      
      const summaryData = [
        ['Total ITRs', reportData.summary.totalITRs.toString()],
        ['Completados', reportData.summary.completedITRs.toString()],
        ['En Progreso', reportData.summary.inProgressITRs.toString()],
        ['Retrasados', reportData.summary.delayedITRs.toString()]
      ];
      
      autoTable(doc, {
        startY: yPos,
        head: [['Estado', 'Cantidad']],
        body: summaryData,
      });
    } else if (reportType === 'itrs') {
      doc.setFontSize(12);
      doc.text('Registros de Inspección (ITRs)', 14, yPos);
      yPos += 10;
      
      if (reportData.itrs && reportData.itrs.length > 0) {
        const itrsData = reportData.itrs.map((itr: any) => {
          const subsystem = itr.subsystems;
          const system = subsystem?.systems;
          
          return [
            itr.name,
            subsystem?.name || '-',
            system?.name || '-',
            translateStatus(itr.status),
            `${itr.progress || 0}%`,
            itr.assigned_to || '-',
            itr.start_date ? new Date(itr.start_date).toLocaleDateString('es-ES') : '-',
            itr.end_date ? new Date(itr.end_date).toLocaleDateString('es-ES') : '-'
          ];
        });
        
        autoTable(doc, {
          startY: yPos,
          head: [['ITR', 'Subsistema', 'Sistema', 'Estado', 'Progreso', 'Asignado a', 'Fecha Inicio', 'Fecha Fin']],
          body: itrsData,
          styles: { overflow: 'ellipsize', cellWidth: 'wrap' },
          columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 30 }, 2: { cellWidth: 30 } }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.setFontSize(10);
        doc.text('No hay ITRs disponibles para este proyecto', 20, yPos);
        yPos += 10;
      }
      
      doc.setFontSize(12);
      doc.text('Resumen', 14, yPos);
      yPos += 10;
      
      const summaryData = [
        ['Total ITRs', reportData.summary.totalITRs.toString()],
        ['Completados', reportData.summary.completedITRs.toString()],
        ['En Progreso', reportData.summary.inProgressITRs.toString()],
        ['Retrasados', reportData.summary.delayedITRs.toString()]
      ];
      
      autoTable(doc, {
        startY: yPos,
        head: [['Estado', 'Cantidad']],
        body: summaryData,
      });
    } else if (reportType === 'tasks') {
      doc.setFontSize(12);
      doc.text('Tareas', 14, yPos);
      yPos += 10;
      
      if (reportData.tasks && reportData.tasks.length > 0) {
        const tasksData = reportData.tasks.map((task: any) => {
          const subsystem = task.subsystems;
          const system = subsystem?.systems;
          
          return [
            task.name,
            subsystem?.name || '-',
            system?.name || '-',
            translateStatus(task.status),
            task.description || '-'
          ];
        });
        
        autoTable(doc, {
          startY: yPos,
          head: [['Tarea', 'Subsistema', 'Sistema', 'Estado', 'Descripción']],
          body: tasksData,
          styles: { overflow: 'ellipsize', cellWidth: 'wrap' },
          columnStyles: { 0: { cellWidth: 30 }, 4: { cellWidth: 50 } }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.setFontSize(10);
        doc.text('No hay tareas disponibles para este proyecto', 20, yPos);
        yPos += 10;
      }
      
      doc.setFontSize(12);
      doc.text('Resumen', 14, yPos);
      yPos += 10;
      
      const summaryData = [
        ['Total Tareas', reportData.summary.totalTasks.toString()],
        ['Completadas', reportData.summary.completedTasks.toString()],
        ['En Progreso', reportData.summary.inProgressTasks.toString()],
        ['Pendientes', reportData.summary.pendingTasks.toString()]
      ];
      
      autoTable(doc, {
        startY: yPos,
        head: [['Estado', 'Cantidad']],
        body: summaryData,
      });
    }
    
    doc.save(fileName);
    return fileName;
  } catch (error) {
    console.error("Error al generar reporte:", error);
    throw error;
  }
};
