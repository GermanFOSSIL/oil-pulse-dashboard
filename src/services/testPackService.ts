
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

// Define the Tag type
export interface Tag {
  id: string;
  tag_name: string;
  test_pack_id: string;
  estado: 'pendiente' | 'liberado';
  fecha_liberacion: string | null;
  created_at: string;
  updated_at: string;
}

// Define the TestPack type
export interface TestPack {
  id: string;
  nombre_paquete: string;
  sistema: string;
  subsistema: string;
  itr_asociado: string;
  itr_name?: string; 
  estado: 'pendiente' | 'listo';
  progress?: number;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

// Define the ActionLog type
export interface ActionLog {
  id: string;
  accion: string;
  tag_id: string;
  usuario_id: string;
  fecha: string;
  tag_name?: string;
  user_name?: string;
}

// Export various service functions organized by feature
export {
  getTestPackWithTags,
  getTestPacks,
  getTestPacksByITR,
  getTestPacksStats
} from "./testPack/testPackQueries";

export {
  createTestPack,
  updateTestPack,
  updateTestPackStatusBasedOnTags,
  deleteTestPack
} from "./testPack/testPackMutations";

export {
  createTag,
  updateTag,
  deleteTag,
  logTagAction
} from "./testPack/tagOperations";

export {
  exportToExcel,
  generateImportTemplate,
  importFromExcel
} from "./testPack/testPackExport";

export {
  getActionLogs
} from "./testPack/testPackLogs";
