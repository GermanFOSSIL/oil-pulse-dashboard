
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Project = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  location: string;
  status: "complete" | "inprogress" | "delayed";
  progress: number;
};

export type System = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  project_id: string;
  completion_rate: number;
};

export type Subsystem = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  system_id: string;
  completion_rate: number;
};

export type ITR = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  subsystem_id: string;
  status: "complete" | "inprogress" | "delayed";
  progress: number;
  due_date: string;
  assigned_to: string;
};

// Actualizada para coincidir con la estructura de la base de datos real
export type Task = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
  subsystem_id: string;
  status: string;
};

export type Profile = {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  avatar_url: string;
  role: string;
};

// Nueva función para obtener estadísticas del dashboard
export const getDashboardStats = async () => {
  try {
    // Obtener proyectos
    const { data: projects } = await supabase
      .from('projects')
      .select('*');
    
    // Obtener sistemas
    const { data: systems } = await supabase
      .from('systems')
      .select('*');
    
    // Obtener ITRs
    const { data: itrs } = await supabase
      .from('itrs')
      .select('*');
    
    // Calcular estadísticas
    const totalProjects = projects?.length || 0;
    const totalSystems = systems?.length || 0;
    const totalITRs = itrs?.length || 0;
    
    // Calcular tasa de completado (promedio de progreso de proyectos)
    const completionRate = projects?.length 
      ? Math.round(projects.reduce((acc, proj) => acc + (proj.progress || 0), 0) / projects.length) 
      : 0;
    
    // Datos para tarjetas de proyectos
    const projectsData = projects?.slice(0, 3).map(project => ({
      title: project.name,
      value: project.progress || 0,
      description: `${project.location || 'Sin ubicación'} - ${project.status}`,
      variant: project.status === 'complete' ? 'success' : 
              project.status === 'delayed' ? 'danger' : 'warning'
    })) || [];
    
    // Datos para gráfico de barras
    const chartData = systems?.slice(0, 6).map(system => ({
      name: system.name.length > 10 ? system.name.substring(0, 10) + '...' : system.name,
      value: system.completion_rate || 0
    })) || [];
    
    // Datos para gráfico de área
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const currentDate = new Date();
    
    // Generar datos de ejemplo para el gráfico de área basados en datos reales
    const areaChartData = monthNames.slice(0, 6).map((monthName, index) => {
      const month = (currentDate.getMonth() - 5 + index) % 12;
      const inspections = Math.floor(Math.random() * (totalITRs + 10)) + 5;
      const completions = Math.floor(inspections * (completionRate / 100));
      const issues = Math.floor(inspections * 0.2);
      
      return {
        name: monthName,
        inspections,
        completions,
        issues
      };
    });
    
    return {
      totalProjects,
      totalSystems,
      totalITRs,
      completionRate,
      projectsData,
      chartData,
      areaChartData
    };
  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error);
    throw error;
  }
};

// Projects CRUD
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

// Systems CRUD
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

// Subsystems CRUD
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

// ITRs CRUD
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

// Tasks CRUD actualizado para coincidir con la estructura de la base de datos
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

// User profiles
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
