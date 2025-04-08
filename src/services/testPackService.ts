
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

// Create a new tag
export const createTag = async (tagData: Omit<Tag, "id" | "created_at" | "updated_at">): Promise<Tag> => {
  try {
    // Make sure tagData has the fecha_liberacion property
    const completeTagData = {
      ...tagData,
      fecha_liberacion: tagData.fecha_liberacion || null
    };

    const { data, error } = await supabase
      .from('tags')
      .insert(completeTagData)
      .select()
      .single();

    if (error) {
      console.error("Error creating tag:", error);
      throw error;
    }

    // Log the tag creation action
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id || 'system';
      
      await logTagAction({
        usuario_id: userId,
        tag_id: data.id,
        accion: 'creó'
      });
    } catch (err) {
      console.error("Error logging tag action:", err);
      // Don't throw here, just log the error
    }

    return data as Tag;
  } catch (error) {
    console.error("Error in createTag:", error);
    throw error;
  }
};

// Log tag action
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
    // Don't throw here to prevent disrupting the main flow
  }
};

// Get test packs
export const getTestPacks = async (): Promise<TestPack[]> => {
  try {
    console.log("Fetching test packs");
    const { data, error } = await supabase
      .from('test_packs')
      .select(`
        *,
        tags:tags(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching test packs:", error);
      throw error;
    }

    // Calculate progress for each test pack
    const testPacksWithProgress = data.map((tp: any) => {
      const totalTags = tp.tags ? tp.tags.length : 0;
      const releasedTags = tp.tags ? tp.tags.filter((t: any) => t.estado === 'liberado').length : 0;
      const progress = totalTags > 0 ? Math.round((releasedTags / totalTags) * 100) : 0;
      
      return {
        ...tp,
        progress
      };
    });

    console.log(`Found ${testPacksWithProgress.length} test packs`);
    return testPacksWithProgress;
  } catch (error) {
    console.error("Error in getTestPacks:", error);
    return [];
  }
};

// Get a specific test pack with its tags
export const getTestPackWithTags = async (testPackId: string): Promise<TestPack | null> => {
  try {
    console.log(`Fetching test pack ${testPackId} with tags`);
    const { data, error } = await supabase
      .from('test_packs')
      .select(`
        *,
        tags:tags(*)
      `)
      .eq('id', testPackId)
      .single();

    if (error) {
      console.error(`Error fetching test pack ${testPackId}:`, error);
      throw error;
    }

    if (!data) {
      console.log(`No test pack found with id ${testPackId}`);
      return null;
    }

    // Calculate progress
    const totalTags = data.tags ? data.tags.length : 0;
    const releasedTags = data.tags ? data.tags.filter((t: any) => t.estado === 'liberado').length : 0;
    const progress = totalTags > 0 ? Math.round((releasedTags / totalTags) * 100) : 0;
    
    return {
      ...data,
      progress
    };
  } catch (error) {
    console.error(`Error in getTestPackWithTags for ${testPackId}:`, error);
    return null;
  }
};

// Update a tag
export const updateTag = async (tagId: string, updates: Partial<Tag>): Promise<Tag> => {
  try {
    console.log(`Updating tag ${tagId} with data:`, updates);
    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', tagId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating tag ${tagId}:`, error);
      throw error;
    }

    // Log the tag update action
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id || 'system';
      const action = updates.estado === 'liberado' ? 'liberó' : 'actualizó';
      
      await logTagAction({
        usuario_id: userId,
        tag_id: tagId,
        accion: action
      });
    } catch (err) {
      console.error("Error logging tag action:", err);
      // Don't throw here, just log the error
    }

    return data as Tag;
  } catch (error) {
    console.error(`Error in updateTag for ${tagId}:`, error);
    throw error;
  }
};

