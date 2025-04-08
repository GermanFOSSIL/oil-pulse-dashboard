
import { supabase } from "@/integrations/supabase/client";
import { Subsystem } from "@/services/types";
import { useAuth } from "@/contexts/AuthContext";

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

  // Log the activity (if user is available)
  try {
    const auth = supabase.auth.getSession();
    const session = await auth;
    const userId = session.data.session?.user.id;
    
    if (userId && data) {
      await logDatabaseActivity({
        table_name: 'subsystems',
        action: 'INSERT',
        user_id: userId,
        record_id: data.id,
        details: { name: data.name }
      });
    }
  } catch (e) {
    console.error("Error logging activity:", e);
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

  // Log the activity (if user is available)
  try {
    const auth = supabase.auth.getSession();
    const session = await auth;
    const userId = session.data.session?.user.id;
    
    if (userId && data) {
      await logDatabaseActivity({
        table_name: 'subsystems',
        action: 'UPDATE',
        user_id: userId,
        record_id: data.id,
        details: { name: data.name, updates: Object.keys(updates).join(', ') }
      });
    }
  } catch (e) {
    console.error("Error logging activity:", e);
  }

  return data as unknown as Subsystem;
};

export const deleteSubsystem = async (id: string): Promise<void> => {
  // Get the subsystem data before deletion for logging purposes
  const { data: subsystem } = await supabase
    .from('subsystems')
    .select('*')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('subsystems')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting subsystem with id ${id}:`, error);
    throw error;
  }

  // Log the activity (if user is available)
  try {
    const auth = supabase.auth.getSession();
    const session = await auth;
    const userId = session.data.session?.user.id;
    
    if (userId && subsystem) {
      await logDatabaseActivity({
        table_name: 'subsystems',
        action: 'DELETE',
        user_id: userId,
        record_id: id,
        details: { name: subsystem.name }
      });
    }
  } catch (e) {
    console.error("Error logging activity:", e);
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

// Helper function to log database activity
interface ActivityLogData {
  table_name: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  user_id: string;
  record_id: string;
  details?: any;
}

export const logDatabaseActivity = async (data: ActivityLogData): Promise<void> => {
  try {
    const { error } = await supabase
      .from('db_activity_log')
      .insert(data);
    
    if (error) {
      console.error("Error logging database activity:", error);
    }
  } catch (e) {
    console.error("Error logging database activity:", e);
  }
};
