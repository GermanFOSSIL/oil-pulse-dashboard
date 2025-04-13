
import { supabase } from "@/integrations/supabase/client";

// Define las interfaces para los tipos de ITR
export type StatusType = "complete" | "inprogress" | "delayed";

export interface ITR {
  id: string;
  name: string;
  subsystem_id: string;
  status: StatusType;
  progress?: number;
  quantity: number;
  start_date?: string;
  end_date?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface ITRWithDetails extends ITR {
  subsystemName?: string;
  systemName?: string;
  projectName?: string;
  projectId?: string;
}

// Interface with action handlers for components
export interface ITRWithActions extends ITRWithDetails {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}
