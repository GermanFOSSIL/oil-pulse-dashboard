
export type StatusType = "complete" | "inprogress" | "delayed";

export interface ITR {
  id: string;
  name: string;
  subsystem_id: string;
  status: StatusType;
  progress: number;
  quantity: number;
  start_date: string | null;
  end_date: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface ITRWithDetails extends Omit<ITR, 'progress'> {
  progress: number; // Making it required with the same type
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
