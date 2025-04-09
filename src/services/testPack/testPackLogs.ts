
import { supabase } from "@/integrations/supabase/client";
import { ActionLog } from "../testPackService";

// Get action logs
export const getActionLogs = async (): Promise<ActionLog[]> => {
  try {
    console.log("Fetching action logs");
    const { data, error } = await supabase
      .from('acciones_log')
      .select(`
        *,
        tags:tags(tag_name),
        profiles:profiles(full_name)
      `)
      .order('fecha', { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching action logs:", error);
      throw error;
    }

    // Format the data to include user and tag names
    const formattedLogs = data.map((log: any) => ({
      ...log,
      tag_name: log.tags?.tag_name || 'Unknown TAG',
      user_name: log.profiles?.full_name || 'Unknown User'
    }));

    return formattedLogs;
  } catch (error) {
    console.error("Error in getActionLogs:", error);
    return [];
  }
};
