
import { ITR } from "@/services/supabaseService";

export interface ITRWithDetails extends ITR {
  subsystemName?: string;
  systemName?: string;
  projectName?: string;
  quantity: number; // Changed from optional to required
}
