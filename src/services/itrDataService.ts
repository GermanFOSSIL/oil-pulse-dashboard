
import { supabase } from "@/integrations/supabase/client";
import { ITR } from "@/services/types";

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
      assigned_to: itr.assigned_to || null, // String
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
      assigned_to: updates.assigned_to || null, // String
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
