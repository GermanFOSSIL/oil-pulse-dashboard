
import type { ITR } from "@/services/types";

// Re-export the ITR type using 'export type' to avoid isolatedModules error
export type { ITR };

export interface ITRWithDetails extends ITR {
  subsystemName?: string;
  systemName?: string;
  projectName?: string;
  id: string;
  name: string;
  subsystem_id: string;
  status: "complete" | "inprogress" | "delayed";
  progress?: number;
  assigned_to?: string;
  start_date?: string;
  end_date?: string;
  quantity: number;
}

export interface ITRWithActions extends ITRWithDetails {
  actions?: {
    canEdit: boolean;
    canDelete: boolean;
  };
}
