
import { supabase } from "@/integrations/supabase/client";
import { ITRWithDetails } from "@/types/itr-types";

// Get all ITRs for a specific project including subsystem and system information
export const getITRsWithDetails = async (projectId: string): Promise<ITRWithDetails[]> => {
  try {
    // Step 1: Get all systems for the specified project
    const { data: systems, error: systemsError } = await supabase
      .from('systems')
      .select('*')
      .eq('project_id', projectId);

    if (systemsError) throw systemsError;
    if (!systems || systems.length === 0) return [];

    // Extract system IDs for the next query
    const systemIds = systems.map(system => system.id);

    // Step 2: Get all subsystems for these systems
    const { data: subsystems, error: subsystemsError } = await supabase
      .from('subsystems')
      .select('*')
      .in('system_id', systemIds);

    if (subsystemsError) throw subsystemsError;
    if (!subsystems || subsystems.length === 0) return [];

    // Extract subsystem IDs for the next query
    const subsystemIds = subsystems.map(subsystem => subsystem.id);

    // Step 3: Get all ITRs for these subsystems
    const { data: itrs, error: itrsError } = await supabase
      .from('itrs')
      .select('*')
      .in('subsystem_id', subsystemIds);

    if (itrsError) throw itrsError;
    if (!itrs || itrs.length === 0) return [];

    // Step 4: Enrich ITR data with subsystem and system information
    const enrichedITRs = itrs.map(itr => {
      const subsystem = subsystems.find(s => s.id === itr.subsystem_id);
      const system = subsystem ? systems.find(s => s.id === subsystem.system_id) : null;

      return {
        ...itr,
        subsystemName: subsystem ? subsystem.name : 'Desconocido',
        systemName: system ? system.name : 'Desconocido',
        projectName: 'Proyecto', // We already know the project ID, but not the name here
        quantity: itr.quantity || 1,
        status: itr.status as "complete" | "inprogress" | "delayed"
      } as ITRWithDetails;
    });

    return enrichedITRs;
  } catch (error) {
    console.error("Error fetching ITRs with details:", error);
    throw error;
  }
};

// Get all ITRs for a specific subsystem including subsystem and system information
export const getITRsBySubsystem = async (subsystemId: string): Promise<ITRWithDetails[]> => {
  try {
    // Step 1: Get the subsystem
    const { data: subsystem, error: subsystemError } = await supabase
      .from('subsystems')
      .select('*')
      .eq('id', subsystemId)
      .single();

    if (subsystemError) throw subsystemError;
    if (!subsystem) throw new Error('Subsystem not found');

    // Step 2: Get the system for this subsystem
    const { data: system, error: systemError } = await supabase
      .from('systems')
      .select('*')
      .eq('id', subsystem.system_id)
      .single();

    if (systemError) throw systemError;
    if (!system) throw new Error('System not found');

    // Step 3: Get all ITRs for this subsystem
    const { data: itrs, error: itrsError } = await supabase
      .from('itrs')
      .select('*')
      .eq('subsystem_id', subsystemId);

    if (itrsError) throw itrsError;
    if (!itrs || itrs.length === 0) return [];

    // Step 4: Enrich ITR data with subsystem and system information
    const enrichedITRs = itrs.map(itr => {
      return {
        ...itr,
        subsystemName: subsystem.name,
        systemName: system.name,
        quantity: itr.quantity || 1,
        status: itr.status as "complete" | "inprogress" | "delayed"
      } as ITRWithDetails;
    });

    return enrichedITRs;
  } catch (error) {
    console.error("Error fetching ITRs by subsystem:", error);
    throw error;
  }
};

// Create a new ITR
export const createITR = async (itrData: {
  name: string;
  subsystem_id: string;
  status?: "complete" | "inprogress" | "delayed";
  progress?: number;
  quantity?: number;
  start_date?: string;
  end_date?: string;
  assigned_to?: string;
}) => {
  try {
    // Ensure required fields
    if (!itrData.name || !itrData.subsystem_id) {
      throw new Error('Name and subsystem_id are required fields');
    }

    // Set default values if not provided
    const itrWithDefaults = {
      ...itrData,
      status: itrData.status || 'inprogress',
      progress: itrData.progress || 0,
      quantity: itrData.quantity || 1
    };

    const { data, error } = await supabase
      .from('itrs')
      .insert([itrWithDefaults])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating ITR:", error);
    throw error;
  }
};

// Update an existing ITR
export const updateITR = async (
  itrId: string,
  itrData: {
    name?: string;
    subsystem_id?: string;
    status?: "complete" | "inprogress" | "delayed";
    progress?: number;
    quantity?: number;
    start_date?: string;
    end_date?: string;
    assigned_to?: string;
  }
) => {
  try {
    const { data, error } = await supabase
      .from('itrs')
      .update(itrData)
      .eq('id', itrId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating ITR:", error);
    throw error;
  }
};

// Delete an ITR
export const deleteITR = async (itrId: string) => {
  try {
    const { error } = await supabase
      .from('itrs')
      .delete()
      .eq('id', itrId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting ITR:", error);
    throw error;
  }
};