// Create a new test pack
export const createTestPack = async (
  testPackData: Omit<TestPack, "id" | "created_at" | "updated_at" | "progress" | "tags">, 
  tagsCount: number
): Promise<TestPack> => {
  try {
    console.log("Creating test pack with data:", testPackData);
    
    // Step 1: Create the test pack
    const { data: testPack, error: testPackError } = await supabase
      .from('test_packs')
      .insert(testPackData)
      .select()
      .single();

    if (testPackError) {
      console.error("Error creating test pack:", testPackError);
      throw testPackError;
    }

    console.log("Test pack created:", testPack);

    // Step 2: Create tags for this test pack
    const tagsToCreate = Array.from({ length: tagsCount }).map((_, index) => ({
      tag_name: `TAG-${testPack.nombre_paquete.substring(0, 5)}-${String(index + 1).padStart(3, '0')}`,
      test_pack_id: testPack.id,
      estado: 'pendiente',
      fecha_liberacion: null
    }));

    console.log(`Creating ${tagsToCreate.length} tags for test pack ${testPack.id}`);
    
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .insert(tagsToCreate)
      .select();

    if (tagsError) {
      console.error("Error creating tags:", tagsError);
      // We could handle this better, but for now we'll just log the error
    }

    console.log(`Created ${tags?.length || 0} tags for test pack ${testPack.id}`);

    return {
      ...testPack,
      tags: tags || [],
      progress: 0
    };
  } catch (error) {
    console.error("Error in createTestPack:", error);
    throw error;
  }
};

