
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import { getUserProfile } from "./userService";

export type TestPack = {
  id: string;
  sistema: string;
  subsistema: string;
  nombre_paquete: string;
  itr_asociado: string;
  estado: 'pendiente' | 'listo';
  created_at: string;
  updated_at: string;
  tags?: Tag[];
  progress?: number;
};

export type Tag = {
  id: string;
  test_pack_id: string;
  tag_name: string;
  estado: 'pendiente' | 'liberado';
  fecha_liberacion: string | null;
  created_at: string;
  updated_at: string;
};

export type AccionLog = {
  id: string;
  usuario_id: string;
  tag_id: string;
  accion: string;
  fecha: string;
  user_name?: string;
  tag_name?: string;
};

// Obtain all test packs
export const getTestPacks = async (): Promise<TestPack[]> => {
  try {
    console.log("Fetching test packs");
    const { data, error } = await supabase
      .from('test_packs')
      .select('*');

    if (error) {
      console.error("Error fetching test packs:", error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} test packs`);
    return data as TestPack[] || [];
  } catch (error) {
    console.error("Error in getTestPacks:", error);
    throw error;
  }
};

// Get a single test pack by ID with related tags
export const getTestPackWithTags = async (id: string): Promise<TestPack | null> => {
  try {
    console.log(`Fetching test pack with ID: ${id}`);
    
    // First get the test pack
    const { data: testPack, error: testPackError } = await supabase
      .from('test_packs')
      .select('*')
      .eq('id', id)
      .single();
      
    if (testPackError) {
      console.error(`Error fetching test pack with ID ${id}:`, testPackError);
      throw testPackError;
    }
    
    if (!testPack) {
      return null;
    }
    
    // Then get the tags
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .eq('test_pack_id', id);
      
    if (tagsError) {
      console.error(`Error fetching tags for test pack ${id}:`, tagsError);
      throw tagsError;
    }
    
    // Calculate progress based on tags
    const result = {
      ...testPack,
      tags: tags || []
    } as TestPack;
    
    if (tags && tags.length > 0) {
      const totalTags = tags.length;
      const releasedTags = tags.filter(tag => tag.estado === 'liberado').length;
      result.progress = totalTags > 0 ? Math.round((releasedTags / totalTags) * 100) : 0;
    } else {
      result.progress = 0;
    }

    console.log(`Fetched test pack with ${tags?.length || 0} tags`);
    return result;
  } catch (error) {
    console.error("Error in getTestPackWithTags:", error);
    throw error;
  }
};

// Create a new test pack
export const createTestPack = async (testPack: Omit<TestPack, 'id' | 'created_at' | 'updated_at'>): Promise<TestPack> => {
  try {
    console.log("Creating new test pack:", testPack);
    const { data, error } = await supabase
      .from('test_packs')
      .insert(testPack)
      .select()
      .single();

    if (error) {
      console.error("Error creating test pack:", error);
      throw error;
    }

    console.log("Created test pack:", data);
    return data as TestPack;
  } catch (error) {
    console.error("Error in createTestPack:", error);
    throw error;
  }
};

// Update a test pack
export const updateTestPack = async (id: string, updates: Partial<TestPack>): Promise<TestPack> => {
  try {
    console.log(`Updating test pack with ID ${id}:`, updates);
    const { data, error } = await supabase
      .from('test_packs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating test pack with ID ${id}:`, error);
      throw error;
    }

    console.log("Updated test pack:", data);
    return data as TestPack;
  } catch (error) {
    console.error("Error in updateTestPack:", error);
    throw error;
  }
};

// Delete a test pack
export const deleteTestPack = async (id: string): Promise<void> => {
  try {
    console.log(`Deleting test pack with ID ${id}`);
    const { error } = await supabase
      .from('test_packs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting test pack with ID ${id}:`, error);
      throw error;
    }

    console.log(`Deleted test pack with ID ${id}`);
  } catch (error) {
    console.error("Error in deleteTestPack:", error);
    throw error;
  }
};

