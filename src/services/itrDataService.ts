import { supabase } from "@/integrations/supabase/client";
import { ITR, ITRWithDetails } from "@/types/itr-types";

export const getITRs = async (): Promise<ITR[]> => {
  try {
    console.log("Fetching all ITRs");
    const { data, error } = await supabase
      .from('itrs')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching ITRs:", error);
      throw error;
    }

    console.log(`Retrieved ${data?.length || 0} ITRs`);
    return data as ITR[];
  } catch (error) {
    console.error("Error in getITRs:", error);
    throw error;
  }
};

export const getITRsBySubsystemId = async (subsystemId: string): Promise<ITR[]> => {
  try {
    console.log(`Fetching ITRs for subsystem ${subsystemId}`);
    const { data, error } = await supabase
      .from('itrs')
      .select('*')
      .eq('subsystem_id', subsystemId)
      .order('name', { ascending: true });

    if (error) {
      console.error(`Error fetching ITRs for subsystem ${subsystemId}:`, error);
      throw error;
    }

    console.log(`Retrieved ${data?.length || 0} ITRs for subsystem ${subsystemId}`);
    return data as ITR[];
  } catch (error) {
    console.error("Error in getITRsBySubsystemId:", error);
    throw error;
  }
};

export const getITRDetails = async (itrIds: string[]): Promise<ITRWithDetails[]> => {
  try {
    console.log(`Fetching ITR details for ${itrIds.length} ITRs`);
    const { data, error } = await supabase
      .from('itrs')
      .select(`
        *,
        subsystems:subsystem_id (
          name,
          systems:system_id (
            name,
            projects:project_id (
              name
            )
          )
        )
      `)
      .in('id', itrIds);

    if (error) {
      console.error("Error fetching ITR details:", error);
      throw error;
    }

    const itrsWithDetails: ITRWithDetails[] = data.map((itr: any) => {
      return {
        ...itr,
        subsystemName: itr.subsystems?.name,
        systemName: itr.subsystems?.systems?.name,
        projectName: itr.subsystems?.systems?.projects?.name,
        quantity: itr.quantity || 1
      };
    });

    console.log(`Retrieved details for ${itrsWithDetails.length} ITRs`);
    return itrsWithDetails;
  } catch (error) {
    console.error("Error in getITRDetails:", error);
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
      .maybeSingle();

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
    
    // Validation to ensure data is correct
    if (!itr.subsystem_id) {
      const error = new Error("El ID del subsistema es requerido");
      console.error(error);
      throw error;
    }
    
    // Verify that the subsystem exists
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
    
    // Prepare the object for insertion, ensuring correct types
    const newITR = {
      name: itr.name,
      subsystem_id: itr.subsystem_id,
      status: itr.status || 'inprogress',
      progress: itr.progress !== undefined ? Number(itr.progress) : 0,
      assigned_to: itr.assigned_to || null,
      start_date: itr.start_date || null,
      end_date: itr.end_date || null,
      quantity: itr.quantity !== undefined ? Number(itr.quantity) : 1  // Ensure we use the quantity field
    };
    
    console.log("Datos preparados para inserción:", newITR);
    
    // Insert the ITR into the database
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
    
    // Prepare data for update, ensuring correct types
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.subsystem_id !== undefined) updateData.subsystem_id = updates.subsystem_id;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.progress !== undefined) updateData.progress = Number(updates.progress);
    if (updates.assigned_to !== undefined) updateData.assigned_to = updates.assigned_to || null;
    if (updates.start_date !== undefined) updateData.start_date = updates.start_date || null;
    if (updates.end_date !== undefined) updateData.end_date = updates.end_date || null;
    if (updates.quantity !== undefined) updateData.quantity = Number(updates.quantity);
    
    console.log("Datos preparados para actualización:", updateData);
    
    // Update the ITR in the database
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
