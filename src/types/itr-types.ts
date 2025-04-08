
import { ITR } from "@/services/supabaseService";

export interface ITRWithDetails extends ITR {
  subsystemName?: string;
  systemName?: string;
  projectName?: string;
  quantity?: number; // Nueva propiedad para la cantidad de ITRs
}
