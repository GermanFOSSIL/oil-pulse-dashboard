
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

// Type definitions
export interface TestPack {
  id: string;
  sistema: string;
  subsistema: string;
  nombre_paquete: string;
  itr_asociado: string;
  estado: string;
  created_at: string;
  updated_at: string;
  progress?: number; // Optional progress field
}

export interface Tag {
  id: string;
  test_pack_id: string;
  tag_name: string;
  estado: string;
  fecha_liberacion: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccionLog {
  id: string;
  tag_id: string;
  usuario_id: string;
  accion: string;
  fecha: string;
  user_name?: string;
  tag_name?: string;
}

export interface TestPackStats {
  totalTestPacks: number;
  pendingTestPacks: number;
  completedTestPacks: number;
  totalTags: number;
  releasedTags: number;
  pendingTags: number;
  bySystem: {
    system: string;
    count: number;
    completed: number;
  }[];
  bySubsystem: {
    subsystem: string;
    count: number;
    completed: number;
  }[];
  byITR: {
    itr: string;
    count: number;
    completed: number;
  }[];
}

export interface ImportResult {
  testPacks: number;
  tags: number;
}

// Get all test packs
export const getTestPacks = async (): Promise<TestPack[]> => {
  try {
    const { data, error } = await supabase
      .from('test_packs')
      .select('*');

    if (error) {
      console.error("Error fetching test packs:", error);
      throw error;
    }

    // Calculate progress for each test pack
    const testPacks: TestPack[] = await Promise.all(
      data.map(async (testPack) => {
        const { data: tags, error: tagsError } = await supabase
          .from('tags')
          .select('*')
          .eq('test_pack_id', testPack.id);

        if (tagsError) {
          console.error(`Error fetching tags for test pack ${testPack.id}:`, tagsError);
          return { ...testPack, progress: 0 };
        }

        if (tags && tags.length > 0) {
          const releasedTags = tags.filter(tag => tag.estado === 'liberado').length;
          return { ...testPack, progress: Math.round((releasedTags / tags.length) * 100) };
        } else {
          return { ...testPack, progress: 0 };
        }
      })
    );

    return testPacks;
  } catch (error) {
    console.error("Error in getTestPacks:", error);
    throw error;
  }
};

// Get a single test pack with its tags
export const getTestPackWithTags = async (testPackId: string): Promise<TestPack & { tags: Tag[] }> => {
  try {
    const { data, error } = await supabase
      .from('test_packs')
      .select('*')
      .eq('id', testPackId)
      .single();

    if (error) {
      console.error(`Error fetching test pack ${testPackId}:`, error);
      throw error;
    }

    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .eq('test_pack_id', testPackId);

    if (tagsError) {
      console.error(`Error fetching tags for test pack ${testPackId}:`, tagsError);
      throw tagsError;
    }

    const testPack = data as TestPack;
    const releasedTags = tags.filter(tag => tag.estado === 'liberado').length;
    const progress = tags.length > 0 ? Math.round((releasedTags / tags.length) * 100) : 0;

    return {
      ...testPack,
      progress,
      tags: tags as Tag[]
    };
  } catch (error) {
    console.error("Error in getTestPackWithTags:", error);
    throw error;
  }
};

// Create a new test pack
export const createTestPack = async (testPackData: Omit<TestPack, "id" | "created_at" | "updated_at">): Promise<TestPack> => {
  try {
    const { data, error } = await supabase
      .from('test_packs')
      .insert(testPackData)
      .select()
      .single();

    if (error) {
      console.error("Error creating test pack:", error);
      throw error;
    }

    return data as TestPack;
  } catch (error) {
    console.error("Error in createTestPack:", error);
    throw error;
  }
};

// Update a test pack
export const updateTestPack = async (id: string, updates: Partial<TestPack>): Promise<TestPack> => {
  try {
    const { data, error } = await supabase
      .from('test_packs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating test pack ${id}:`, error);
      throw error;
    }

    return data as TestPack;
  } catch (error) {
    console.error("Error in updateTestPack:", error);
    throw error;
  }
};

// Create a new tag
export const createTag = async (tagData: Omit<Tag, "id" | "created_at" | "updated_at">): Promise<Tag> => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .insert(tagData)
      .select()
      .single();

    if (error) {
      console.error("Error creating tag:", error);
      throw error;
    }

    // Log the tag creation action
    await logTagAction({
      usuario_id: 'system', // This should be the current user's ID in a real application
      tag_id: data.id,
      accion: 'creó'
    });

    return data as Tag;
  } catch (error) {
    console.error("Error in createTag:", error);
    throw error;
  }
};

