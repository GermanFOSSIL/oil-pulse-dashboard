
import { supabase } from "@/integrations/supabase/client";
import { System, Subsystem } from "@/services/types";

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

// Método nuevo para obtener sistemas con sus subsistemas
export const getSystemsWithSubsystems = async (): Promise<any[]> => {
  try {
    console.log("Obteniendo sistemas con sus subsistemas");
    
    const { data, error } = await supabase
      .from('systems')
      .select(`
        id,
        name,
        project_id,
        subsystems:subsystems(id, name)
      `);
      
    if (error) {
      console.error("Error al obtener sistemas con subsistemas:", error);
      throw error;
    }
    
    console.log(`Se encontraron ${data.length} sistemas`);
    return data || [];
  } catch (error) {
    console.error("Error en getSystemsWithSubsystems:", error);
    throw error;
  }
};

// Método para obtener proyectos con sistemas y subsistemas
export const getProjectsHierarchy = async (): Promise<any[]> => {
  try {
    console.log("Obteniendo jerarquía completa de proyectos");
    
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        systems:systems(
          id, 
          name,
          subsystems:subsystems(id, name)
        )
      `);
      
    if (error) {
      console.error("Error al obtener jerarquía de proyectos:", error);
      throw error;
    }
    
    console.log(`Se encontraron ${data.length} proyectos`);
    return data || [];
  } catch (error) {
    console.error("Error en getProjectsHierarchy:", error);
    return []; // Return empty array on error instead of throwing
  }
};

// Get available ITRs for a specific subsystem
export const getAvailableITRs = async (subsystemId: string) => {
  try {
    console.log(`Fetching ITRs for subsystem ${subsystemId}`);
    const { data, error } = await supabase
      .from('itrs')
      .select('id, name, quantity, status, progress')
      .eq('subsystem_id', subsystemId)
      .order('name');
      
    if (error) {
      console.error("Error fetching ITRs:", error);
      throw error;
    }
    
    console.log(`Found ${data?.length || 0} ITRs for subsystem ${subsystemId}`);
    return data || [];
  } catch (error) {
    console.error("Error in getAvailableITRs:", error);
    return []; // Return empty array instead of throwing
  }
};

