
import { supabase } from "@/integrations/supabase/client";

export const getDashboardStats = async (projectId: string | null = null) => {
  try {
    let projectsQuery = supabase.from('projects').select('*');
    if (projectId) {
      projectsQuery = projectsQuery.eq('id', projectId);
    }
    const { data: projects } = await projectsQuery;
    
    let systemsQuery = supabase.from('systems').select('*');
    if (projectId) {
      systemsQuery = systemsQuery.eq('project_id', projectId);
    }
    const { data: systems } = await systemsQuery;
    
    const systemIds = systems?.map(system => system.id) || [];
    let subsystemsQuery = supabase.from('subsystems').select('*');
    if (systemIds.length > 0) {
      subsystemsQuery = subsystemsQuery.in('system_id', systemIds);
    }
    const { data: subsystems } = await subsystemsQuery;
    
    const subsystemIds = subsystems?.map(subsystem => subsystem.id) || [];
    let itrsQuery = supabase.from('itrs').select('*');
    if (subsystemIds.length > 0) {
      itrsQuery = itrsQuery.in('subsystem_id', subsystemIds);
    }
    const { data: itrs } = await itrsQuery;
    
    let tasksQuery = supabase.from('tasks').select('*');
    if (subsystemIds.length > 0) {
      tasksQuery = tasksQuery.in('subsystem_id', subsystemIds);
    }
    const { data: tasks } = await tasksQuery;
    
    const totalProjects = projects?.length || 0;
    const totalSystems = systems?.length || 0;
    const totalITRs = itrs?.length || 0;
    
    // Calculate project completion based on ITR completion
    const completionRate = projects?.length 
      ? Math.round(projects.reduce((acc, proj) => acc + (proj.progress || 0), 0) / projects.length) 
      : 0;
    
    const projectsData = projects?.map(project => ({
      title: project.name,
      value: project.progress || 0,
      description: `${project.location || 'Sin ubicación'} - ${translateStatus(project.status)}`,
      variant: project.status === 'complete' ? 'success' as const : 
              project.status === 'delayed' ? 'danger' as const : 'warning' as const
    })) || [];
    
    // Update chart data to include ITR completion information
    const chartData = systems?.map(system => {
      // Get all subsystems for this system
      const systemSubsystems = subsystems?.filter(subsystem => subsystem.system_id === system.id) || [];
      const subsystemIds = systemSubsystems.map(subsystem => subsystem.id);
      
      // Get all ITRs for these subsystems
      const systemITRs = itrs?.filter(itr => subsystemIds.includes(itr.subsystem_id)) || [];
      const totalSystemITRs = systemITRs.length;
      const completedSystemITRs = systemITRs.filter(itr => itr.status === 'complete').length;
      
      // Calculate completion percentage based on ITRs
      const completionPercentage = totalSystemITRs > 0 
        ? Math.round((completedSystemITRs / totalSystemITRs) * 100)
        : system.completion_rate || 0;
      
      return {
        name: system.name.length > 20 ? system.name.substring(0, 20) + '...' : system.name,
        value: completionPercentage,
        completedITRs: completedSystemITRs,
        totalITRs: totalSystemITRs
      };
    }) || [];
    
    // Calculate subsystem completion based on ITRs
    if (subsystems && subsystems.length > 0 && itrs) {
      for (const subsystem of subsystems) {
        const subsystemITRs = itrs.filter(itr => itr.subsystem_id === subsystem.id);
        const totalSubsystemITRs = subsystemITRs.length;
        const completedSubsystemITRs = subsystemITRs.filter(itr => itr.status === 'complete').length;
        
        // Update subsystem completion rate based on ITR completion
        if (totalSubsystemITRs > 0) {
          const completionRate = Math.round((completedSubsystemITRs / totalSubsystemITRs) * 100);
          
          // Update subsystem in database with new completion rate
          await supabase
            .from('subsystems')
            .update({ completion_rate: completionRate })
            .eq('id', subsystem.id);
        }
      }
    }
    
    const itrsByMonth: Record<string, { inspections: number; completions: number; issues: number }> = {};
    
    itrs?.forEach(itr => {
      const createdDate = new Date(itr.created_at);
      const monthKey = `${createdDate.getFullYear()}-${createdDate.getMonth() + 1}`;
      
      if (!itrsByMonth[monthKey]) {
        itrsByMonth[monthKey] = { inspections: 0, completions: 0, issues: 0 };
      }
      
      itrsByMonth[monthKey].inspections += 1;
      
      if (itr.status === 'complete') {
        itrsByMonth[monthKey].completions += 1;
      } else if (itr.status === 'delayed') {
        itrsByMonth[monthKey].issues += 1;
      }
    });
    
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const areaChartData = Object.entries(itrsByMonth).map(([key, value]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        name: `${monthNames[month - 1]}`,
        ...value
      };
    });
    
    areaChartData.sort((a, b) => {
      const getMonthNumber = (name: string) => monthNames.indexOf(name);
      return getMonthNumber(a.name) - getMonthNumber(b.name);
    });
    
    if (areaChartData.length === 0) {
      for (let i = 0; i < 6; i++) {
        const month = (new Date().getMonth() - 5 + i) % 12;
        areaChartData.push({
          name: monthNames[month >= 0 ? month : month + 12],
          inspections: 0,
          completions: 0,
          issues: 0
        });
      }
    }
    
    const ganttData = tasks?.map(task => {
      const startDate = new Date(task.created_at);
      const endDate = task.updated_at ? new Date(task.updated_at) : new Date(startDate);
      if (endDate <= startDate) {
        endDate.setDate(startDate.getDate() + 14);
      }
      
      return {
        id: task.id,
        task: task.name,
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        progress: task.status === 'complete' ? 100 : 
                 task.status === 'inprogress' ? 50 : 30,
        dependencies: ''
      };
    }) || [];
    
    return {
      totalProjects,
      totalSystems,
      totalITRs,
      completionRate,
      projectsData,
      chartData,
      areaChartData,
      ganttData
    };
  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error);
    throw error;
  }
};

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