// Update a tag
export const updateTag = async (id: string, updates: Partial<Tag>): Promise<Tag> => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating tag ${id}:`, error);
      throw error;
    }

    // Log the tag update action
    if (updates.estado === 'liberado') {
      await logTagAction({
        usuario_id: 'system', // This should be the current user's ID in a real application
        tag_id: id,
        accion: 'liberó'
      });
    }

    return data as Tag;
  } catch (error) {
    console.error("Error in updateTag:", error);
    throw error;
  }
};

// Log an action performed on a tag
export const logTagAction = async (actionData: { usuario_id: string; tag_id: string; accion: string }): Promise<void> => {
  try {
    const { error } = await supabase
      .from('acciones_log')
      .insert(actionData);

    if (error) {
      console.error("Error logging tag action:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in logTagAction:", error);
  }
};

// Get all action logs
export const getActionLogs = async (): Promise<AccionLog[]> => {
  try {
    const { data: rawLogs, error } = await supabase
      .from('acciones_log')
      .select(`
        *,
        profiles (full_name),
        tags (tag_name)
      `)
      .order('fecha', { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching action logs:", error);
      throw error;
    }

    // Transform the data to match AccionLog interface
    const logs: AccionLog[] = rawLogs.map(log => ({
      id: log.id,
      tag_id: log.tag_id,
      usuario_id: log.usuario_id,
      accion: log.accion,
      fecha: log.fecha,
      user_name: log.profiles?.full_name || 'Usuario desconocido',
      tag_name: log.tags?.tag_name || 'TAG desconocido'
    }));

    return logs;
  } catch (error) {
    console.error("Error in getActionLogs:", error);
    return [];
  }
};

// Get test pack statistics
export const getTestPacksStats = async (): Promise<TestPackStats> => {
  try {
    // Get all test packs
    const { data: testPacks, error: testPacksError } = await supabase
      .from('test_packs')
      .select('*');

    if (testPacksError) {
      console.error("Error fetching test packs for stats:", testPacksError);
      throw testPacksError;
    }

    // Get all tags
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*');

    if (tagsError) {
      console.error("Error fetching tags for stats:", tagsError);
      throw tagsError;
    }

    // Basic stats
    const totalTestPacks = testPacks.length;
    const pendingTestPacks = testPacks.filter(tp => tp.estado === 'pendiente').length;
    const completedTestPacks = testPacks.filter(tp => tp.estado === 'listo').length;
    const totalTags = tags.length;
    const releasedTags = tags.filter(tag => tag.estado === 'liberado').length;
    const pendingTags = totalTags - releasedTags;

    // Group by system
    const systemMap = new Map<string, { count: number; completed: number }>();
    testPacks.forEach(tp => {
      const existing = systemMap.get(tp.sistema) || { count: 0, completed: 0 };
      systemMap.set(tp.sistema, {
        count: existing.count + 1,
        completed: existing.completed + (tp.estado === 'listo' ? 1 : 0)
      });
    });

    // Group by subsystem
    const subsystemMap = new Map<string, { count: number; completed: number }>();
    testPacks.forEach(tp => {
      const existing = subsystemMap.get(tp.subsistema) || { count: 0, completed: 0 };
      subsystemMap.set(tp.subsistema, {
        count: existing.count + 1,
        completed: existing.completed + (tp.estado === 'listo' ? 1 : 0)
      });
    });

    // Group by ITR
    const itrMap = new Map<string, { count: number; completed: number }>();
    testPacks.forEach(tp => {
      const existing = itrMap.get(tp.itr_asociado) || { count: 0, completed: 0 };
      itrMap.set(tp.itr_asociado, {
        count: existing.count + 1,
        completed: existing.completed + (tp.estado === 'listo' ? 1 : 0)
      });
    });

    return {
      totalTestPacks,
      pendingTestPacks,
      completedTestPacks,
      totalTags,
      releasedTags,
      pendingTags,
      bySystem: Array.from(systemMap.entries()).map(([system, stats]) => ({
        system,
        count: stats.count,
        completed: stats.completed
      })),
      bySubsystem: Array.from(subsystemMap.entries()).map(([subsystem, stats]) => ({
        subsystem,
        count: stats.count,
        completed: stats.completed
      })),
      byITR: Array.from(itrMap.entries()).map(([itr, stats]) => ({
        itr,
        count: stats.count,
        completed: stats.completed
      }))
    };
  } catch (error) {
    console.error("Error in getTestPacksStats:", error);
    // Return empty stats object
    return {
      totalTestPacks: 0,
      pendingTestPacks: 0,
      completedTestPacks: 0,
      totalTags: 0,
      releasedTags: 0,
      pendingTags: 0,
      bySystem: [],
      bySubsystem: [],
      byITR: []
    };
  }
};

// Template generation and import/export functions
export const generateImportTemplate = () => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Create data for the template
  const templateData = [
    ['Sistema', 'Subsistema', 'Nombre del Test Pack', 'ITR Asociado', 'TAGs (separados por coma)'],
    ['Sistema 1', 'Subsistema A', 'TP-001', 'ITR-001', 'TAG-001, TAG-002, TAG-003'],
    ['Sistema 2', 'Subsistema B', 'TP-002', 'ITR-002', 'TAG-004, TAG-005']
  ];
  
  // Create a worksheet
  const ws = XLSX.utils.aoa_to_sheet(templateData);
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  
  // Generate buffer
  const wbout = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  return wbout;
};

export const exportToExcel = async () => {
  try {
    // Get all test packs
    const testPacks = await getTestPacks();
    
    // Get all tags for each test pack
    const testPacksWithTags = await Promise.all(
      testPacks.map(async (tp) => {
        const fullTp = await getTestPackWithTags(tp.id);
        return fullTp;
      })
    );
    
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Create data for test packs sheet
    const testPacksData = [
      ['ID', 'Sistema', 'Subsistema', 'Nombre del Test Pack', 'ITR Asociado', 'Estado', 'Progreso', 'Fecha Creación']
    ];
    
    testPacks.forEach(tp => {
      testPacksData.push([
        tp.id,
        tp.sistema,
        tp.subsistema,
        tp.nombre_paquete,
        tp.itr_asociado,
        tp.estado,
        `${tp.progress || 0}%`,
        new Date(tp.created_at).toLocaleString()
      ]);
    });
    
    // Create data for tags sheet
    const tagsData = [
      ['ID', 'Test Pack ID', 'Nombre del TAG', 'Estado', 'Fecha Liberación']
    ];
    
    testPacksWithTags.forEach(tp => {
      tp.tags.forEach(tag => {
        tagsData.push([
          tag.id,
          tag.test_pack_id,
          tag.tag_name,
          tag.estado,
          tag.fecha_liberacion ? new Date(tag.fecha_liberacion).toLocaleString() : 'Pendiente'
        ]);
      });
    });
    
    // Create worksheets
    const wsTestPacks = XLSX.utils.aoa_to_sheet(testPacksData);
    const wsTags = XLSX.utils.aoa_to_sheet(tagsData);
    
    // Add the worksheets to the workbook
    XLSX.utils.book_append_sheet(wb, wsTestPacks, 'Test Packs');
    XLSX.utils.book_append_sheet(wb, wsTags, 'TAGs');
    
    // Generate buffer
    const wbout = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    return wbout;
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw error;
  }
};

// Function to import test packs and tags from Excel file
export const importFromExcel = async (fileBuffer: ArrayBuffer): Promise<ImportResult> => {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<any>(worksheet);
    
    let testPacksCreated = 0;
    let tagsCreated = 0;
    
    // Process each row in the spreadsheet
    for (const row of data) {
      const sistema = row['Sistema'];
      const subsistema = row['Subsistema'];
      const nombre_paquete = row['Nombre del Test Pack'];
      const itr_asociado = row['ITR Asociado'];
      const tagsStr = row['TAGs (separados por coma)'];
      
      if (!sistema || !subsistema || !nombre_paquete || !itr_asociado) {
        console.warn('Skipping row with missing required fields');
        continue;
      }
      
      // Create test pack
      const testPackData = {
        sistema,
        subsistema,
        nombre_paquete,
        itr_asociado,
        estado: 'pendiente'
      };
      
      const { data: newTestPack, error } = await supabase
        .from('test_packs')
        .insert(testPackData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating test pack:', error);
        continue;
      }
      
      testPacksCreated++;
      
      // Process tags if provided
      if (tagsStr) {
        const tagNames = tagsStr.split(',').map(t => t.trim()).filter(t => t);
        
        for (const tagName of tagNames) {
          const tagData = {
            test_pack_id: newTestPack.id,
            tag_name: tagName,
            estado: 'pendiente'
          };
          
          const { error: tagError } = await supabase
            .from('tags')
            .insert(tagData);
          
          if (tagError) {
            console.error(`Error creating tag '${tagName}':`, tagError);
            continue;
          }
          
          tagsCreated++;
        }
      }
    }
    
    return { testPacks: testPacksCreated, tags: tagsCreated };
  } catch (error) {
    console.error('Error importing from Excel:', error);
    throw error;
  }
};
