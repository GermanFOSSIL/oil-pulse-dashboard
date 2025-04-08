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
  start_date: string | null;
  end_date: string | null;
};

export type System = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  project_id: string;
  completion_rate: number | null;
  start_date: string | null;
  end_date: string | null;
};

export type Subsystem = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  system_id: string;
  completion_rate: number | null;
  start_date: string | null;
  end_date: string | null;
};

export type ITR = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  subsystem_id: string;
  status: "complete" | "inprogress" | "delayed";
  progress: number | null;
  start_date: string | null;
  end_date: string | null;
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
  console.log("Datos recibidos en createITR:", itr);
  
  // Validación para asegurarnos de que los datos estén correctos
  if (!itr.subsystem_id) {
    throw new Error("El ID del subsistema es requerido");
  }
  
  const { data, error } = await supabase
    .from('itrs')
    .insert({
      name: itr.name,
      subsystem_id: itr.subsystem_id,
      status: itr.status || 'inprogress',
      progress: itr.progress || 0,
      assigned_to: itr.assigned_to || null, // Ahora es string
      start_date: itr.start_date || null,
      end_date: itr.end_date || null
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating ITR:", error);
    throw error;
  }

  return data as unknown as ITR;
};

export const updateITR = async (id: string, updates: Partial<ITR>): Promise<ITR> => {
  console.log("Datos recibidos en updateITR:", updates);
  
  const { data, error } = await supabase
    .from('itrs')
    .update({
      name: updates.name,
      subsystem_id: updates.subsystem_id,
      status: updates.status,
      progress: updates.progress,
      assigned_to: updates.assigned_to || null, // Ahora es string
      start_date: updates.start_date || null,
      end_date: updates.end_date || null
    })
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
