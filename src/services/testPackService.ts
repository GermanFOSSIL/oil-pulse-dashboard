
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
  itr_name?: string; // Add optional ITR name field
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

    // Get the ITR name if available
    let itrName = data.itr_asociado;
    try {
      const { data: itrData } = await supabase
        .from('itrs')
        .select('name')
        .eq('id', data.itr_asociado)
        .maybeSingle();
      
      if (itrData?.name) {
        itrName = itrData.name;
      }
    } catch (err) {
      console.log('Error fetching ITR name, using code instead:', err);
    }

    // Ensure estado property is the correct type
    const formattedTestPack: TestPack = {
      ...data,
      itr_name: itrName,
      estado: data.estado as 'pendiente' | 'listo',
      tags: data.tags ? data.tags.map((tag: any) => ({
        ...tag,
        estado: tag.estado as 'pendiente' | 'liberado'
      })) : []
    };

    // Calculate progress
    const totalTags = formattedTestPack.tags ? formattedTestPack.tags.length : 0;
    const releasedTags = formattedTestPack.tags ? formattedTestPack.tags.filter(t => t.estado === 'liberado').length : 0;
    const progress = totalTags > 0 ? Math.round((releasedTags / totalTags) * 100) : 0;
    
    return {
      ...formattedTestPack,
      progress
    };
  } catch (error) {
    console.error(`Error in getTestPackWithTags for ${testPackId}:`, error);
    return null;
  }
};

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

    return {
      ...data,
      estado: data.estado as 'pendiente' | 'liberado'
    };
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

    // Fetch ITR names for all test packs
    const itrIds = [...new Set(data.map((tp: any) => tp.itr_asociado))];
    const itrNamesPromises = itrIds.map(async (itrId) => {
      try {
        const { data: itrData } = await supabase
          .from('itrs')
          .select('id, name')
          .eq('id', itrId)
          .maybeSingle();
        
        return { id: itrId, name: itrData?.name };
      } catch (err) {
        console.log(`Error fetching ITR name for ${itrId}:`, err);
        return { id: itrId, name: null };
      }
    });

    const itrNames = await Promise.all(itrNamesPromises);
    const itrMap = new Map(itrNames.map(itr => [itr.id, itr.name]));

    // Ensure estado property is the correct type and calculate progress
    const formattedTestPacks: TestPack[] = data.map((tp: any) => {
      const formattedTags = tp.tags ? tp.tags.map((tag: any) => ({
        ...tag,
        estado: tag.estado as 'pendiente' | 'liberado'
      })) : [];
      
      const totalTags = formattedTags.length;
      const releasedTags = formattedTags.filter((t: any) => t.estado === 'liberado').length;
      const progress = totalTags > 0 ? Math.round((releasedTags / totalTags) * 100) : 0;
      
      // Add ITR name if found
      const itrName = itrMap.get(tp.itr_asociado);
      
      return {
        ...tp,
        itr_name: itrName || tp.itr_asociado,
        estado: tp.estado as 'pendiente' | 'listo',
        tags: formattedTags,
        progress
      };
    });

    console.log(`Found ${formattedTestPacks.length} test packs`);
    return formattedTestPacks;
  } catch (error) {
    console.error("Error in getTestPacks:", error);
    return [];
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

    // Check if all tags for this test pack are released and update test pack status if needed
    const { data: testPackData } = await supabase
      .from('tags')
      .select('test_pack_id')
      .eq('id', tagId)
      .single();
    
    if (testPackData?.test_pack_id) {
      await updateTestPackStatusBasedOnTags(testPackData.test_pack_id);
    }

    return {
      ...data,
      estado: data.estado as 'pendiente' | 'liberado'
    };
  } catch (error) {
    console.error(`Error in updateTag for ${tagId}:`, error);
    throw error;
  }
};

