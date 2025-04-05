
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Tipos para las entidades
export interface Project {
  id: string;
  name: string;
  location: string | null;
  status: "complete" | "inprogress" | "delayed";
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface System {
  id: string;
  name: string;
  project_id: string;
  completion_rate: number;
  created_at: string;
  updated_at: string;
}

export interface Subsystem {
  id: string;
  name: string;
  system_id: string;
  completion_rate: number;
  created_at: string;
  updated_at: string;
}

export interface ITR {
  id: string;
  name: string;
  subsystem_id: string;
  assigned_to: string | null;
  due_date: string | null;
  status: "complete" | "inprogress" | "delayed";
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  name: string;
  description: string | null;
  subsystem_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
}

// Función genérica para manejar errores
const handleError = (error: any, operation: string) => {
  console.error(`Error en ${operation}:`, error);
  toast({
    title: `Error en ${operation}`,
    description: error.message || "Ha ocurrido un error inesperado",
    variant: "destructive",
  });
  throw error;
};

// Funciones para Proyectos
export const getProjects = async (): Promise<Project[]> => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return handleError(error, "obtener proyectos");
  }
};

export const getProject = async (id: string): Promise<Project | null> => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    return handleError(error, "obtener proyecto");
  }
};

export const createProject = async (project: Omit<Project, "id" | "created_at" | "updated_at">): Promise<Project> => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .insert(project)
      .select()
      .single();

    if (error) throw error;
    
    toast({
      title: "Proyecto creado",
      description: "El proyecto ha sido creado exitosamente",
    });
    
    return data;
  } catch (error) {
    return handleError(error, "crear proyecto");
  }
};

export const updateProject = async (id: string, project: Partial<Project>): Promise<Project> => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .update(project)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    
    toast({
      title: "Proyecto actualizado",
      description: "El proyecto ha sido actualizado exitosamente",
    });
    
    return data;
  } catch (error) {
    return handleError(error, "actualizar proyecto");
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) throw error;
    
    toast({
      title: "Proyecto eliminado",
      description: "El proyecto ha sido eliminado exitosamente",
    });
  } catch (error) {
    handleError(error, "eliminar proyecto");
  }
};

// Funciones para Sistemas
export const getSystems = async (projectId?: string): Promise<System[]> => {
  try {
    let query = supabase.from("systems").select("*");
    
    if (projectId) {
      query = query.eq("project_id", projectId);
    }
    
    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return handleError(error, "obtener sistemas");
  }
};

export const getSystem = async (id: string): Promise<System | null> => {
  try {
    const { data, error } = await supabase
      .from("systems")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    return handleError(error, "obtener sistema");
  }
};

export const createSystem = async (system: Omit<System, "id" | "created_at" | "updated_at">): Promise<System> => {
  try {
    const { data, error } = await supabase
      .from("systems")
      .insert(system)
      .select()
      .single();

    if (error) throw error;
    
    toast({
      title: "Sistema creado",
      description: "El sistema ha sido creado exitosamente",
    });
    
    return data;
  } catch (error) {
    return handleError(error, "crear sistema");
  }
};

export const updateSystem = async (id: string, system: Partial<System>): Promise<System> => {
  try {
    const { data, error } = await supabase
      .from("systems")
      .update(system)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    
    toast({
      title: "Sistema actualizado",
      description: "El sistema ha sido actualizado exitosamente",
    });
    
    return data;
  } catch (error) {
    return handleError(error, "actualizar sistema");
  }
};

export const deleteSystem = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("systems")
      .delete()
      .eq("id", id);

    if (error) throw error;
    
    toast({
      title: "Sistema eliminado",
      description: "El sistema ha sido eliminado exitosamente",
    });
  } catch (error) {
    handleError(error, "eliminar sistema");
  }
};

// Funciones para Subsistemas
export const getSubsystems = async (systemId?: string): Promise<Subsystem[]> => {
  try {
    let query = supabase.from("subsystems").select("*");
    
    if (systemId) {
      query = query.eq("system_id", systemId);
    }
    
    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return handleError(error, "obtener subsistemas");
  }
};