// Create a tag
export const createTag = async (tag: Omit<Tag, 'id' | 'created_at' | 'updated_at'>): Promise<Tag> => {
  try {
    console.log("Creating new tag:", tag);
    const { data, error } = await supabase
      .from('tags')
      .insert(tag)
      .select()
      .single();

    if (error) {
      console.error("Error creating tag:", error);
      throw error;
    }

    console.log("Created tag:", data);
    return data as Tag;
  } catch (error) {
    console.error("Error in createTag:", error);
    throw error;
  }
};

// Get all tags for a test pack
export const getTagsByTestPackId = async (testPackId: string): Promise<Tag[]> => {
  try {
    console.log(`Fetching tags for test pack with ID: ${testPackId}`);
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('test_pack_id', testPackId);

    if (error) {
      console.error(`Error fetching tags for test pack with ID ${testPackId}:`, error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} tags`);
    return data as Tag[] || [];
  } catch (error) {
    console.error("Error in getTagsByTestPackId:", error);
    throw error;
  }
};

// Update a tag
export const updateTag = async (id: string, updates: Partial<Tag>): Promise<Tag> => {
  try {
    console.log(`Updating tag with ID ${id}:`, updates);
    
    // If updating to released status, add release date
    if (updates.estado === 'liberado' && !updates.fecha_liberacion) {
      updates.fecha_liberacion = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating tag with ID ${id}:`, error);
      throw error;
    }

    console.log("Updated tag:", data);
    
    // Log the action if tag was released
    if (updates.estado === 'liberado') {
      const { data: user } = await supabase.auth.getUser();
      if (user?.user) {
        const logData = {
          usuario_id: user.user.id,
          tag_id: id,
          accion: 'Liberado'
        };
        
        const { error: logError } = await supabase
          .from('acciones_log')
          .insert(logData);
          
        if (logError) {
          console.error("Error logging tag action:", logError);
        } else {
          console.log("Logged tag action:", logData);
        }
      }
    }
    
    return data as Tag;
  } catch (error) {
    console.error("Error in updateTag:", error);
    throw error;
  }
};

