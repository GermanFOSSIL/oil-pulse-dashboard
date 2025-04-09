
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
    
    // Create the main template worksheet with all necessary columns
    const mainWorksheet = XLSX.utils.aoa_to_sheet([
      ['sistema', 'subsistema', 'nombre_paquete', 'itr_asociado', 'estado'],
      ['Sistema 1', 'Subsistema 1', 'PACKAGE_LL-SLS-LE-C', 'E19A', 'pendiente'],
      ['Sistema 2', 'Subsistema 2', 'PACKAGE_LL-SLS-LE-D', 'T09A', 'pendiente'],
    ]);
    
    // Create a workbook and append the main worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, mainWorksheet, 'Test Packs');
    
    // Create a second worksheet for tags examples
    const tagsWorksheet = XLSX.utils.aoa_to_sheet([
      ['test_pack_nombre', 'tag_name', 'estado'],
      ['PACKAGE_LL-SLS-LE-C', 'TAG-001', 'pendiente'],
      ['PACKAGE_LL-SLS-LE-C', 'TAG-002', 'pendiente'],
      ['PACKAGE_LL-SLS-LE-D', 'TAG-003', 'pendiente'],
    ]);
    
    // Add the tags worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, tagsWorksheet, 'TAGs');
    
    // Add an instructions sheet
    const instructionsWorksheet = XLSX.utils.aoa_to_sheet([
      ['Instrucciones para importar Test Packs y TAGs'],
      [''],
      ['1. Hoja "Test Packs": Complete la información de los paquetes de prueba'],
      ['   - sistema: Nombre del sistema (obligatorio)'],
      ['   - subsistema: Nombre del subsistema (obligatorio)'],
      ['   - nombre_paquete: Nombre del test pack (obligatorio)'],
      ['   - itr_asociado: Código o ID del ITR asociado (obligatorio)'],
      ['   - estado: Estado del test pack ("pendiente" o "listo")'],
      [''],
      ['2. Hoja "TAGs": Complete la información de los TAGs asociados a los test packs'],
      ['   - test_pack_nombre: Nombre del test pack al que pertenece el TAG (debe coincidir exactamente con un nombre_paquete de la hoja "Test Packs")'],
      ['   - tag_name: Nombre o identificador del TAG (obligatorio)'],
      ['   - estado: Estado del TAG ("pendiente" o "liberado")'],
      [''],
      ['Notas importantes:'],
      ['- Cada test pack puede tener múltiples TAGs asociados'],
      ['- Los valores en "test_pack_nombre" deben coincidir exactamente con los valores en "nombre_paquete" de la hoja "Test Packs"'],
      ['- No modifique los nombres de las columnas'],
    ]);
    
    // Add the instructions worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, instructionsWorksheet, 'Instrucciones');

    // Generate Excel buffer
    return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  } catch (error) {
    console.error("Error generating import template:", error);
    throw error;
  }
};

