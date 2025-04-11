
import type { ITR } from "@/services/supabaseService";

// Re-export the ITR type using 'export type' to avoid isolatedModules error
export type { ITR };

export interface ITRWithDetails extends ITR {
  subsystemName?: string;
  systemName?: string;
  projectName?: string;
  quantity: number; // Changed from optional to required
}
