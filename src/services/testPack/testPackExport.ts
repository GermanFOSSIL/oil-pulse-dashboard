
import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";

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

// Export to Excel with detailed TAG information
export const exportToExcel = async (): Promise<ArrayBuffer> => {
  try {
    console.log("Exporting test packs to Excel with detailed TAG information");
    
    // Get all test packs with their tags
    const { getTestPacks } = await import('./testPackQueries');
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

// Import from Excel
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
    const { getTestPacks } = await import('./testPackQueries');
    const { createTestPack } = await import('./testPackMutations');
    const { createTag } = await import('./tagOperations');
    
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