// Delete a tag
export const deleteTag = async (id: string): Promise<void> => {
  try {
    console.log(`Deleting tag with ID ${id}`);
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting tag with ID ${id}:`, error);
      throw error;
    }

    console.log(`Deleted tag with ID ${id}`);
  } catch (error) {
    console.error("Error in deleteTag:", error);
    throw error;
  }
};

// Get action logs
export const getActionLogs = async (): Promise<AccionLog[]> => {
  try {
    console.log("Fetching action logs");
    const { data, error } = await supabase
      .from('acciones_log')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) {
      console.error("Error fetching action logs:", error);
      throw error;
    }

    // Enrich logs with user and tag information
    const enrichedLogs = await Promise.all((data || []).map(async (log: any) => {
      try {
        // Get user information
        const profile = log.usuario_id ? await getUserProfile(log.usuario_id) : null;
        
        // Get tag information
        const { data: tagData } = await supabase
          .from('tags')
          .select('tag_name')
          .eq('id', log.tag_id)
          .maybeSingle();
          
        return {
          ...log,
          user_name: profile?.full_name || "Usuario desconocido",
          tag_name: tagData?.tag_name || "TAG desconocido"
        };
      } catch (error) {
        console.error("Error enriching action log:", error);
        return {
          ...log,
          user_name: "Usuario desconocido",
          tag_name: "TAG desconocido"
        };
      }
    }));

    console.log(`Fetched ${enrichedLogs.length} action logs`);
    return enrichedLogs as AccionLog[];
  } catch (error) {
    console.error("Error in getActionLogs:", error);
    throw error;
  }
};

// Import test packs and tags from Excel
export const importFromExcel = async (excelData: ArrayBuffer): Promise<{ testPacks: number; tags: number }> => {
  try {
    console.log("Importing test packs and tags from Excel");
    const workbook = XLSX.read(excelData, { type: 'array' });
    console.log("Available worksheets:", workbook.SheetNames);
    
    let testPacksCount = 0;
    let tagsCount = 0;
    
    // Process Test Packs
    if (workbook.SheetNames.includes('TestPacks')) {
      const testPacksSheet = workbook.Sheets['TestPacks'];
      const testPacksData = XLSX.utils.sheet_to_json(testPacksSheet);
      console.log(`Found ${testPacksData.length} test packs in Excel`);
      
      for (const row of testPacksData) {
        const testPack = row as any;
        if (testPack.sistema && testPack.subsistema && testPack.nombre_paquete && testPack.itr_asociado) {
          const { data, error } = await supabase
            .from('test_packs')
            .insert({
              sistema: testPack.sistema,
              subsistema: testPack.subsistema,
              nombre_paquete: testPack.nombre_paquete,
              itr_asociado: testPack.itr_asociado,
              estado: testPack.estado || 'pendiente'
            })
            .select();
          
          if (error) {
            console.error(`Error inserting test pack ${testPack.nombre_paquete}:`, error);
          } else {
            testPacksCount++;
            console.log(`Inserted test pack: ${testPack.nombre_paquete}`);
            
            // If the test pack has tags, process them
            if (testPack.tags && Array.isArray(testPack.tags) && data?.[0]?.id) {
              for (const tagName of testPack.tags) {
                const { error: tagError } = await supabase
                  .from('tags')
                  .insert({
                    test_pack_id: data[0].id,
                    tag_name: tagName,
                    estado: 'pendiente'
                  });
                
                if (tagError) {
                  console.error(`Error inserting tag ${tagName}:`, tagError);
                } else {
                  tagsCount++;
                  console.log(`Inserted tag: ${tagName}`);
                }
              }
            }
          }
        }
      }
    }
    
    // Process Tags
    if (workbook.SheetNames.includes('Tags')) {
      const tagsSheet = workbook.Sheets['Tags'];
      const tagsData = XLSX.utils.sheet_to_json(tagsSheet);
      console.log(`Found ${tagsData.length} tags in Excel`);
      
      for (const row of tagsData) {
        const tag = row as any;
        if (tag.test_pack_id && tag.tag_name) {
          const { error } = await supabase
            .from('tags')
            .insert({
              test_pack_id: tag.test_pack_id,
              tag_name: tag.tag_name,
              estado: tag.estado || 'pendiente',
              fecha_liberacion: tag.fecha_liberacion || null
            });
          
          if (error) {
            console.error(`Error inserting tag ${tag.tag_name}:`, error);
          } else {
            tagsCount++;
            console.log(`Inserted tag: ${tag.tag_name}`);
          }
        }
      }
    }
    
    console.log(`Import completed: ${testPacksCount} test packs and ${tagsCount} tags inserted`);
    return { testPacks: testPacksCount, tags: tagsCount };
  } catch (error) {
    console.error("Error importing from Excel:", error);
    throw error;
  }
};

// Generate an Excel template for data import
export const generateImportTemplate = (): ArrayBuffer => {
  try {
    console.log("Generating import template");
    const workbook = XLSX.utils.book_new();
    
    // TestPacks sheet
    const testPacksData = [
      ['sistema', 'subsistema', 'nombre_paquete', 'itr_asociado', 'estado'],
      ['Sistema Ejemplo', 'Subsistema Ejemplo', 'Paquete de Prueba 1', 'ITR-001', 'pendiente'],
      ['Sistema Ejemplo', 'Subsistema Ejemplo', 'Paquete de Prueba 2', 'ITR-002', 'pendiente']
    ];
    const testPacksSheet = XLSX.utils.aoa_to_sheet(testPacksData);
    XLSX.utils.book_append_sheet(workbook, testPacksSheet, 'TestPacks');
    
    // Tags sheet
    const tagsData = [
      ['test_pack_id', 'tag_name', 'estado', 'fecha_liberacion'],
      ['ID_DEL_TEST_PACK', 'TAG-001', 'pendiente', ''],
      ['ID_DEL_TEST_PACK', 'TAG-002', 'pendiente', ''],
      ['ID_DEL_TEST_PACK', 'TAG-003', 'pendiente', '']
    ];
    const tagsSheet = XLSX.utils.aoa_to_sheet(tagsData);
    XLSX.utils.book_append_sheet(workbook, tagsSheet, 'Tags');
    
    // Generate the Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    console.log("Template generated successfully");
    return excelBuffer;
  } catch (error) {
    console.error("Error generating import template:", error);
    throw error;
  }
};

// Export test packs and tags data to Excel
export const exportToExcel = async (): Promise<ArrayBuffer> => {
  try {
    console.log("Exporting test packs and tags data to Excel");
    
    // Get all test packs with tags
    const { data: testPacks, error: testPacksError } = await supabase
      .from('test_packs')
      .select('*');
      
    if (testPacksError) {
      console.error("Error fetching test packs for export:", testPacksError);
      throw testPacksError;
    }
    
    // Get all tags
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*');
      
    if (tagsError) {
      console.error("Error fetching tags for export:", tagsError);
      throw tagsError;
    }
    
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // TestPacks sheet
    const testPacksData = [
      ['ID', 'Sistema', 'Subsistema', 'Nombre del Paquete', 'ITR Asociado', 'Estado', 'Fecha de Creación', 'Última Actualización']
    ];
    
    testPacks?.forEach(pack => {
      testPacksData.push([
        pack.id,
        pack.sistema,
        pack.subsistema,
        pack.nombre_paquete,
        pack.itr_asociado,
        pack.estado,
        pack.created_at,
        pack.updated_at
      ]);
    });
    
    const testPacksSheet = XLSX.utils.aoa_to_sheet(testPacksData);
    XLSX.utils.book_append_sheet(workbook, testPacksSheet, 'Test Packs');
    
    // Tags sheet
    const tagsData = [
      ['ID', 'Test Pack ID', 'Nombre del TAG', 'Estado', 'Fecha de Liberación', 'Fecha de Creación', 'Última Actualización']
    ];
    
    tags?.forEach(tag => {
      tagsData.push([
        tag.id,
        tag.test_pack_id,
        tag.tag_name,
        tag.estado,
        tag.fecha_liberacion || 'N/A',
        tag.created_at,
        tag.updated_at
      ]);
    });
    
    const tagsSheet = XLSX.utils.aoa_to_sheet(tagsData);
    XLSX.utils.book_append_sheet(workbook, tagsSheet, 'TAGs');
    
    // Progress by System/Subsystem sheet
    const systemData: Record<string, { total: number; released: number }> = {};
    const subsystemData: Record<string, { total: number; released: number }> = {};
    
    // Calculate progress data
    testPacks?.forEach(pack => {
      const packTags = tags?.filter(tag => tag.test_pack_id === pack.id) || [];
      const totalTags = packTags.length;
      const releasedTags = packTags.filter(tag => tag.estado === 'liberado').length;
      
      // System progress
      if (!systemData[pack.sistema]) {
        systemData[pack.sistema] = { total: 0, released: 0 };
      }
      systemData[pack.sistema].total += totalTags;
      systemData[pack.sistema].released += releasedTags;
      
      // Subsystem progress
      const subsystemKey = `${pack.sistema}:${pack.subsistema}`;
      if (!subsystemData[subsystemKey]) {
        subsystemData[subsystemKey] = { total: 0, released: 0 };
      }
      subsystemData[subsystemKey].total += totalTags;
      subsystemData[subsystemKey].released += releasedTags;
    });
    
    // Prepare progress data for Excel
    const progressData = [
      ['Nivel', 'Nombre', 'TAGs Totales', 'TAGs Liberados', 'Progreso (%)']
    ];
    
    Object.entries(systemData).forEach(([system, data]) => {
      const progress = data.total > 0 ? Math.round((data.released / data.total) * 100) : 0;
      progressData.push(['Sistema', system, data.total.toString(), data.released.toString(), progress.toString()]);
    });
    
    Object.entries(subsystemData).forEach(([key, data]) => {
      const [system, subsystem] = key.split(':');
      const progress = data.total > 0 ? Math.round((data.released / data.total) * 100) : 0;
      progressData.push(['Subsistema', `${system} - ${subsystem}`, data.total.toString(), data.released.toString(), progress.toString()]);
    });
    
    const progressSheet = XLSX.utils.aoa_to_sheet(progressData);
    XLSX.utils.book_append_sheet(workbook, progressSheet, 'Progreso');
    
    // Generate the Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    console.log("Export completed successfully");
    return excelBuffer;
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw error;
  }
};

// Get test pack progress statistics
export const getTestPacksStats = async (): Promise<any> => {
  try {
    console.log("Fetching test packs statistics");
    
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
    
    // Calculate statistics
    const totalTestPacks = testPacks?.length || 0;
    const completedTestPacks = testPacks?.filter(pack => pack.estado === 'listo').length || 0;
    
    const systemStats: Record<string, { total: number; completed: number }> = {};
    const subsystemStats: Record<string, { total: number; completed: number }> = {};
    const itrStats: Record<string, { total: number; completed: number }> = {};
    
    testPacks?.forEach(pack => {
      // System stats
      if (!systemStats[pack.sistema]) {
        systemStats[pack.sistema] = { total: 0, completed: 0 };
      }
      systemStats[pack.sistema].total++;
      if (pack.estado === 'listo') {
        systemStats[pack.sistema].completed++;
      }
      
      // Subsystem stats
      const subsystemKey = `${pack.sistema}:${pack.subsistema}`;
      if (!subsystemStats[subsystemKey]) {
        subsystemStats[subsystemKey] = { total: 0, completed: 0 };
      }
      subsystemStats[subsystemKey].total++;
      if (pack.estado === 'listo') {
        subsystemStats[subsystemKey].completed++;
      }
      
      // ITR stats
      if (!itrStats[pack.itr_asociado]) {
        itrStats[pack.itr_asociado] = { total: 0, completed: 0 };
      }
      itrStats[pack.itr_asociado].total++;
      if (pack.estado === 'listo') {
        itrStats[pack.itr_asociado].completed++;
      }
    });
    
    // Calculate tag statistics
    const totalTags = tags?.length || 0;
    const releasedTags = tags?.filter(tag => tag.estado === 'liberado').length || 0;
    
    // Prepare statistics object
    const stats = {
      testPacks: {
        total: totalTestPacks,
        completed: completedTestPacks,
        progress: totalTestPacks > 0 ? Math.round((completedTestPacks / totalTestPacks) * 100) : 0
      },
      tags: {
        total: totalTags,
        released: releasedTags,
        progress: totalTags > 0 ? Math.round((releasedTags / totalTags) * 100) : 0
      },
      systems: Object.entries(systemStats).map(([system, data]) => ({
        name: system,
        total: data.total,
        completed: data.completed,
        progress: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
      })),
      subsystems: Object.entries(subsystemStats).map(([key, data]) => {
        const [system, subsystem] = key.split(':');
        return {
          system,
          name: subsystem,
          total: data.total,
          completed: data.completed,
          progress: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
        };
      }),
      itrs: Object.entries(itrStats).map(([itr, data]) => ({
        name: itr,
        total: data.total,
        completed: data.completed,
        progress: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
      }))
    };
    
    console.log("Statistics calculated successfully");
    return stats;
  } catch (error) {
    console.error("Error calculating test packs statistics:", error);
    throw error;
  }
};