// Helper function to update test pack status based on its tags
export const updateTestPackStatusBasedOnTags = async (testPackId: string): Promise<void> => {
  try {
    // Get all tags for this test pack
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('estado')
      .eq('test_pack_id', testPackId);
    
    if (tagsError) {
      console.error(`Error fetching tags for test pack ${testPackId}:`, tagsError);
      return;
    }
    
    // Check if all tags are released
    const allTagsReleased = tags.length > 0 && tags.every(tag => tag.estado === 'liberado');
    
    if (allTagsReleased) {
      // Update test pack status to 'listo'
      const { error: updateError } = await supabase
        .from('test_packs')
        .update({ estado: 'listo' })
        .eq('id', testPackId);
      
      if (updateError) {
        console.error(`Error updating test pack ${testPackId} status:`, updateError);
      } else {
        console.log(`Test pack ${testPackId} status updated to 'listo'`);
        
        // Get the ITR name for this test pack to update ITR status
        const { data: testPack } = await supabase
          .from('test_packs')
          .select('itr_asociado')
          .eq('id', testPackId)
          .single();
        
        if (testPack?.itr_asociado) {
          // Import and use the function to update ITR status
          const { updateITRStatusBasedOnTestPacks } = await import('@/services/itrService');
          await updateITRStatusBasedOnTestPacks(testPack.itr_asociado);
        }
      }
    }
  } catch (error) {
    console.error(`Error in updateTestPackStatusBasedOnTags for ${testPackId}:`, error);
  }
};