export const getSubsystem = async (id: string): Promise<Subsystem | null> => {
  try {
    const { data, error } = await supabase
      .from("subsystems")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    return handleError(error, "obtener subsistema");
  }
};

export const createSubsystem = async (subsystem: Omit<Subsystem, "id" | "created_at" | "updated_at">): Promise<Subsystem> => {
  try {
    const { data, error } = await supabase
      .from("subsystems")
      .insert(subsystem)
      .select()
      .single();

    if (error) throw error;
    
    toast({
      title: "Subsistema creado",
      description: "El subsistema ha sido creado exitosamente",
    });
    
    return data;
  } catch (error) {
    return handleError(error, "crear subsistema");
  }
};

export const updateSubsystem = async (id: string, subsystem: Partial<Subsystem>): Promise<Subsystem> => {
  try {
    const { data, error } = await supabase
      .from("subsystems")
      .update(subsystem)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    
    toast({
      title: "Subsistema actualizado",
      description: "El subsistema ha sido actualizado exitosamente",
    });
    
    return data;
  } catch (error) {
    return handleError(error, "actualizar subsistema");
  }
};

export const deleteSubsystem = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("subsystems")
      .delete()
      .eq("id", id);

    if (error) throw error;
    
    toast({
      title: "Subsistema eliminado",
      description: "El subsistema ha sido eliminado exitosamente",
    });
  } catch (error) {
    handleError(error, "eliminar subsistema");
  }
};

// Funciones para ITRs
export const getITRs = async (subsystemId?: string): Promise<ITR[]> => {
  try {
    let query = supabase.from("itrs").select("*");
    
    if (subsystemId) {
      query = query.eq("subsystem_id", subsystemId);
    }
    
    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return handleError(error, "obtener ITRs");
  }
};

export const getITR = async (id: string): Promise<ITR | null> => {
  try {
    const { data, error } = await supabase
      .from("itrs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    return handleError(error, "obtener ITR");
  }
};

export const createITR = async (itr: Omit<ITR, "id" | "created_at" | "updated_at">): Promise<ITR> => {
  try {
    const { data, error } = await supabase
      .from("itrs")
      .insert(itr)
      .select()
      .single();

    if (error) throw error;
    
    toast({
      title: "ITR creado",
      description: "El ITR ha sido creado exitosamente",
    });
    
    return data;
  } catch (error) {
    return handleError(error, "crear ITR");
  }
};

export const updateITR = async (id: string, itr: Partial<ITR>): Promise<ITR> => {
  try {
    const { data, error } = await supabase
      .from("itrs")
      .update(itr)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    
    toast({
      title: "ITR actualizado",
      description: "El ITR ha sido actualizado exitosamente",
    });
    
    return data;
  } catch (error) {
    return handleError(error, "actualizar ITR");
  }
};

export const deleteITR = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("itrs")
      .delete()
      .eq("id", id);

    if (error) throw error;
    
    toast({
      title: "ITR eliminado",
      description: "El ITR ha sido eliminado exitosamente",
    });
  } catch (error) {
    handleError(error, "eliminar ITR");
  }
};

// Funciones para Tareas
export const getTasks = async (subsystemId?: string): Promise<Task[]> => {
  try {
    let query = supabase.from("tasks").select("*");
    
    if (subsystemId) {
      query = query.eq("subsystem_id", subsystemId);
    }
    
    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return handleError(error, "obtener tareas");
  }
};

export const getTask = async (id: string): Promise<Task | null> => {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    return handleError(error, "obtener tarea");
  }
};

export const createTask = async (task: Omit<Task, "id" | "created_at" | "updated_at">): Promise<Task> => {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    
    toast({
      title: "Tarea creada",
      description: "La tarea ha sido creada exitosamente",
    });
    
    return data;
  } catch (error) {
    return handleError(error, "crear tarea");
  }
};

