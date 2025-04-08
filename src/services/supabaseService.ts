import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export type Project = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  location: string | null;
  status: "complete" | "inprogress" | "delayed";
  progress: number | null;
};

export type System = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  project_id: string;
  completion_rate: number | null;
};

export type Subsystem = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  system_id: string;
  completion_rate: number | null;
};

export type ITR = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  subsystem_id: string;
  status: "complete" | "inprogress" | "delayed";
  progress: number | null;
  due_date: string | null;
  assigned_to: string | null;
};

export type Task = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  subsystem_id: string;
  status: string;
};

export type Profile = {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

export type BulkUserData = {
  email: string;
  full_name: string;
  role?: string;
};

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
    
    const chartData = systems?.map(system => ({
      name: system.name.length > 20 ? system.name.substring(0, 20) + '...' : system.name,
      value: system.completion_rate || 0
    })) || [];
    
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

export const getProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*');

  if (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }

  return (data as unknown as Project[]) || [];
};

export const getProjectById = async (id: string): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching project with id ${id}:`, error);
    throw error;
  }

  return data as unknown as Project;
};

export const createProject = async (project: Omit<Project, "id" | "created_at" | "updated_at">): Promise<Project> => {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();

  if (error) {
    console.error("Error creating project:", error);
    throw error;
  }

  return data as unknown as Project;
};

export const updateProject = async (id: string, updates: Partial<Project>): Promise<Project> => {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating project with id ${id}:`, error);
    throw error;
  }

  return data as unknown as Project;
};

export const deleteProject = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting project with id ${id}:`, error);
    throw error;
  }
};

export const getProjectsSummary = async (): Promise<{ total: number, complete: number, inProgress: number, delayed: number }> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*');

  if (error) {
    console.error("Error fetching projects for summary:", error);
    throw error;
  }

  const projects = data as unknown as Project[];
  const total = projects.length;
  const complete = projects.filter(p => p.status === 'complete').length;
  const inProgress = projects.filter(p => p.status === 'inprogress').length;
  const delayed = projects.filter(p => p.status === 'delayed').length;

  return { total, complete, inProgress, delayed };
};

export const getSystems = async (): Promise<System[]> => {
  const { data, error } = await supabase
    .from('systems')
    .select('*');

  if (error) {
    console.error("Error fetching systems:", error);
    throw error;
  }

  return data as unknown as System[] || [];
};

export const getSystemById = async (id: string): Promise<System | null> => {
  const { data, error } = await supabase
    .from('systems')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching system with id ${id}:`, error);
    throw error;
  }

  return data as unknown as System;
};

export const createSystem = async (system: Omit<System, "id" | "created_at" | "updated_at">): Promise<System> => {
  const { data, error } = await supabase
    .from('systems')
    .insert(system)
    .select()
    .single();

  if (error) {
    console.error("Error creating system:", error);
    throw error;
  }

  return data as unknown as System;
};

export const updateSystem = async (id: string, updates: Partial<System>): Promise<System> => {
  const { data, error } = await supabase
    .from('systems')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating system with id ${id}:`, error);
    throw error;
  }

  return data as unknown as System;
};

export const deleteSystem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('systems')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting system with id ${id}:`, error);
    throw error;
  }
};

export const getSystemsByProjectId = async (projectId: string): Promise<System[]> => {
  const { data, error } = await supabase
    .from('systems')
    .select('*')
    .eq('project_id', projectId);

  if (error) {
    console.error(`Error fetching systems for project ${projectId}:`, error);
    throw error;
  }

  return data as unknown as System[] || [];
};

export const getSubsystems = async (): Promise<Subsystem[]> => {
  const { data, error } = await supabase
    .from('subsystems')
    .select('*');

  if (error) {
    console.error("Error fetching subsystems:", error);
    throw error;
  }

  return data as unknown as Subsystem[] || [];
};

