
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getDashboardStats } from "@/services/dashboardService";

const translateStatus = (status: string): string => {
  switch (status) {
    case 'complete': return 'Completado';
    case 'inprogress': return 'En Progreso';
    case 'delayed': return 'Retrasado';
    default: return status;
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
    
    const dashboardStats = await getDashboardStats(projectId);
    
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
          summary: dashboardStats.summary,
          kpiData: {
            totalProjects: dashboardStats.totalProjects,
            totalSystems: dashboardStats.totalSystems,
            totalITRs: dashboardStats.totalITRs,
            completionRate: dashboardStats.completionRate
          }
        };
        
        break;
      }
      
      case 'itrs': {
        let itrsQuery = supabase.from('itrs').select('*, subsystems(name, system_id, systems:system_id(name, project_id, projects:project_id(name)))')
        
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
          summary: dashboardStats.summary,
          kpiData: {
            totalProjects: dashboardStats.totalProjects,
            totalSystems: dashboardStats.totalSystems,
            totalITRs: dashboardStats.totalITRs,
            completionRate: dashboardStats.completionRate
          }
        };
        
        break;
      }
      
      case 'tasks': {
        let tasksQuery = supabase.from('tasks').select('*, subsystems(name, system_id, systems:system_id(name, project_id, projects:project_id(name)))')
        
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
          summary: dashboardStats.summary,
          kpiData: {
            totalProjects: dashboardStats.totalProjects,
            totalSystems: dashboardStats.totalSystems,
            totalITRs: dashboardStats.totalITRs,
            completionRate: dashboardStats.completionRate
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
    
    doc.setFontSize(14);
    doc.text('Indicadores Clave de Rendimiento (KPIs)', 14, 40);
    
    doc.setFontSize(10);
    doc.text(`Total de Proyectos: ${reportData.kpiData.totalProjects}`, 20, 50);
    doc.text(`Total de Sistemas: ${reportData.kpiData.totalSystems}`, 20, 56);
    doc.text(`Total de ITRs: ${reportData.kpiData.totalITRs}`, 20, 62);
    doc.text(`Tasa de Cumplimiento: ${reportData.kpiData.completionRate}%`, 20, 68);
    
    if (reportData.summary) {
      doc.text(`ITRs Completados: ${reportData.summary.completedITRs || 0}`, 120, 50);
      doc.text(`ITRs En Progreso: ${reportData.summary.inProgressITRs || 0}`, 120, 56);
      doc.text(`ITRs Retrasados: ${reportData.summary.delayedITRs || 0}`, 120, 62);
    }
    
    let yPos = 80;
    
    if (projectInfo) {
      doc.setFontSize(14);
      doc.text('Información del Proyecto', 14, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.text(`Nombre: ${projectInfo.name}`, 20, yPos);
      yPos += 6;
      doc.text(`Ubicación: ${projectInfo.location || 'No especificada'}`, 20, yPos);
      yPos += 6;
      doc.text(`Estado: ${translateStatus(projectInfo.status)}`, 20, yPos);
      yPos += 6;
      doc.text(`Progreso: ${projectInfo.progress || 0}%`, 20, yPos);
      yPos += 6;
      
      let startDate = 'No especificada';
      if (projectInfo.start_date) {
        startDate = new Date(projectInfo.start_date).toLocaleDateString('es-ES');
      }
      
      let endDate = 'No especificada';
      if (projectInfo.end_date) {
        endDate = new Date(projectInfo.end_date).toLocaleDateString('es-ES');
      }
      
      doc.text(`Fecha inicio: ${startDate}`, 20, yPos);
      yPos += 6;
      doc.text(`Fecha fin: ${endDate}`, 20, yPos);
      yPos += 10;
    }
    
    if (reportData.summary) {
      doc.setFontSize(14);
      doc.text('Resumen Detallado', 14, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      
      if (reportData.summary.totalProjects !== undefined) {
        doc.text(`Total de proyectos: ${reportData.summary.totalProjects}`, 20, yPos);
        yPos += 6;
        if (reportData.summary.completedProjects !== undefined) {
          doc.text(`Proyectos completados: ${reportData.summary.completedProjects}`, 30, yPos);
          yPos += 6;
          doc.text(`Proyectos en progreso: ${reportData.summary.inProgressProjects}`, 30, yPos);
          yPos += 6;
          doc.text(`Proyectos retrasados: ${reportData.summary.delayedProjects}`, 30, yPos);
          yPos += 6;
        }
      }
      
      if (reportData.summary.totalITRs !== undefined) {
        doc.text(`Total de ITRs: ${reportData.summary.totalITRs}`, 20, yPos);
        yPos += 6;
        doc.text(`ITRs completados: ${reportData.summary.completedITRs}`, 30, yPos);
        yPos += 6;
        doc.text(`ITRs en progreso: ${reportData.summary.inProgressITRs}`, 30, yPos);
        yPos += 6;
        doc.text(`ITRs retrasados: ${reportData.summary.delayedITRs}`, 30, yPos);
        yPos += 6;
      }
      
      yPos += 10;
    }
    
    if (reportData.systems && reportData.systems.length > 0) {
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text('Sistemas', 14, yPos);
      yPos += 10;
      
      const systemsTableData = reportData.systems.map((system: any) => [
        system.name,
        translateStatus(system.status || 'inprogress'),
        `${system.completion_rate || 0}%`,
        system.start_date ? new Date(system.start_date).toLocaleDateString('es-ES') : 'N/A',
        system.end_date ? new Date(system.end_date).toLocaleDateString('es-ES') : 'N/A'
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Nombre', 'Estado', 'Progreso', 'Inicio', 'Fin']],
        body: systemsTableData,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    if (reportData.itrs && reportData.itrs.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text('ITRs', 14, yPos);
      yPos += 10;
      
      const itrsTableData = reportData.itrs.map((itr: any) => {
        const subsystemName = itr.subsystems ? itr.subsystems.name : 'N/A';
        const systemName = itr.subsystems && itr.subsystems.systems ? itr.subsystems.systems.name : 'N/A';
        
        return [
          itr.name,
          subsystemName,
          systemName,
          translateStatus(itr.status),
          `${itr.progress || 0}%`,
          itr.start_date ? new Date(itr.start_date).toLocaleDateString('es-ES') : 'N/A',
          itr.end_date ? new Date(itr.end_date).toLocaleDateString('es-ES') : 'N/A',
          itr.quantity || 1
        ];
      });
      
      autoTable(doc, {
        startY: yPos,
        head: [['Nombre', 'Subsistema', 'Sistema', 'Estado', 'Progreso', 'Inicio', 'Fin', 'Cantidad']],
        body: itrsTableData,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    if (reportData.tasks && reportData.tasks.length > 0) {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text('Tareas', 14, yPos);
      yPos += 10;
      
      const tasksTableData = reportData.tasks.map((task: any) => {
        const subsystemName = task.subsystems ? task.subsystems.name : 'N/A';
        const systemName = task.subsystems && task.subsystems.systems ? task.subsystems.systems.name : 'N/A';
        
        return [
          task.name,
          subsystemName,
          systemName,
          translateStatus(task.status),
          task.description || 'N/A'
        ];
      });
      
      autoTable(doc, {
        startY: yPos,
        head: [['Nombre', 'Subsistema', 'Sistema', 'Estado', 'Descripción']],
        body: tasksTableData,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });
    }
    
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    return url;
  } catch (error) {
    console.error("Error al generar reporte:", error);
    throw error;
  }
};

export const exportToExcel = (
  data: any[],
  sheetName: string = 'Sheet1',
  fileName: string = 'export.xlsx'
) => {
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
    return true;
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    return false;
  }
};
