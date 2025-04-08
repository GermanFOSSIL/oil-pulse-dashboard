
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/services/types";

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

// Nuevo método para asignar una tarea a múltiples subsistemas
export const assignTaskToMultipleSubsystems = async (
  taskData: Omit<Task, "id" | "created_at" | "updated_at" | "subsystem_id">, 
  subsystemIds: string[]
): Promise<Task[]> => {
  if (!subsystemIds.length) {
    throw new Error("Debe proporcionar al menos un subsistema");
  }

  try {
    console.log(`Asignando tarea a ${subsystemIds.length} subsistemas`);
    
    // Crear un array de objetos para inserción masiva
    const tasksToInsert = subsystemIds.map(subsystemId => ({
      ...taskData,
      subsystem_id: subsystemId
    }));
    
    const { data, error } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select();
      
    if (error) {
      console.error("Error al crear tareas masivamente:", error);
      throw error;
    }
    
    console.log(`${data.length} tareas creadas con éxito`);
    return data as unknown as Task[];
  } catch (error) {
    console.error("Error en assignTaskToMultipleSubsystems:", error);
    throw error;
  }
};

// Nuevo método para asignar múltiples ITRs a un subsistema
export const bulkCreateTasks = async (
  tasks: Array<Omit<Task, "id" | "created_at" | "updated_at">>
): Promise<Task[]> => {
  if (!tasks.length) {
    throw new Error("Debe proporcionar al menos una tarea");
  }

  try {
    console.log(`Creando ${tasks.length} tareas en lote`);
    
    const { data, error } = await supabase
      .from('tasks')
      .insert(tasks)
      .select();
      
    if (error) {
      console.error("Error al crear tareas en lote:", error);
      throw error;
    }
    
    console.log(`${data.length} tareas creadas con éxito`);
    return data as unknown as Task[];
  } catch (error) {
    console.error("Error en bulkCreateTasks:", error);
    throw error;
  }
};

