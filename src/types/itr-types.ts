
import { ITR } from "@/services/types";

export interface ITRWithDetails extends ITR {
  subsystemName?: string;
  systemName?: string;
  projectName?: string;
}