export const updateTask = async (id: string, task: Partial<Task>): Promise<Task> => {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .update(task)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    
    toast({
      title: "Tarea actualizada",
      description: "La tarea ha sido actualizada exitosamente",
    });
    
    return data;
  } catch (error) {
    return handleError(error, "actualizar tarea");
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (error) throw error;
    
    toast({
      title: "Tarea eliminada",
      description: "La tarea ha sido eliminada exitosamente",
    });
  } catch (error) {
    handleError(error, "eliminar tarea");
  }
};

// Funciones para el almacenamiento de archivos
export const uploadFile = async (bucket: string, path: string, file: File): Promise<string> => {
  try {
    const filePath = `${path}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(filePath, file);

    if (error) throw error;
    
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    
    toast({
      title: "Archivo subido",
      description: "El archivo ha sido subido exitosamente",
    });
    
    return data.publicUrl;
  } catch (error) {
    return handleError(error, "subir archivo");
  }
};

export const deleteFile = async (bucket: string, path: string): Promise<void> => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) throw error;
    
    toast({
      title: "Archivo eliminado",
      description: "El archivo ha sido eliminado exitosamente",
    });
  } catch (error) {
    handleError(error, "eliminar archivo");
  }
};

// Funciones para Perfiles
export const getProfiles = async (): Promise<Profile[]> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*");

    if (error) throw error;
    return data || [];
  } catch (error) {
    return handleError(error, "obtener perfiles");
  }
};

export const getProfile = async (id: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    return handleError(error, "obtener perfil");
  }
};

export const updateProfile = async (id: string, profile: Partial<Profile>): Promise<Profile> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(profile)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    
    toast({
      title: "Perfil actualizado",
      description: "El perfil ha sido actualizado exitosamente",
    });
    
    return data;
  } catch (error) {
    return handleError(error, "actualizar perfil");
  }
};

// Dashboard stats
export const getDashboardStats = async () => {
  try {
    const [projects, systems, subsystems, itrs] = await Promise.all([
      getProjects(),
      getSystems(),
      getSubsystems(),
      getITRs()
    ]);

    const completedITRs = itrs.filter(itr => itr.status === "complete").length;
    const totalITRs = itrs.length;
    const completionRate = totalITRs > 0 ? Math.round((completedITRs / totalITRs) * 100) : 0;

    return {
      totalProjects: projects.length,
      totalSystems: systems.length,
      totalITRs: itrs.length,
      completionRate,
      projectsData: projects.slice(0, 3).map(p => ({
        title: p.name,
        value: p.progress,
        description: `${p.progress} de 100 ITRs completados`,
        variant: p.progress >= 75 ? "success" : p.progress >= 40 ? "warning" : "danger"
      })),
      chartData: [
        { name: "Ene", value: Math.floor(Math.random() * 700) + 100 },
        { name: "Feb", value: Math.floor(Math.random() * 700) + 100 },
        { name: "Mar", value: Math.floor(Math.random() * 700) + 100 },
        { name: "Abr", value: Math.floor(Math.random() * 700) + 100 },
        { name: "May", value: Math.floor(Math.random() * 700) + 100 },
        { name: "Jun", value: Math.floor(Math.random() * 700) + 100 },
        { name: "Jul", value: Math.floor(Math.random() * 700) + 100 },
      ],
      areaChartData: [
        { name: "Ene", inspections: 40, completions: 24, issues: 10 },
        { name: "Feb", inspections: 30, completions: 18, issues: 8 },
        { name: "Mar", inspections: 80, completions: 32, issues: 14 },
        { name: "Abr", inspections: 90, completions: 45, issues: 6 },
        { name: "May", inspections: 70, completions: 52, issues: 5 },
        { name: "Jun", inspections: 60, completions: 40, issues: 12 },
      ]
    };
  } catch (error) {
    return handleError(error, "obtener estadísticas");
  }
};