// Delete a test pack and all its associated tags
export const deleteTestPack = async (testPackId: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`Starting deletion process for test pack ${testPackId}`);
    
    // Verify the test pack exists before attempting to delete
    const { data: testPackExists, error: existsError } = await supabase
      .from('test_packs')
      .select('id')
      .eq('id', testPackId)
      .maybeSingle();
    
    if (existsError) {
      console.error(`Error checking if test pack ${testPackId} exists:`, existsError);
      return { 
        success: false, 
        message: "Error al verificar si el test pack existe. Por favor, inténtelo de nuevo." 
      };
    }
    
    if (!testPackExists) {
      console.error(`Test pack ${testPackId} not found, cannot delete.`);
      return { 
        success: false, 
        message: "El test pack solicitado no existe o ya ha sido eliminado." 
      };
    }

    // First try to use the new RPC method
    console.log(`Attempting to delete test pack ${testPackId} using RPC function`);
    
    // Call the RPC function to delete test pack and its tags in a transaction
    const { data: rpcResult, error: rpcError } = await (supabase.rpc as any)(
      'delete_test_pack_with_tags',
      { test_pack_id: testPackId }
    );
    
    if (rpcError) {
      console.error(`Error in RPC call to delete test pack ${testPackId}:`, rpcError);
      
      // If RPC fails, fall back to manual deletion
      console.log(`Falling back to manual deletion for test pack ${testPackId}`);
      
      // First delete associated tags
      const { data: tagsData, error: tagsQueryError } = await supabase
        .from('tags')
        .select('id')
        .eq('test_pack_id', testPackId);
        
      if (tagsQueryError) {
        console.error(`Error querying tags for test pack ${testPackId}:`, tagsQueryError);
        return { 
          success: false, 
          message: "Error al buscar TAGs asociados. Por favor, inténtelo de nuevo." 
        };
      }
      
      if (tagsData && tagsData.length > 0) {
        console.log(`Deleting ${tagsData.length} tags associated with test pack ${testPackId}`);
        
        const { error: tagsDeleteError } = await supabase
          .from('tags')
          .delete()
          .eq('test_pack_id', testPackId);
        
        if (tagsDeleteError) {
          console.error(`Error deleting tags for test pack ${testPackId}:`, tagsDeleteError);
          return { 
            success: false, 
            message: "Error al eliminar los TAGs asociados. Por favor, inténtelo de nuevo." 
          };
        }
      }
      
      // Now delete the test pack
      const { error: deleteError } = await supabase
        .from('test_packs')
        .delete()
        .eq('id', testPackId);
      
      if (deleteError) {
        console.error(`Error deleting test pack ${testPackId}:`, deleteError);
        return { 
          success: false, 
          message: "Error al eliminar el test pack. Por favor, inténtelo de nuevo." 
        };
      }
    }
    
    // Verify deletion was successful by checking if the test pack still exists
    const { data: verifyData, error: verifyError } = await supabase
      .from('test_packs')
      .select('id')
      .eq('id', testPackId)
      .maybeSingle();
    
    if (verifyError) {
      console.error(`Error verifying deletion of test pack ${testPackId}:`, verifyError);
      return { 
        success: false, 
        message: "No se pudo verificar si el test pack fue eliminado. Por favor, verifique." 
      };
    }
    
    if (verifyData) {
      console.error(`Test pack ${testPackId} still exists after deletion attempt.`);
      return { 
        success: false, 
        message: "El test pack no se eliminó correctamente. Contacte al administrador." 
      };
    }
    
    console.log(`Test pack ${testPackId} successfully deleted and verified.`);
    return { 
      success: true, 
      message: "Test pack eliminado correctamente." 
    };
  } catch (error) {
    console.error(`Unexpected error in deleteTestPack for ${testPackId}:`, error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Error inesperado al eliminar el test pack." 
    };
  }
};

