
import { ITR } from "@/services/supabaseService";

// Re-export the ITR type
export { ITR };

export interface ITRWithDetails extends ITR {
  subsystemName?: string;
  systemName?: string;
  projectName?: string;
  quantity: number; // Changed from optional to required
}
