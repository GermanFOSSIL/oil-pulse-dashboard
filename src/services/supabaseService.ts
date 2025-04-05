import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";

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
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return "https://example.com/reports/report_" + Date.now() + ".pdf";
  } catch (error) {
    console.error("Error al generar reporte:", error);
    throw error;
  }
};

export const generateImportTemplate = (): ArrayBuffer => {
  const XLSX = require('xlsx');
  
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
  
  const ws = XLSX.utils.aoa_to_sheet(templateData);
  
  ws.A1.c = [{ a: "Nombre del proyecto", t: { color: { rgb: "FF0000" } } }];
  ws.B1.c = [{ a: "Ubicación del proyecto", t: { color: { rgb: "FF0000" } } }];
  ws.C1.c = [{ a: "Estado: complete, inprogress, delayed", t: { color: { rgb: "FF0000" } } }];
  ws.D1.c = [{ a: "Progreso: 0-100", t: { color: { rgb: "FF0000" } } }];
  ws.E1.c = [{ a: "Nombre del sistema", t: { color: { rgb: "FF0000" } } }];
  ws.F1.c = [{ a: "Tasa de completado del sistema: 0-100", t: { color: { rgb: "FF0000" } } }];
  ws.G1.c = [{ a: "ID del proyecto (se puede dejar vacío y se relacionará automáticamente)", t: { color: { rgb: "FF0000" } } }];
  ws.H1.c = [{ a: "Nombre del subsistema", t: { color: { rgb: "FF0000" } } }];
  ws.I1.c = [{ a: "Tasa de completado del subsistema: 0-100", t: { color: { rgb: "FF0000" } } }];
  ws.J1.c = [{ a: "ID del sistema (se puede dejar vacío y se relacionará automáticamente)", t: { color: { rgb: "FF0000" } } }];
  ws.K1.c = [{ a: "Nombre de la tarea", t: { color: { rgb: "FF0000" } } }];
  ws.L1.c = [{ a: "Descripción de la tarea", t: { color: { rgb: "FF0000" } } }];
  ws.M1.c = [{ a: "Estado de tarea: pending, inprogress, complete", t: { color: { rgb: "FF0000" } } }];
  ws.N1.c = [{ a: "ID del subsistema (se puede dejar vacío y se relacionará automáticamente)", t: { color: { rgb: "FF0000" } } }];
  ws.O1.c = [{ a: "Nombre del ITR", t: { color: { rgb: "FF0000" } } }];
  ws.P1.c = [{ a: "Estado de ITR: inprogress, complete, delayed", t: { color: { rgb: "FF0000" } } }];
  ws.Q1.c = [{ a: "Progreso del ITR: 0-100", t: { color: { rgb: "FF0000" } } }];
  ws.R1.c = [{ a: "Fecha límite del ITR (formato YYYY-MM-DD)", t: { color: { rgb: "FF0000" } } }];
  ws.S1.c = [{ a: "Email del responsable del ITR", t: { color: { rgb: "FF0000" } } }];
  ws.T1.c = [{ a: "ID del subsistema (se puede dejar vacío y se relacionará automáticamente)", t: { color: { rgb: "FF0000" } } }];
  ws.U1.c = [{ a: "Email del usuario", t: { color: { rgb: "FF0000" } } }];
  ws.V1.c = [{ a: "Nombre completo del usuario", t: { color: { rgb: "FF0000" } } }];
  ws.W1.c = [{ a: "Rol: admin, user, tecnico", t: { color: { rgb: "FF0000" } } }];
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Datos de Importación");
  
  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
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
    const XLSX = require('xlsx');
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    if (workbook.SheetNames.length === 0) {
      throw new Error("El archivo Excel no contiene hojas");
    }
    
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    
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
        if (row.project_name) {
          const projectName = row.project_name.toString();
          
          if (!projectMap.has(projectName)) {
            let projectQuery = supabase
              .from('projects')
              .select('id')
              .eq('name', projectName);
            let { data: existingProjects } = await projectQuery;
            
            if (!existingProjects || existingProjects.length === 0) {
              const { data: newProject, error } = await supabase
                .from('projects')
                .insert({
                  name: projectName,
                  location: row.project_location || null,
                  status: row.project_status || 'inprogress',
                  progress: row.project_progress || 0
                })
                .select('id')
                .single();
              
              if (error) throw error;
              
              projectMap.set(projectName, newProject.id);
              stats.projects++;
            } else {
              projectMap.set(projectName, existingProjects[0].id);
            }
          }
          
          const projectId = projectMap.get(projectName);
          
          if (row.system_name && projectId) {
            const systemName = row.system_name.toString();
            const systemKey = `${projectName}:${systemName}`;
            
            if (!systemMap.has(systemKey)) {
              let systemQuery = supabase
                .from('systems')
                .select('id')
                .eq('name', systemName)
                .eq('project_id', projectId);
              let { data: existingSystems } = await systemQuery;
              
              if (!existingSystems || existingSystems.length === 0) {
                const { data: newSystem, error } = await supabase
                  .from('systems')
                  .insert({
                    name: systemName,
                    project_id: row.system_project_id || projectId,
                    completion_rate: row.system_completion_rate || 0
                  })
                  .select('id')
                  .single();
                
                if (error) throw error;
                
                systemMap.set(systemKey, newSystem.id);
                stats.systems++;
              } else {
                systemMap.set(systemKey, existingSystems[0].id);
              }
            }
            
            const systemId = systemMap.get(systemKey);
            
            if (row.subsystem_name && systemId) {
              const subsystemName = row.subsystem_name.toString();
              const subsystemKey = `${systemKey}:${subsystemName}`;
              
              if (!subsystemMap.has(subsystemKey)) {
                let subsystemQuery = supabase
                  .from('subsystems')
                  .select('id')
                  .eq('name', subsystemName)
                  .eq('system_id', systemId);
                let { data: existingSubsystems } = await subsystemQuery;
                
                if (!existingSubsystems || existingSubsystems.length === 0) {
                  const { data: newSubsystem, error } = await supabase
                    .from('subsystems')
                    .insert({
                      name: subsystemName,
                      system_id: row.subsystem_system_id || systemId,
                      completion_rate: row.subsystem_completion_rate || 0
                    })
                    .select('id')
                    .single();
                  
                  if (error) throw error;
                  
                  subsystemMap.set(subsystemKey, newSubsystem.id);
                  stats.subsystems++;
                } else {
                  subsystemMap.set(subsystemKey, existingSubsystems[0].id);
                }
              }
              
              const subsystemId = subsystemMap.get(subsystemKey);
              
              if (row.task_name && subsystemId) {
                await createTask({
                  name: row.task_name.toString(),
                  description: row.task_description || null,
                  subsystem_id: row.task_subsystem_id || subsystemId,
                  status: row.task_status || 'pending'
                });
                
                stats.tasks++;
              }
              
              if (row.itr_name && subsystemId) {
                await createITR({
                  name: row.itr_name.toString(),
                  subsystem_id: row.itr_subsystem_id || subsystemId,
                  status: row.itr_status || 'inprogress',
                  progress: row.itr_progress || 0,
                  due_date: row.itr_due_date || null,
                  assigned_to: row.itr_assigned_to || null
                });
                
                stats.itrs++;
              }
            }
          }
          
          if (row.user_email && row.user_full_name) {
            let { data: existingProfiles } = await supabase
              .from('profiles')
              .select('id')
              .eq('full_name', row.user_full_name);
            
            if (!existingProfiles || existingProfiles.length === 0) {
              const { error } = await supabase
                .from('profiles')
                .insert({
                  id: crypto.randomUUID(),
                  full_name: row.user_full_name,
                  role: row.user_role || 'user'
                });
              
              if (!error) stats.users++;
            }
          }
        }
      } catch (error) {
        console.error("Error procesando fila:", error, row);
      }
    }
    
    return stats;
  } catch (error) {
    console.error("Error importando datos:", error);
    throw error;
  }
};

export const updateApplicationLanguage = () => {
  console.log("Configurando idioma de la aplicación a español");
};

export const getUserProfiles = async (): Promise<Profile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error obteniendo perfiles de usuario:", error);
    throw error;
  }
};

export const createUserProfile = async (profile: Omit<Profile, "id" | "created_at" | "updated_at">): Promise<Profile> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        ...profile,
        id: crypto.randomUUID()
      })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creando perfil de usuario:", error);
    throw error;
  }
};