// Update the importFromExcel function to handle existing test packs
export const importFromExcel = async (excelBuffer: ArrayBuffer): Promise<{ success: boolean; count: number; message?: string }> => {
  try {
    console.log("Importing test packs from Excel");
    
    // Parse Excel file
    const workbook = XLSX.read(excelBuffer, { type: 'array' });
    
    // Get the Test Packs worksheet
    const testPacksSheet = workbook.Sheets[workbook.SheetNames[0]];
    const testPacksData = XLSX.utils.sheet_to_json(testPacksSheet) as any[];

    if (!testPacksData || testPacksData.length === 0) {
      return { success: false, count: 0, message: "No test pack data found in Excel file" };
    }

    console.log(`Found ${testPacksData.length} test packs to import`);
    
    // Check if the TAGs worksheet exists
    let tagsData: any[] = [];
    if (workbook.SheetNames.length > 1) {
      const tagsSheet = workbook.Sheets[workbook.SheetNames[1]];
      if (tagsSheet) {
        tagsData = XLSX.utils.sheet_to_json(tagsSheet) as any[];
        console.log(`Found ${tagsData.length} tags to import`);
      }
    }

    // Get existing test packs to avoid duplicates
    const existingTestPacks = await getTestPacks();
    const existingTestPacksByName = new Map();
    existingTestPacks.forEach(tp => {
      existingTestPacksByName.set(tp.nombre_paquete, tp);
    });

    // Track created or updated items
    let importedCount = 0;
    let tagsAddedCount = 0;
    
    // Process each test pack row
    for (const row of testPacksData) {
      const testPackData = {
        sistema: row.sistema,
        subsistema: row.subsistema,
        nombre_paquete: row.nombre_paquete,
        itr_asociado: row.itr_asociado,
        estado: (row.estado === 'listo' ? 'listo' : 'pendiente') as 'pendiente' | 'listo'
      };

      // Skip rows with missing required data
      if (!testPackData.sistema || !testPackData.subsistema || 
          !testPackData.nombre_paquete || !testPackData.itr_asociado) {
        console.warn("Skipping row with missing required data:", row);
        continue;
      }

      try {
        // Check if the test pack already exists
        let testPack = existingTestPacksByName.get(testPackData.nombre_paquete);
        
        // If it doesn't exist, create it
        if (!testPack) {
          testPack = await createTestPack(testPackData);
          importedCount++;
          existingTestPacksByName.set(testPackData.nombre_paquete, testPack);
          console.log(`Created new test pack: ${testPack.nombre_paquete}`);
        } else {
          console.log(`Using existing test pack: ${testPack.nombre_paquete}`);
        }
        
        // Process tags for this test pack
        if (tagsData && tagsData.length > 0) {
          // Get existing tags for this test pack to avoid duplicates
          const { data: existingTagsData } = await supabase
            .from('tags')
            .select('tag_name')
            .eq('test_pack_id', testPack.id);
          
          const existingTagNames = new Set();
          if (existingTagsData) {
            existingTagsData.forEach((tag: any) => {
              existingTagNames.add(tag.tag_name);
            });
          }
          
          // Filter tags for this test pack
          const testPackTags = tagsData.filter(tag => 
            tag.test_pack_nombre === testPackData.nombre_paquete);
          
          // Create each tag for this test pack if it doesn't already exist
          for (const tagRow of testPackTags) {
            try {
              // Skip if tag already exists for this test pack
              if (existingTagNames.has(tagRow.tag_name)) {
                console.log(`Tag ${tagRow.tag_name} already exists for test pack ${testPack.nombre_paquete}, skipping.`);
                continue;
              }
              
              const tagData = {
                tag_name: tagRow.tag_name,
                test_pack_id: testPack.id,
                estado: (tagRow.estado === 'liberado' ? 'liberado' : 'pendiente') as 'pendiente' | 'liberado',
                fecha_liberacion: tagRow.estado === 'liberado' ? new Date().toISOString() : null
              };
              
              // Skip tags with missing name
              if (!tagData.tag_name) {
                console.warn("Skipping tag with missing name for test pack:", testPackData.nombre_paquete);
                continue;
              }
              
              await createTag(tagData);
              tagsAddedCount++;
              console.log(`Added tag ${tagData.tag_name} to test pack ${testPack.nombre_paquete}`);
            } catch (tagError) {
              console.error("Error creating tag:", tagError);
              // Continue with other tags even if one fails
            }
          }
        }
      } catch (testPackError) {
        console.error("Error processing test pack:", testPackError);
        // Continue with other test packs even if one fails
      }
    }

    const totalImported = importedCount + tagsAddedCount;
    console.log(`Successfully imported ${importedCount} test packs and ${tagsAddedCount} tags`);
    return { 
      success: true, 
      count: totalImported,
      message: `Se crearon ${importedCount} Test Packs y se añadieron ${tagsAddedCount} TAGs`
    };
  } catch (error) {
    console.error("Error importing from Excel:", error);
    return { 
      success: false, 
      count: 0, 
      message: error instanceof Error ? error.message : "Error desconocido en la importación"
    };
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

// Delete a tag
export const deleteTag = async (tagId: string): Promise<void> => {
  try {
    console.log(`Deleting tag ${tagId}`);
    
    // Log the tag deletion action first
    try {
      const { data: tagData } = await supabase
        .from('tags')
        .select('tag_name')
        .eq('id', tagId)
        .single();
      
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id || 'system';
      
      await logTagAction({
        usuario_id: userId,
        tag_id: tagId,
        accion: 'eliminó'
      });
    } catch (err) {
      console.error("Error logging tag deletion:", err);
      // Continue with deletion even if logging fails
    }
    
    // Now delete the tag
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId);

    if (error) {
      console.error(`Error deleting tag ${tagId}:`, error);
      throw error;
    }
    
    console.log(`Tag ${tagId} deleted successfully`);
  } catch (error) {
    console.error(`Error in deleteTag for ${tagId}:`, error);
    throw error;
  }
};