// Update a test pack
export const updateTestPack = async (testPackId: string, updates: Partial<TestPack>): Promise<TestPack> => {
  try {
    console.log(`Updating test pack ${testPackId} with:`, updates);
    const { data, error } = await supabase
      .from('test_packs')
      .update(updates)
      .eq('id', testPackId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating test pack ${testPackId}:`, error);
      throw error;
    }

    return data as TestPack;
  } catch (error) {
    console.error(`Error in updateTestPack for ${testPackId}:`, error);
    throw error;
  }
};

// Get action logs
export const getActionLogs = async (): Promise<ActionLog[]> => {
  try {
    console.log("Fetching action logs");
    const { data, error } = await supabase
      .from('acciones_log')
      .select(`
        *,
        tags:tags(tag_name),
        profiles:profiles(full_name)
      `)
      .order('fecha', { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching action logs:", error);
      throw error;
    }

    // Format the data to include user and tag names
    const formattedLogs = data.map((log: any) => ({
      ...log,
      tag_name: log.tags?.tag_name || 'Unknown TAG',
      user_name: log.profiles?.full_name || 'Unknown User'
    }));

    return formattedLogs;
  } catch (error) {
    console.error("Error in getActionLogs:", error);
    return [];
  }
};

// Generate import template
export const generateImportTemplate = (): ArrayBuffer => {
  try {
    console.log("Generating test pack import template");
    
    // Create a template worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['sistema', 'subsistema', 'nombre_paquete', 'itr_asociado', 'tags_count'],
      ['Sistema 1', 'Subsistema 1', 'Test Pack 001', 'ITR-001', 10],
      ['Sistema 2', 'Subsistema 2', 'Test Pack 002', 'ITR-002', 15],
    ]);

    // Create a workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    // Generate Excel buffer
    return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  } catch (error) {
    console.error("Error generating import template:", error);
    throw error;
  }
};

// Import from Excel
export const importFromExcel = async (excelBuffer: ArrayBuffer): Promise<{ success: boolean; count: number }> => {
  try {
    console.log("Importing test packs from Excel");
    
    // Parse Excel file
    const workbook = XLSX.read(excelBuffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet) as any[];

    if (!data || data.length === 0) {
      throw new Error("No data found in Excel file");
    }

    console.log(`Found ${data.length} test packs to import`);

    // Process each row
    let importedCount = 0;
    for (const row of data) {
      const testPackData = {
        sistema: row.sistema,
        subsistema: row.subsistema,
        nombre_paquete: row.nombre_paquete,
        itr_asociado: row.itr_asociado,
        estado: 'pendiente'
      };

      // Create test pack with tags
      await createTestPack(testPackData, Number(row.tags_count) || 10);
      importedCount++;
    }

    console.log(`Successfully imported ${importedCount} test packs`);
    return { success: true, count: importedCount };
  } catch (error) {
    console.error("Error importing from Excel:", error);
    throw error;
  }
};

// Export to Excel
export const exportToExcel = async (): Promise<ArrayBuffer> => {
  try {
    console.log("Exporting test packs to Excel");
    
    // Get all test packs with their tags
    const testPacks = await getTestPacks();
    
    // Prepare data for export
    const exportData = testPacks.map(tp => {
      const releasedTags = tp.tags ? tp.tags.filter(t => t.estado === 'liberado').length : 0;
      const totalTags = tp.tags ? tp.tags.length : 0;
      
      return {
        'Nombre': tp.nombre_paquete,
        'Sistema': tp.sistema,
        'Subsistema': tp.subsistema,
        'ITR Asociado': tp.itr_asociado,
        'Estado': tp.estado === 'listo' ? 'Listo' : 'Pendiente',
        'Progreso': `${tp.progress || 0}%`,
        'TAGs Liberados': `${releasedTags}/${totalTags}`,
        'Fecha Creación': new Date(tp.created_at).toLocaleString(),
        'Última Actualización': new Date(tp.updated_at).toLocaleString()
      };
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Packs');

    // Generate Excel buffer
    return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw error;
  }
};

// Get test packs stats
export const getTestPacksStats = async () => {
  try {
    console.log("Fetching test packs stats");
    
    // Get all test packs with their tags
    const testPacks = await getTestPacks();
    
    // Calculate test packs stats
    const totalTestPacks = testPacks.length;
    const completedTestPacks = testPacks.filter(tp => tp.estado === 'listo').length;
    const testPacksProgress = totalTestPacks > 0 
      ? Math.round((completedTestPacks / totalTestPacks) * 100) 
      : 0;
    
    // Calculate tags stats
    let totalTags = 0;
    let releasedTags = 0;
    
    testPacks.forEach(tp => {
      if (tp.tags) {
        totalTags += tp.tags.length;
        releasedTags += tp.tags.filter(t => t.estado === 'liberado').length;
      }
    });
    
    const tagsProgress = totalTags > 0 
      ? Math.round((releasedTags / totalTags) * 100) 
      : 0;
    
    // Calculate system distribution
    const systemCounts = testPacks.reduce((acc: Record<string, number>, tp) => {
      acc[tp.sistema] = (acc[tp.sistema] || 0) + 1;
      return acc;
    }, {});
    
    const systems = Object.entries(systemCounts).map(([name, count]) => ({
      name,
      value: count
    }));
    
    // Calculate subsystem distribution
    const subsystemCounts = testPacks.reduce((acc: Record<string, number>, tp) => {
      acc[tp.subsistema] = (acc[tp.subsistema] || 0) + 1;
      return acc;
    }, {});
    
    const subsystems = Object.entries(subsystemCounts).map(([name, count]) => ({
      name,
      value: count
    }));
    
    // Calculate ITR distribution
    const itrCounts = testPacks.reduce((acc: Record<string, number>, tp) => {
      acc[tp.itr_asociado] = (acc[tp.itr_asociado] || 0) + 1;
      return acc;
    }, {});
    
    const itrs = Object.entries(itrCounts).map(([name, count]) => ({
      name,
      value: count
    }));
    
    return {
      testPacks: {
        total: totalTestPacks,
        completed: completedTestPacks,
        progress: testPacksProgress
      },
      tags: {
        total: totalTags,
        released: releasedTags,
        progress: tagsProgress
      },
      systems,
      subsystems,
      itrs
    };
  } catch (error) {
    console.error("Error in getTestPacksStats:", error);
    return {
      testPacks: { total: 0, completed: 0, progress: 0 },
      tags: { total: 0, released: 0, progress: 0 },
      systems: [],
      subsystems: [],
      itrs: []
    };
  }
};

// Add Tag type to types.ts
export const addTagType = () => {
  // This function doesn't do anything, it's just to show that we need to add Tag type
};