export const getSubsystemById = async (id: string): Promise<Subsystem | null> => {
  const { data, error } = await supabase
    .from('subsystems')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching subsystem with id ${id}:`, error);
    throw error;
  }

  return data as unknown as Subsystem;
};

export const createSubsystem = async (subsystem: Omit<Subsystem, "id" | "created_at" | "updated_at">): Promise<Subsystem> => {
  const { data, error } = await supabase
    .from('subsystems')
    .insert(subsystem)
    .select()
    .single();

  if (error) {
    console.error("Error creating subsystem:", error);
    throw error;
  }

  return data as unknown as Subsystem;
};

export const updateSubsystem = async (id: string, updates: Partial<Subsystem>): Promise<Subsystem> => {
  const { data, error } = await supabase
    .from('subsystems')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating subsystem with id ${id}:`, error);
    throw error;
  }

  return data as unknown as Subsystem;
};

export const deleteSubsystem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('subsystems')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting subsystem with id ${id}:`, error);
    throw error;
  }
};

export const getSubsystemsBySystemId = async (systemId: string): Promise<Subsystem[]> => {
  const { data, error } = await supabase
    .from('subsystems')
    .select('*')
    .eq('system_id', systemId);

  if (error) {
    console.error(`Error fetching subsystems for system ${systemId}:`, error);
    throw error;
  }

  return data as unknown as Subsystem[] || [];
};

export const getITRs = async (): Promise<ITR[]> => {
  const { data, error } = await supabase
    .from('itrs')
    .select('*');

  if (error) {
    console.error("Error fetching ITRs:", error);
    throw error;
  }

  return (data as unknown as ITR[]) || [];
};

export const getITRById = async (id: string): Promise<ITR | null> => {
  const { data, error } = await supabase
    .from('itrs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching ITR with id ${id}:`, error);
    throw error;
  }

  return data as unknown as ITR;
};

export const createITR = async (itr: Omit<ITR, "id" | "created_at" | "updated_at">): Promise<ITR> => {
  const { data, error } = await supabase
    .from('itrs')
    .insert(itr)
    .select()
    .single();

  if (error) {
    console.error("Error creating ITR:", error);
    throw error;
  }

  return data as unknown as ITR;
};

export const updateITR = async (id: string, updates: Partial<ITR>): Promise<ITR> => {
  const { data, error } = await supabase
    .from('itrs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating ITR with id ${id}:`, error);
    throw error;
  }

  return data as unknown as ITR;
};

export const deleteITR = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('itrs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting ITR with id ${id}:`, error);
    throw error;
  }
};

export const getITRsBySubsystemId = async (subsystemId: string): Promise<ITR[]> => {
  const { data, error } = await supabase
    .from('itrs')
    .select('*')
    .eq('subsystem_id', subsystemId);

  if (error) {
    console.error(`Error fetching ITRs for subsystem ${subsystemId}:`, error);
    throw error;
  }

  return (data as unknown as ITR[]) || [];
};

export const getTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*');

  if (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }

  return data as unknown as Task[] || [];
};

export const getTaskById = async (id: string): Promise<Task | null> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching task with id ${id}:`, error);
    throw error;
  }

  return data as unknown as Task;
};

export const createTask = async (task: Omit<Task, "id" | "created_at" | "updated_at">): Promise<Task> => {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();

  if (error) {
    console.error("Error creating task:", error);
    throw error;
  }

  return data as unknown as Task;
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating task with id ${id}:`, error);
    throw error;
  }

  return data as unknown as Task;
};

export const deleteTask = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting task with id ${id}:`, error);
    throw error;
  }
};

export const getTasksBySubsystemId = async (subsystemId: string): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('subsystem_id', subsystemId);

  if (error) {
    console.error(`Error fetching tasks for subsystem ${subsystemId}:`, error);
    throw error;
  }

  return data as unknown as Task[] || [];
};

export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error(`Error fetching profile for user ${userId}:`, error);
    throw error;
  }

  return data as unknown as Profile;
};

export const updateUserProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating profile for user ${userId}:`, error);
    throw error;
  }

  return data as unknown as Profile;
};