// Create a new test pack
export const createTestPack = async (
  testPackData: Omit<TestPack, "id" | "created_at" | "updated_at" | "progress" | "tags" | "itr_name">
): Promise<TestPack> => {
  try {
    console.log("Creating test pack with data:", testPackData);
    
    // Ensure estado is the correct type
    const formattedTestPackData = {
      ...testPackData,
      estado: testPackData.estado as 'pendiente' | 'listo'
    };
    
    // Step 1: Create the test pack
    const { data: testPack, error: testPackError } = await supabase
      .from('test_packs')
      .insert(formattedTestPackData)
      .select()
      .single();

    if (testPackError) {
      console.error("Error creating test pack:", testPackError);
      throw testPackError;
    }

    console.log("Test pack created:", testPack);

    return {
      ...testPack,
      estado: testPack.estado as 'pendiente' | 'listo',
      tags: [],
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
    
    // Ensure estado is the correct type if it's being updated
    const formattedUpdates = {
      ...updates,
      estado: updates.estado as 'pendiente' | 'listo'
    };
    
    const { data, error } = await supabase
      .from('test_packs')
      .update(formattedUpdates)
      .eq('id', testPackId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating test pack ${testPackId}:`, error);
      throw error;
    }

    return {
      ...data,
      estado: data.estado as 'pendiente' | 'listo'
    };
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
      ['sistema', 'subsistema', 'nombre_paquete', 'itr_asociado'],
      ['Sistema 1', 'Subsistema 1', 'PACKAGE_LL-SLS-LE-C', 'E19A'],
      ['Sistema 2', 'Subsistema 2', 'PACKAGE_LL-SLS-LE-C', 'E19B'],
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
        estado: 'pendiente' as 'pendiente' | 'listo'
      };

      // Create test pack
      await createTestPack(testPackData);
      importedCount++;
    }

    console.log(`Successfully imported ${importedCount} test packs`);
    return { success: true, count: importedCount };
  } catch (error) {
    console.error("Error importing from Excel:", error);
    throw error;
  }
};

// Export to Excel with detailed TAG information
export const exportToExcel = async (): Promise<ArrayBuffer> => {
  try {
    console.log("Exporting test packs to Excel with detailed TAG information");
    
    // Get all test packs with their tags
    const testPacks = await getTestPacks();
    
    // Get ITR names for the export
    const itrIds = [...new Set(testPacks.map(tp => tp.itr_asociado))];
    const { data: itrData } = await supabase
      .from('itrs')
      .select('id, name')
      .in('id', itrIds);
    
    const itrMap = new Map();
    if (itrData) {
      itrData.forEach((itr: any) => {
        itrMap.set(itr.id, itr.name);
      });
    }
    
    // Prepare data for export - Detailed main sheet with test pack info
    const exportData = testPacks.map(tp => {
      const releasedTags = tp.tags ? tp.tags.filter(t => t.estado === 'liberado').length : 0;
      const totalTags = tp.tags ? tp.tags.length : 0;
      const itrName = itrMap.get(tp.itr_asociado) || tp.itr_asociado;
      
      return {
        'ID': tp.id,
        'Nombre': tp.nombre_paquete,
        'Sistema': tp.sistema,
        'Subsistema': tp.subsistema,
        'ITR Asociado': itrName,
        'ITR ID': tp.itr_asociado,
        'Estado': tp.estado === 'listo' ? 'Listo' : 'Pendiente',
        'Progreso': `${tp.progress || 0}%`,
        'TAGs Liberados': `${releasedTags}/${totalTags}`,
        'Fecha Creación': new Date(tp.created_at).toLocaleString(),
        'Última Actualización': new Date(tp.updated_at).toLocaleString()
      };
    });

    // Prepare detailed tags data - will be a separate sheet
    const tagsData: any[] = [];
    testPacks.forEach(tp => {
      if (tp.tags && tp.tags.length > 0) {
        const itrName = itrMap.get(tp.itr_asociado) || tp.itr_asociado;
        
        tp.tags.forEach(tag => {
          tagsData.push({
            'Test Pack': tp.nombre_paquete,
            'Sistema': tp.sistema,
            'Subsistema': tp.subsistema,
            'ITR Asociado': itrName,
            'ITR ID': tp.itr_asociado,
            'TAG': tag.tag_name,
            'Estado TAG': tag.estado === 'liberado' ? 'Liberado' : 'Pendiente',
            'Fecha Liberación': tag.fecha_liberacion ? new Date(tag.fecha_liberacion).toLocaleString() : 'Pendiente',
            'Fecha Creación': new Date(tag.created_at).toLocaleString()
          });
        });
      }
    });

    // Create a workbook with multiple sheets
    const workbook = XLSX.utils.book_new();
    
    // Add main Test Packs sheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Packs');
    
    // Add detailed Tags sheet
    if (tagsData.length > 0) {
      const tagsWorksheet = XLSX.utils.json_to_sheet(tagsData);
      XLSX.utils.book_append_sheet(workbook, tagsWorksheet, 'TAGs Detalle');
    }

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
      const itrKey = tp.itr_name || tp.itr_asociado;
      acc[itrKey] = (acc[itrKey] || 0) + 1;
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

// Get test packs by ITR name
export const getTestPacksByITR = async (itrName: string): Promise<TestPack[]> => {
  try {
    console.log(`Fetching test packs for ITR: ${itrName}`);
    
    // First try to get the ITR id if itrName is not a UUID
    let itrId = itrName;
    if (!isUUID(itrName)) {
      const { data: itrData } = await supabase
        .from('itrs')
        .select('id')
        .eq('name', itrName)
        .maybeSingle();
      
      if (itrData?.id) {
        itrId = itrData.id;
      }
    }
    
    const { data, error } = await supabase
      .from('test_packs')
      .select(`
        *,
        tags:tags(*)
      `)
      .eq('itr_asociado', itrId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching test packs for ITR ${itrName}:`, error);
      throw error;
    }

    // Format the data
    const formattedTestPacks: TestPack[] = data.map((tp: any) => {
      const formattedTags = tp.tags ? tp.tags.map((tag: any) => ({
        ...tag,
        estado: tag.estado as 'pendiente' | 'liberado'
      })) : [];
      
      const totalTags = formattedTags.length;
      const releasedTags = formattedTags.filter((t: any) => t.estado === 'liberado').length;
      const progress = totalTags > 0 ? Math.round((releasedTags / totalTags) * 100) : 0;
      
      return {
        ...tp,
        itr_name: itrName,
        estado: tp.estado as 'pendiente' | 'listo',
        tags: formattedTags,
        progress
      };
    });

    console.log(`Found ${formattedTestPacks.length} test packs for ITR ${itrName}`);
    return formattedTestPacks;
  } catch (error) {
    console.error(`Error in getTestPacksByITR for ${itrName}:`, error);
    return [];
  }
};

// Helper function to check if a string is a UUID
const isUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};
