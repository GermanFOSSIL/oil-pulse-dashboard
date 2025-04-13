
import { supabase } from "@/integrations/supabase/client";

export const getDashboardStats = async (projectId: string | null) => {
  try {
    // Get all projects
    let projectQuery = supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply filter only if projectId is provided
    if (projectId) {
      projectQuery = projectQuery.eq('id', projectId);
    }
    
    const { data: projects, error: projectsError } = await projectQuery;
    
    if (projectsError) throw projectsError;
    
    // Count projects by status
    const completedProjects = projects.filter(p => p.status === 'complete').length;
    const inProgressProjects = projects.filter(p => p.status === 'inprogress').length;
    const delayedProjects = projects.filter(p => p.status === 'delayed').length;
    
    // Get systems
    let systemsQuery = supabase.from('systems').select('*');
    
    if (projectId) {
      systemsQuery = systemsQuery.eq('project_id', projectId);
    }
    
    const { data: systems, error: systemsError } = await systemsQuery;
    
    if (systemsError) throw systemsError;
    
    // Get subsystems
    const systemIds = systems.map(s => s.id);
    let subsystemsQuery = supabase.from('subsystems').select('*');
    
    if (systemIds.length > 0) {
      subsystemsQuery = subsystemsQuery.in('system_id', systemIds);
    }
    
    const { data: subsystems, error: subsystemsError } = await subsystemsQuery;
    
    if (subsystemsError) throw subsystemsError;
    
    // Get ITRs
    const subsystemIds = subsystems.map(s => s.id);
    let itrsQuery = supabase.from('itrs').select('*');
    
    if (subsystemIds.length > 0) {
      itrsQuery = itrsQuery.in('subsystem_id', subsystemIds);
    }
    
    const { data: itrs, error: itrsError } = await itrsQuery;
    
    if (itrsError) throw itrsError;
    
    // Calculate completion rates
    const completedITRs = itrs.filter(itr => itr.status === 'complete').length;
    const inProgressITRs = itrs.filter(itr => itr.status === 'inprogress').length;
    const delayedITRs = itrs.filter(itr => itr.status === 'delayed').length;
    
    const totalITRs = itrs.length;
    const completionRate = totalITRs > 0 ? Math.round((completedITRs / totalITRs) * 100) : 0;
    
    // Get test packs data
    const { data: testPacks, error: testPacksError } = await supabase
      .from('test_packs')
      .select('*');
    
    if (testPacksError) throw testPacksError;
    
    const completedTestPacks = testPacks.filter(tp => tp.estado === 'listo').length;
    const testPackProgress = testPacks.length > 0 
      ? Math.round((completedTestPacks / testPacks.length) * 100) 
      : 0;
    
    // Get tags data  
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*');
    
    if (tagsError) throw tagsError;
    
    const releasedTags = tags.filter(tag => tag.estado === 'liberado').length;
    const tagsProgress = tags.length > 0 
      ? Math.round((releasedTags / tags.length) * 100) 
      : 0;
    
    // Prepare data for charts  
    const chartData = prepareSystemsChartData(systems, subsystems, itrs);
    
    // Prepare data for area chart (monthly activity)
    const areaChartData = generateMockMonthlyData();
    
    // Prepare Gantt chart data
    const ganttData = prepareGanttData(projects, systems, subsystems, itrs);
    
    return {
      totalProjects: projects.length,
      totalSystems: systems.length,
      totalITRs,
      completionRate,
      completedProjects,
      inProgressProjects,
      delayedProjects,
      completedITRs,
      inProgressITRs,
      delayedITRs,
      chartData,
      areaChartData,
      ganttData,
      projectName: projectId ? projects.find(p => p.id === projectId)?.name : null,
      testPacks: {
        total: testPacks.length,
        completed: completedTestPacks,
        progress: testPackProgress
      },
      tags: {
        total: tags.length,
        released: releasedTags,
        progress: tagsProgress
      },
      tagsReleased: releasedTags,
      tagsTotal: tags.length
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

const prepareSystemsChartData = (systems, subsystems, itrs) => {
  return systems.map(system => {
    const systemSubsystems = subsystems.filter(sub => sub.system_id === system.id);
    const subsystemIds = systemSubsystems.map(sub => sub.id);
    const systemITRs = itrs.filter(itr => subsystemIds.includes(itr.subsystem_id));
    
    const totalITRs = systemITRs.length;
    const completedITRs = systemITRs.filter(itr => itr.status === 'complete').length;
    
    return {
      name: system.name,
      value: totalITRs,
      progress: totalITRs > 0 ? Math.round((completedITRs / totalITRs) * 100) : 0,
      completedITRs,
      totalITRs
    };
  });
};

const generateMockMonthlyData = () => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  
  return months.map(month => ({
    name: month,
    inspections: Math.floor(Math.random() * 50) + 30,
    completions: Math.floor(Math.random() * 40) + 20,
    issues: Math.floor(Math.random() * 10) + 5
  }));
};

const prepareGanttData = (projects, systems, subsystems, itrs) => {
  const ganttItems = [];
  
  for (const project of projects) {
    ganttItems.push({
      id: `project-${project.id}`,
      task: project.name,
      start: project.start_date || new Date().toISOString(),
      end: project.end_date || addMonths(new Date(), 3),
      progress: project.progress || 0,
      type: 'project',
      status: project.status
    });
    
    const projectSystems = systems.filter(s => s.project_id === project.id);
    
    for (const system of projectSystems) {
      ganttItems.push({
        id: `system-${system.id}`,
        task: system.name,
        start: system.start_date || new Date().toISOString(),
        end: system.end_date || addMonths(new Date(), 2),
        progress: system.completion_rate || 0,
        parent: `project-${project.id}`,
        type: 'system',
        status: 'inprogress'
      });
      
      const systemSubsystems = subsystems.filter(s => s.system_id === system.id);
      
      for (const subsystem of systemSubsystems) {
        ganttItems.push({
          id: `subsystem-${subsystem.id}`,
          task: subsystem.name,
          start: subsystem.start_date || new Date().toISOString(),
          end: subsystem.end_date || addMonths(new Date(), 1),
          progress: subsystem.completion_rate || 0,
          parent: `system-${system.id}`,
          type: 'subsystem',
          status: 'inprogress'
        });
        
        const subsystemITRs = itrs.filter(itr => itr.subsystem_id === subsystem.id);
        
        for (const itr of subsystemITRs) {
          ganttItems.push({
            id: `itr-${itr.id}`,
            task: itr.name,
            start: itr.start_date || new Date().toISOString(),
            end: itr.end_date || addMonths(new Date(), 0.5),
            progress: itr.progress || 0,
            parent: `subsystem-${subsystem.id}`,
            type: 'task',
            status: itr.status
          });
        }
      }
    }
  }
  
  return ganttItems;
};

function addMonths(date: Date, months: number): string {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result.toISOString();
}