export const bulkCreateUsers = async (users: BulkUserData[]): Promise<number> => {
  try {
    let successCount = 0;
    
    for (const user of users) {
      try {
        const { data, error } = await supabase.auth.admin.createUser({
          email: user.email,
          password: generateRandomPassword(),
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name
          }
        });
        
        if (error) {
          console.error(`Error creating user ${user.email}:`, error);
          continue;
        }
        
        if (data.user && user.role) {
          await updateUserProfile(data.user.id, {
            role: user.role
          });
        }
        
        successCount++;
      } catch (err) {
        console.error(`Error processing user ${user.email}:`, err);
      }
    }
    
    return successCount;
  } catch (error) {
    console.error("Error in bulk user creation:", error);
    throw error;
  }
};

const generateRandomPassword = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters.charAt(randomIndex);
  }
  
  return password;
};

export const getITRWithDetails = async (itrId: string): Promise<any> => {
  try {
    const { data: itr, error: itrError } = await supabase
      .from('itrs')
      .select('*')
      .eq('id', itrId)
      .single();
      
    if (itrError) throw itrError;
    if (!itr) throw new Error("ITR no encontrado");
    
    const { data: subsystem, error: subsystemError } = await supabase
      .from('subsystems')
      .select('*, systems(*)')
      .eq('id', itr.subsystem_id)
      .single();
      
    if (subsystemError) throw subsystemError;
    if (!subsystem) throw new Error("Subsistema no encontrado");
    
    const system = subsystem.systems;
    
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', system.project_id)
      .single();
      
    if (projectError) throw projectError;
    
    return {
      ...itr,
      subsystem: {
        id: subsystem.id,
        name: subsystem.name
      },
      system: {
        id: system.id,
        name: system.name
      },
      project: project ? {
        id: project.id,
        name: project.name
      } : null
    };
  } catch (error) {
    console.error("Error al obtener detalles del ITR:", error);
    throw error;
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
    }
    
    let yPos = projectInfo ? 80 : 40;
    
    if (reportData.summary) {
      doc.setFontSize(12);
      doc.text('Resumen', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      Object.entries(reportData.summary).forEach(([key, value]) => {
        let label = key;
        if (key === 'totalSystems') label = 'Total de Sistemas';
        if (key === 'totalITRs') label = 'Total de ITRs';
        if (key === 'totalTasks') label = 'Total de Tareas';
        if (key === 'completedITRs') label = 'ITRs Completados';
        if (key === 'inProgressITRs') label = 'ITRs En Progreso';
        if (key === 'delayedITRs') label = 'ITRs Retrasados';
        if (key === 'completedTasks') label = 'Tareas Completadas';
        if (key === 'inProgressTasks') label = 'Tareas En Progreso';
        if (key === 'pendingTasks') label = 'Tareas Pendientes';
        
        doc.text(`${label}: ${value}`, 20, yPos);
        yPos += 6;
      });
      
      yPos += 10;
    }
    
    if (reportType === 'project_status' && reportData.systems && reportData.systems.length > 0) {
      const systemsTableData = reportData.systems.map((system: any) => [
        system.name,
        `${system.completion_rate || 0}%`
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Sistema', 'Tasa de Completado']],
        body: systemsTableData,
        headStyles: { fillColor: [41, 128, 185] },
        margin: { top: 15 }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
    
    if ((reportType === 'project_status' || reportType === 'itrs') && reportData.itrs && reportData.itrs.length > 0) {
      const itrsTableData = reportData.itrs.map((itr: any) => {
        let subsystemName = 'No disponible';
        let systemName = 'No disponible';
        
        if (itr.subsystems) {
          subsystemName = itr.subsystems.name;
          if (itr.subsystems.systems) {
            systemName = itr.subsystems.systems.name;
          }
        }
        
        return [
          itr.name,
          subsystemName,
          systemName,
          translateStatus(itr.status),
          `${itr.progress || 0}%`,
          itr.due_date ? new Date(itr.due_date).toLocaleDateString('es-ES') : 'No definida'
        ];
      });
      
      autoTable(doc, {
        startY: yPos,
        head: [['ITR', 'Subsistema', 'Sistema', 'Estado', 'Progreso', 'Fecha Límite']],
        body: itrsTableData,
        headStyles: { fillColor: [41, 128, 185] },
        margin: { top: 15 }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
    
    if (reportType === 'tasks' && reportData.tasks && reportData.tasks.length > 0) {
      const tasksTableData = reportData.tasks.map((task: any) => {
        let subsystemName = 'No disponible';
        let systemName = 'No disponible';
        
        if (task.subsystems) {
          subsystemName = task.subsystems.name;
          if (task.subsystems.systems) {
            systemName = task.subsystems.systems.name;
          }
        }
        
        return [
          task.name,
          subsystemName,
          systemName,
          translateStatus(task.status),
          task.description || 'Sin descripción'
        ];
      });
      
      autoTable(doc, {
        startY: yPos,
        head: [['Tarea', 'Subsistema', 'Sistema', 'Estado', 'Descripción']],
        body: tasksTableData,
        headStyles: { fillColor: [41, 128, 185] },
        margin: { top: 15 }
      });
    }
    
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    console.log("Reporte generado correctamente:", pdfUrl);
    
    return pdfUrl;
  } catch (error) {
    console.error("Error al generar reporte:", error);
    throw error;
  }
};

export const generateImportTemplate = async (): Promise<ArrayBuffer> => {
  try {
    console.log("Generando plantilla de importación...");
    
    const templateData = [
      [
        "project_name", "project_location", "project_status", "project_progress", 
        "system_name", "system_completion_rate", "system_project_id",
        "subsystem_name", "subsystem_completion_rate", "subsystem_system_id", 
        "task_name", "task_description", "task_status", "task_subsystem_id",
        "itr_name", "itr_status", "itr_progress", "itr_due_date", "itr_assigned_to", "itr_subsystem_id",
        "user_email", "user_full_name", "user_role"
      ],
      [
        "Proyecto Ejemplo", "Ubicación Ejemplo", "inprogress", 50,
        "Sistema Ejemplo", 60, "",
        "Subsistema Ejemplo", 70, "",
        "Tarea Ejemplo", "Descripción de tarea", "pending", "",
        "ITR Ejemplo", "inprogress", 40, "2025-01-15", "responsable@ejemplo.com", "",
        "usuario@ejemplo.com", "Nombre Completo", "user"
      ]
    ];
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    
    if (!ws.A1.c) ws.A1.c = [];
    ws.A1.c.push({a: "Nombre del proyecto", t: {color: {rgb: "FF0000"}}});
    
    if (!ws.B1.c) ws.B1.c = [];
    ws.B1.c.push({a: "Ubicación del proyecto", t: {color: {rgb: "FF0000"}}});
    
    if (!ws.C1.c) ws.C1.c = [];
    ws.C1.c.push({a: "Estado: complete, inprogress, delayed", t: {color: {rgb: "FF0000"}}});
    
    if (!ws.D1.c) ws.D1.c = [];
    ws.D1.c.push({a: "Progreso: 0-100", t: {color: {rgb: "FF0000"}}});
    
    if (!ws.E1.c) ws.E1.c = [];
    ws.E1.c.push({a: "Nombre del sistema", t: {color: {rgb: "FF0000"}}});
    
    if (!ws.F1.c) ws.F1.c = [];
    ws.F1.c.push({a: "Tasa de completado del sistema: 0-100", t: {color: {rgb: "FF0000"}}});
    
    if (!ws.G1.c) ws.G1.c = [];
    ws.G1.c.push({a: "ID del proyecto (se puede dejar vacío y se relacionará automáticamente)", t: {color: {rgb: "FF0000"}}});
    
    if (!ws.H1.c) ws.H1.c = [];
    ws.H1.c.push({a: "Nombre del subsistema", t: {color: {rgb: "FF0000"}}});
    
    if (!ws.I1.c) ws.I1.c = [];
    ws.I1.c.push({a: "Tasa de completado del subsistema: 0-100", t: {color: {rgb: "FF0000"}}});
    
    if (!ws.J1.c) ws.J1.c = [];
    ws.J1.c.push({a: "ID del sistema (se puede dejar vacío y se relacionará automáticamente)", t: {color: {rgb: "FF0000"}}});
    
    if (!ws.K1.c) ws.K1.c = [];
    ws.K1.c.push({a: "Nombre de la tarea", t: {color: {rgb: "FF0000"}}});
    
    if (!ws.L1.c) ws.L1.c = [];
    ws.L1.c.push({a: "Descripción de la tarea", t: {color: {rgb: "FF0000"}}});
    
    if (!ws.M1.c) ws.M1.c = [];
    ws.M1.c.push({a: "Estado de tarea: pending, inprogress, complete", t: {color: {rgb: "FF0000"}}});
    
    if (!ws.N1.c) ws.N1.c = [];
    ws.N1.c.push({a: "ID del subsistema (se puede dejar vacío y se relacionará automáticamente)", t: {color: {rgb: "FF0000"}}});
    
    if (!ws.O1.c) ws.O1.c = [];
    ws.O1.c.push({a: "Nombre del ITR", t: {color: {rgb: "FF0000"}}});
    
    if (!ws.P1.c) ws.P1.c = [];
    ws.P1.c.push({a: "Estado de ITR: inprogress, complete, delayed", t: {color: {rgb: "FF0000"}}});
    
    if (!ws.Q1.c) ws.Q1.c = [];
    ws.Q1.c.push({a: "Progreso del ITR: 0-100", t: {color: {rgb: "FF0000"}}});
    
    if (!ws.R1.c) ws.R1.c = [];
    ws.R1.c.push({a: "Fecha límite del ITR (formato YYYY-MM-DD)", t: {color: {rgb: "FF0000"}}});
    
    if (!ws.S1.c) ws.S1.c = [];
    ws.S1.c.push({a: "Email del responsable del ITR", t: {color: {rgb: "FF0000"}}});
    
    if (!ws.T1.c) ws.T1.c = [];
    ws.T1.c.push({a: "ID del subsistema (se puede dejar vacío y se relacionará automáticamente)", t: {color: {rgb: "FF0000"}}});
    
    if (!ws.U1.c) ws.U1.c = [];
    ws.U1.c.push({a: "Email del usuario", t: {color: {rgb: "FF0000"}}});
    
    if (!ws.V1.c) ws.V1.c = [];
    ws.V1.c.push({a: "Nombre completo del usuario", t: {color: {rgb: "FF0000"}}});
    
    if (!ws.W1.c) ws.W1.c = [];
    ws.W1.c.push({a: "Rol: admin, user, tecnico", t: {color: {rgb: "FF0000"}}});
    
    XLSX.utils.book_append_sheet(wb, ws, "Datos de Importación");
    
    console.log("Plantilla generada correctamente");
    
    return XLSX.write(wb, { type: "array", bookType: "xlsx" });
  } catch (error) {
    console.error("Error al generar la plantilla de importación:", error);
    throw error;
  }
};

export const importDataFromExcel = async (buffer: ArrayBuffer): Promise<{
  projects: number;
  systems: number;
  subsystems: number;
  tasks: number;
  itrs: number;
  users: number;
}> => {
  try {
    console.log("Importando datos desde Excel...");
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    if (workbook.SheetNames.length === 0) {
      throw new Error("El archivo Excel no contiene hojas");
    }
    
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    if (data.length === 0) {
      throw new Error("No hay datos en la plantilla para importar");
    }
    
    console.log(`Se encontraron ${data.length} filas de datos para importar`);
    
    const stats = {
      projects: 0,
      systems: 0,
      subsystems: 0,
      tasks: 0,
      itrs: 0,
      users: 0
    };
    
    const projectMap = new Map<string, string>();
    const systemMap = new Map<string, string>();
    const subsystemMap = new Map<string, string>();
    
    for (const row of data) {
      try {
        const rowData = row as Record<string, any>;
        
        if (rowData.project_name) {
          const projectName = rowData.project_name.toString();
          
          if (!projectMap.has(projectName)) {
            let projectQuery = supabase
              .from('projects')
              .select('id')
              .eq('name', projectName);
            let { data: existingProjects, error: projectQueryError } = await projectQuery;
            
            if (projectQueryError) {
              console.error("Error al consultar proyectos:", projectQueryError);
              continue;
            }
            
            if (!existingProjects || existingProjects.length === 0) {
              const { data: newProject, error: insertError } = await supabase
                .from('projects')
                .insert({
                  name: projectName,
                  location: rowData.project_location || null,
                  status: rowData.project_status || 'inprogress',
                  progress: rowData.project_progress || 0
                })
                .select('id')
                .single();
              
              if (insertError) {
                console.error("Error al insertar proyecto:", insertError);
                continue;
              }
              
              projectMap.set(projectName, newProject.id);
              stats.projects++;
              console.log(`Proyecto creado: ${projectName} (${newProject.id})`);
            } else {
              projectMap.set(projectName, existingProjects[0].id);
              console.log(`Proyecto existente encontrado: ${projectName} (${existingProjects[0].id})`);
            }
          }
          
          const projectId = projectMap.get(projectName);
          
          if (rowData.system_name && projectId) {
            const systemName = rowData.system_name.toString();
            const systemKey = `${projectName}:${systemName}`;
            
            if (!systemMap.has(systemKey)) {
              let systemQuery = supabase
                .from('systems')
                .select('id')
                .eq('name', systemName)
                .eq('project_id', projectId);
              let { data: existingSystems, error: systemQueryError } = await systemQuery;
              
              if (systemQueryError) {
                console.error("Error al consultar sistemas:", systemQueryError);
                continue;
              }
              
              if (!existingSystems || existingSystems.length === 0) {
                const { data: newSystem, error: insertError } = await supabase
                  .from('systems')
                  .insert({
                    name: systemName,
                    project_id: rowData.system_project_id || projectId,
                    completion_rate: rowData.system_completion_rate || 0
                  })
                  .select('id')
                  .single();
                
                if (insertError) {
                  console.error("Error al insertar sistema:", insertError);
                  continue;
                }
                
                systemMap.set(systemKey, newSystem.id);
                stats.systems++;
                console.log(`Sistema creado: ${systemName} (${newSystem.id})`);
              } else {
                systemMap.set(systemKey, existingSystems[0].id);
                console.log(`Sistema existente encontrado: ${systemName} (${existingSystems[0].id})`);
              }
            }
            
            const systemId = systemMap.get(systemKey);
            
            if (rowData.subsystem_name && systemId) {
              const subsystemName = rowData.subsystem_name.toString();
              const subsystemKey = `${systemKey}:${subsystemName}`;
              
              if (!subsystemMap.has(subsystemKey)) {
                let subsystemQuery = supabase
                  .from('subsystems')
                  .select('id')
                  .eq('name', subsystemName)
                  .eq('system_id', systemId);
                let { data: existingSubsystems, error: subsystemQueryError } = await subsystemQuery;
                
                if (subsystemQueryError) {
                  console.error("Error al consultar subsistemas:", subsystemQueryError);
                  continue;
                }
                
                if (!existingSubsystems || existingSubsystems.length === 0) {
                  const { data: newSubsystem, error: insertError } = await supabase
                    .from('subsystems')
                    .insert({
                      name: subsystemName,
                      system_id: rowData.subsystem_system_id || systemId,
                      completion_rate: rowData.subsystem_completion_rate || 0
                    })
                    .select('id')
                    .single();
                  
                  if (insertError) {
                    console.error("Error al insertar subsistema:", insertError);
                    continue;
                  }
                  
                  subsystemMap.set(subsystemKey, newSubsystem.id);
                  stats.subsystems++;
                  console.log(`Subsistema creado: ${subsystemName} (${newSubsystem.id})`);
                } else {
                  subsystemMap.set(subsystemKey, existingSubsystems[0].id);
                  console.log(`Subsistema existente encontrado: ${subsystemName} (${existingSubsystems[0].id})`);
                }
              }
              
              const subsystemId = subsystemMap.get(subsystemKey);
              
              if (rowData.task_name && subsystemId) {
                const taskName = rowData.task_name.toString();
                const { data: newTask, error: taskError } = await supabase
                  .from('tasks')
                  .insert({
                    name: taskName,
                    description: rowData.task_description || null,
                    subsystem_id: rowData.task_subsystem_id || subsystemId,
                    status: rowData.task_status || 'pending'
                  })
                  .select('id')
                  .single();
                
                if (taskError) {
                  console.error("Error al insertar tarea:", taskError);
                  continue;
                }
                
                stats.tasks++;
                console.log(`Tarea creada: ${taskName} (${newTask.id})`);
              }
              
              if (rowData.itr_name && subsystemId) {
                const itrName = rowData.itr_name.toString();
                const { data: newITR, error: itrError } = await supabase
                  .from('itrs')
                  .insert({
                    name: itrName,
                    subsystem_id: rowData.itr_subsystem_id || subsystemId,
                    status: rowData.itr_status || 'inprogress',
                    progress: rowData.itr_progress || 0,
                    due_date: rowData.itr_due_date || null,
                    assigned_to: rowData.itr_assigned_to || null
                  })
                  .select('id')
                  .single();
                
                if (itrError) {
                  console.error("Error al insertar ITR:", itrError);
                  continue;
                }
                
                stats.itrs++;
                console.log(`ITR creado: ${itrName} (${newITR.id})`);
              }
            }
          }
          
          if (rowData.user_email && rowData.user_full_name) {
            const userName = rowData.user_full_name.toString();
            const { data: newUser, error: userError } = await supabase
              .from('profiles')
              .insert({
                id: crypto.randomUUID(),
                full_name: userName,
                role: rowData.user_role || 'user'
              })
              .select('id')
              .single();
            
            if (userError) {
              console.error("Error al insertar usuario:", userError);
              continue;
            }
            
            stats.users++;
            console.log(`Usuario creado: ${userName} (${newUser.id})`);
          }
        }
      } catch (error) {
        console.error("Error procesando fila:", error, row);
      }
    }
    
    console.log("Importación completada con éxito:", stats);
    return stats;
  } catch (error) {
    console.error("Error en la importación de datos:", error);
    throw error;
  }
};

export const updateApplicationLanguage = () => {
  console.log("Configurando idioma de la aplicación a español");
};

export const getUserProfiles = async (): Promise<Profile[]> => {
  try {
    console.log("Obteniendo perfiles de usuario...");
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
      
    if (error) {
      console.error("Error obteniendo perfiles de usuario:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error en getUserProfiles:", error);
    throw error;
  }
};

export const createUserProfile = async (profile: Omit<Profile, "id" | "created_at" | "updated_at">): Promise<Profile> => {
  try {
    console.log("Creando perfil de usuario:", profile);
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        ...profile,
        id: crypto.randomUUID()
      })
      .select()
      .single();
      
    if (error) {
      console.error("Error creando perfil de usuario:", error);
      throw error;
    }
    
    console.log("Perfil de usuario creado correctamente:", data);
    return data;
  } catch (error) {
    console.error("Error en createUserProfile:", error);
    throw error;
  }
};
