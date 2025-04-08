
import { supabase } from "@/integrations/supabase/client";
import { ITR } from "@/services/types";

export const getITRs = async (): Promise<ITR[]> => {
  try {
    console.log("Fetching all ITRs");
    const { data, error } = await supabase
      .from('itrs')
      .select('*');

    if (error) {
      console.error("Error fetching ITRs:", error);
      throw error;
    }

    console.log("ITRs fetched successfully:", data?.length || 0);
    return (data as unknown as ITR[]) || [];
  } catch (error) {
    console.error("Error in getITRs:", error);
    throw error;
  }
};

export const getITRById = async (id: string): Promise<ITR | null> => {
  try {
    console.log(`Fetching ITR with id ${id}`);
    const { data, error } = await supabase
      .from('itrs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching ITR with id ${id}:`, error);
      throw error;
    }

    console.log("ITR fetched successfully:", data?.id || "not found");
    return data as unknown as ITR;
  } catch (error) {
    console.error("Error in getITRById:", error);
    throw error;
  }
};

export const createITR = async (itr: Omit<ITR, "id" | "created_at" | "updated_at">): Promise<ITR> => {
  try {
    console.log("Creating new ITR with data:", itr);
    
    // Validación para asegurarnos de que los datos estén correctos
    if (!itr.subsystem_id) {
      const error = new Error("El ID del subsistema es requerido");
      console.error(error);
      throw error;
    }
    
    // Verificar que el subsistema existe
    const { data: subsystemCheck, error: subsystemError } = await supabase
      .from('subsystems')
      .select('id, name')
      .eq('id', itr.subsystem_id)
      .maybeSingle();
      
    if (subsystemError) {
      console.error("Error al verificar el subsistema:", subsystemError);
      throw subsystemError;
    }
    
    if (!subsystemCheck) {
      const error = new Error(`Subsistema con ID ${itr.subsystem_id} no encontrado`);
      console.error(error);
      throw error;
    }
    
    console.log(`Subsistema verificado: ${subsystemCheck.name}`);
    
    // Preparar el objeto para inserción, asegurando tipos correctos
    const newITR = {
      name: itr.name,
      subsystem_id: itr.subsystem_id,
      status: itr.status || 'inprogress',
      progress: itr.progress !== undefined ? Number(itr.progress) : 0,
      assigned_to: itr.assigned_to || null,
      start_date: itr.start_date || null,
      end_date: itr.end_date || null
    };
    
    console.log("Datos preparados para inserción:", newITR);
    
    const { data, error } = await supabase
      .from('itrs')
      .insert(newITR)
      .select()
      .single();

    if (error) {
      console.error("Error creating ITR:", error);
      throw error;
    }

    console.log("ITR created successfully:", data);
    return data as unknown as ITR;
  } catch (error) {
    console.error("Error in createITR:", error);
    throw error;
  }
};

export const updateITR = async (id: string, updates: Partial<ITR>): Promise<ITR> => {
  try {
    console.log(`Updating ITR with id ${id}:`, updates);
    
    // Preparar los datos para actualización, asegurando tipos correctos
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.subsystem_id !== undefined) updateData.subsystem_id = updates.subsystem_id;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.progress !== undefined) updateData.progress = Number(updates.progress);
    if (updates.assigned_to !== undefined) updateData.assigned_to = updates.assigned_to || null;
    if (updates.start_date !== undefined) updateData.start_date = updates.start_date || null;
    if (updates.end_date !== undefined) updateData.end_date = updates.end_date || null;
    
    console.log("Datos preparados para actualización:", updateData);
    
    const { data, error } = await supabase
      .from('itrs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating ITR with id ${id}:`, error);
      throw error;
    }

    console.log("ITR updated successfully:", data);
    return data as unknown as ITR;
  } catch (error) {
    console.error("Error in updateITR:", error);
    throw error;
  }
};

export const deleteITR = async (id: string): Promise<void> => {
  try {
    console.log(`Deleting ITR with id ${id}`);
    const { error } = await supabase
      .from('itrs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting ITR with id ${id}:`, error);
      throw error;
    }

    console.log("ITR deleted successfully");
  } catch (error) {
    console.error("Error in deleteITR:", error);
    throw error;
  }
};

export const getITRsBySubsystemId = async (subsystemId: string): Promise<ITR[]> => {
  try {
    console.log(`Fetching ITRs for subsystem ${subsystemId}`);
    const { data, error } = await supabase
      .from('itrs')
      .select('*')
      .eq('subsystem_id', subsystemId);

    if (error) {
      console.error(`Error fetching ITRs for subsystem ${subsystemId}:`, error);
      throw error;
    }

    console.log(`ITRs fetched successfully for subsystem ${subsystemId}:`, data?.length || 0);
    return (data as unknown as ITR[]) || [];
  } catch (error) {
    console.error("Error in getITRsBySubsystemId:", error);
    throw error;
  }
};

export const getITRWithDetails = async (itrId: string): Promise<any> => {
  try {
    console.log(`Fetching detailed information for ITR with id ${itrId}`);
    const { data: itr, error: itrError } = await supabase
      .from('itrs')
      .select('*')
      .eq('id', itrId)
      .single();
      
    if (itrError) {
      console.error(`Error fetching ITR with id ${itrId}:`, itrError);
      throw itrError;
    }
    
    if (!itr) {
      const error = new Error("ITR no encontrado");
      console.error(error);
      throw error;
    }
    
    console.log("ITR encontrado:", itr);
    
    const { data: subsystem, error: subsystemError } = await supabase
      .from('subsystems')
      .select('*, systems(*)')
      .eq('id', itr.subsystem_id)
      .single();
      
    if (subsystemError) {
      console.error(`Error fetching subsystem for ITR ${itrId}:`, subsystemError);
      throw subsystemError;
    }
    
    if (!subsystem) {
      const error = new Error("Subsistema no encontrado");
      console.error(error);
      throw error;
    }
    
    console.log("Subsistema encontrado:", subsystem.name);
    
    const system = subsystem.systems;
    console.log("Sistema asociado:", system.name);
    
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', system.project_id)
      .single();
      
    if (projectError) {
      console.error(`Error fetching project for system ${system.id}:`, projectError);
      throw projectError;
    }
    
    console.log("Proyecto asociado:", project?.name || "No encontrado");
    
    const result = {
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
    
    console.log("Detalles completos recuperados:", result);
    return result;
  } catch (error) {
    console.error("Error in getITRWithDetails:", error);
    throw error;
  }
};
