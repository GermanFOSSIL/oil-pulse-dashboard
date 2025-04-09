import { supabase } from "@/integrations/supabase/client";
import { Tag, TestPack, AccionesLog, StatsData } from "./types";

export const getTestPacks = async (): Promise<TestPack[]> => {
  try {
    console.log("Fetching all Test Packs");
    const { data, error } = await supabase
      .from('test_packs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching Test Packs:", error);
      throw error;
    }

    console.log(`Retrieved ${data?.length || 0} Test Packs`);
    return (data || []) as TestPack[];
  } catch (error) {
    console.error("Error in getTestPacks:", error);
    throw error;
  }
};

export const getTestPackById = async (id: string): Promise<TestPack | null> => {
  try {
    console.log(`Fetching Test Pack with id ${id}`);
    const { data, error } = await supabase
      .from('test_packs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching Test Pack with id ${id}:`, error);
      throw error;
    }

    if (!data) {
      console.log(`No Test Pack found with id ${id}`);
      return null;
    }

    console.log(`Retrieved Test Pack: ${data.nombre_paquete}`);
    return data as TestPack;
  } catch (error) {
    console.error("Error in getTestPackById:", error);
    throw error;
  }
};

export const createTestPack = async (testPack: Omit<TestPack, "id" | "created_at" | "updated_at">): Promise<TestPack> => {
  try {
    console.log("Creating new Test Pack:", testPack);
    const { data, error } = await supabase
      .from('test_packs')
      .insert(testPack)
      .select()
      .single();

    if (error) {
      console.error("Error creating Test Pack:", error);
      throw error;
    }

    console.log("Test Pack created successfully:", data);
    
    // Log the activity
    await supabase.from('db_activity_log').insert({
      table_name: 'test_packs',
      action: 'INSERT',
      record_id: data.id,
      details: { name: data.nombre_paquete }
    });

    return data as TestPack;
  } catch (error) {
    console.error("Error in createTestPack:", error);
    throw error;
  }
};

export const updateTestPack = async (id: string, updates: Partial<TestPack>): Promise<TestPack> => {
  try {
    console.log(`Updating Test Pack with id ${id}:`, updates);
    const { data, error } = await supabase
      .from('test_packs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating Test Pack with id ${id}:`, error);
      throw error;
    }

    console.log("Test Pack updated successfully:", data);
    
    // Log the activity
    await supabase.from('db_activity_log').insert({
      table_name: 'test_packs',
      action: 'UPDATE',
      record_id: data.id,
      details: { name: data.nombre_paquete, updates }
    });

    return data as TestPack;
  } catch (error) {
    console.error("Error in updateTestPack:", error);
    throw error;
  }
};

export const deleteTestPack = async (id: string): Promise<boolean> => {
  try {
    console.log(`Deleting Test Pack with id ${id}`);
    
    // First, get the test pack details before deletion for logging
    const { data: testPackData } = await supabase
      .from('test_packs')
      .select('*')
      .eq('id', id)
      .single();
      
    if (!testPackData) {
      console.error(`Test Pack with id ${id} not found`);
      return false;
    }
    
    // With the ON DELETE CASCADE constraint now in place, we can simply delete
    // the tags and the related acciones_log entries will be automatically deleted
    
    // Delete all tags associated with this test pack
    // The foreign key cascade will automatically delete related acciones_log entries
    const { error: tagsError } = await supabase
      .from('tags')
      .delete()
      .eq('test_pack_id', id);
        
    if (tagsError) {
      console.error(`Error deleting related tags:`, tagsError);
      throw tagsError;
    }
    
    // Now delete the test pack itself
    const { error } = await supabase
      .from('test_packs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting Test Pack:`, error);
      throw error;
    }

    console.log("Test Pack and associated data deleted successfully");
    
    // Log the activity
    await supabase.from('db_activity_log').insert({
      table_name: 'test_packs',
      action: 'DELETE',
      record_id: id,
      details: { test_pack_id: id, test_pack_name: testPackData.nombre_paquete }
    });
    
    return true;
  } catch (error) {
    console.error("Error in deleteTestPack:", error);
    throw error;
  }
};

export const getTagsByTestPackId = async (testPackId: string): Promise<Tag[]> => {
  try {
    console.log(`Fetching tags for Test Pack ${testPackId}`);
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('test_pack_id', testPackId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching tags for Test Pack ${testPackId}:`, error);
      throw error;
    }

    console.log(`Retrieved ${data?.length || 0} tags for Test Pack ${testPackId}`);
    return (data || []) as Tag[];
  } catch (error) {
    console.error("Error in getTagsByTestPackId:", error);
    throw error;
  }
};

export const createTag = async (tag: Omit<Tag, "id" | "created_at" | "updated_at">): Promise<Tag> => {
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

    console.log("Tag created successfully:", data);
    
    // Log the activity
    await supabase.from('db_activity_log').insert({
      table_name: 'tags',
      action: 'INSERT',
      record_id: data.id,
      details: { name: data.tag_name, test_pack_id: data.test_pack_id }
    });

    return data as Tag;
  } catch (error) {
    console.error("Error in createTag:", error);
    throw error;
  }
};

export const updateTag = async (id: string, updates: Partial<Tag>, userId?: string): Promise<Tag> => {
  try {
    console.log(`Updating tag with id ${id}:`, updates);
    
    // Prepare the update with the current timestamp if it's being released
    const updateData = { ...updates };
    if (updates.estado === 'liberado' && !updates.fecha_liberacion) {
      updateData.fecha_liberacion = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('tags')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating tag with id ${id}:`, error);
      throw error;
    }

    console.log("Tag updated successfully:", data);
    
    // Log the activity in db_activity_log
    await supabase.from('db_activity_log').insert({
      table_name: 'tags',
      action: 'UPDATE',
      record_id: data.id,
      user_id: userId,
      details: { name: data.tag_name, updates: updateData }
    });
    
    // If userId is provided, also log in acciones_log
    if (userId) {
      const accion = updates.estado === 'liberado' 
        ? 'Liberación de TAG' 
        : updates.estado === 'pendiente' 
          ? 'Cambio manual de estado' 
          : 'Edición TAG';
          
      await supabase.from('acciones_log').insert({
        usuario_id: userId,
        tag_id: id,
        accion: accion
      });
    }

    return data as Tag;
  } catch (error) {
    console.error("Error in updateTag:", error);
    throw error;
  }
};

export const deleteTag = async (id: string): Promise<void> => {
  try {
    console.log(`Deleting tag with id ${id}`);
    
    // Get tag details before deletion for logging
    const { data: tagData } = await supabase
      .from('tags')
      .select('*')
      .eq('id', id)
      .single();
      
    // The associated acciones_log entries will be automatically deleted via CASCADE
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting tag with id ${id}:`, error);
      throw error;
    }

    console.log("Tag deleted successfully");
    
    // Log the activity
    if (tagData) {
      await supabase.from('db_activity_log').insert({
        table_name: 'tags',
        action: 'DELETE',
        record_id: id,
        details: { name: tagData.tag_name, test_pack_id: tagData.test_pack_id }
      });
    }
  } catch (error) {
    console.error("Error in deleteTag:", error);
    throw error;
  }
};

export const getTestPacksStats = async (): Promise<StatsData> => {
  try {
    console.log("Fetching Test Packs statistics");
    
    // Get all test packs
    const { data: testPacks, error: testPacksError } = await supabase
      .from('test_packs')
      .select('*');
      
    if (testPacksError) throw testPacksError;
    
    // Get all tags
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*');
      
    if (tagsError) throw tagsError;
    
    // Calculate test pack stats
    const totalTestPacks = testPacks?.length || 0;
    const completedTestPacks = testPacks?.filter(tp => tp.estado === 'listo').length || 0;
    const testPackProgress = totalTestPacks > 0 
      ? Math.round((completedTestPacks / totalTestPacks) * 100) 
      : 0;
    
    // Calculate tag stats
    const totalTags = tags?.length || 0;
    const releasedTags = tags?.filter(tag => tag.estado === 'liberado').length || 0;
    const tagProgress = totalTags > 0 
      ? Math.round((releasedTags / totalTags) * 100) 
      : 0;
    
    // Calculate system stats
    const systemCounts: Record<string, number> = {};
    testPacks?.forEach(tp => {
      if (tp.sistema) {
        systemCounts[tp.sistema] = (systemCounts[tp.sistema] || 0) + 1;
      }
    });
    
    const systemStats = Object.entries(systemCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    
    // Calculate subsystem stats
    const subsystemCounts: Record<string, number> = {};
    testPacks?.forEach(tp => {
      if (tp.subsistema) {
        subsystemCounts[tp.subsistema] = (subsystemCounts[tp.subsistema] || 0) + 1;
      }
    });
    
    const subsystemStats = Object.entries(subsystemCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    
    // Calculate ITR stats
    const itrCounts: Record<string, number> = {};
    testPacks?.forEach(tp => {
      if (tp.itr_asociado) {
        itrCounts[tp.itr_asociado] = (itrCounts[tp.itr_asociado] || 0) + 1;
      }
    });
    
    const itrStats = Object.entries(itrCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    
    return {
      testPacks: {
        total: totalTestPacks,
        completed: completedTestPacks,
        progress: testPackProgress
      },
      tags: {
        total: totalTags,
        released: releasedTags,
        progress: tagProgress
      },
      systems: systemStats,
      subsystems: subsystemStats,
      itrs: itrStats
    };
  } catch (error) {
    console.error("Error fetching Test Packs statistics:", error);
    throw error;
  }
};

export const getTestPacksByITR = async (itrName: string): Promise<TestPack[]> => {
  try {
    console.log(`Fetching Test Packs for ITR ${itrName}`);
    const { data, error } = await supabase
      .from('test_packs')
      .select('*')
      .eq('itr_asociado', itrName)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching Test Packs for ITR ${itrName}:`, error);
      throw error;
    }

    console.log(`Retrieved ${data?.length || 0} Test Packs for ITR ${itrName}`);
    return (data || []) as TestPack[];
  } catch (error) {
    console.error("Error in getTestPacksByITR:", error);
    throw error;
  }
};

export const bulkCreateTestPacksAndTags = async (
  testPacksData: Array<Omit<TestPack, "id" | "created_at" | "updated_at">>,
  tagsData: Array<{ testPackIndex: number; tagData: Omit<Tag, "id" | "created_at" | "updated_at" | "test_pack_id"> }>
): Promise<{ testPacks: TestPack[]; tags: Tag[] }> => {
  try {
    console.log("Bulk creating Test Packs and Tags");
    console.log(`Test Packs to create: ${testPacksData.length}`);
    console.log(`Tags to create: ${tagsData.length}`);
    
    // First, check for duplicate test packs by package name pattern
    const createdTestPacks: TestPack[] = [];
    
    for (const testPackData of testPacksData) {
      // Check if this test pack is already in our list (by name pattern)
      // Extract the base name without ITR-specific suffixes
      const basePackageName = testPackData.nombre_paquete.replace(/-\d+$/, '');
      console.log(`Processing test pack: ${testPackData.nombre_paquete}, base name: ${basePackageName}`);
      
      // Check if we already have a similar test pack in our results
      const similarPackIndex = createdTestPacks.findIndex(tp => 
        tp.nombre_paquete.startsWith(basePackageName) && 
        tp.sistema === testPackData.sistema &&
        tp.subsistema === testPackData.subsistema
      );
      
      if (similarPackIndex >= 0) {
        console.log(`Found similar test pack at index ${similarPackIndex}: ${createdTestPacks[similarPackIndex].nombre_paquete}`);
        // Skip this test pack but record the mapping for tags
        continue;
      }
      
      // Check if a similar test pack already exists in the database
      const { data: existingPacks, error: checkError } = await supabase
        .from('test_packs')
        .select('*')
        .ilike('nombre_paquete', `${basePackageName}%`)
        .eq('sistema', testPackData.sistema)
        .eq('subsistema', testPackData.subsistema);
        
      if (checkError) {
        console.error("Error checking for existing test packs:", checkError);
        throw checkError;
      }
      
      if (existingPacks && existingPacks.length > 0) {
        console.log(`Found ${existingPacks.length} existing similar test packs in database for ${basePackageName}`);
        // Add the existing pack to our list
        createdTestPacks.push(existingPacks[0] as TestPack);
        continue;
      }
      
      // If we get here, we need to create a new test pack
      const { data: newTestPack, error: insertError } = await supabase
        .from('test_packs')
        .insert(testPackData)
        .select()
        .single();
        
      if (insertError) {
        console.error("Error creating test pack:", insertError);
        throw insertError;
      }
      
      console.log(`Created new test pack: ${newTestPack.nombre_paquete} with ID ${newTestPack.id}`);
      createdTestPacks.push(newTestPack as TestPack);
    }
    
    console.log(`Created ${createdTestPacks.length} unique Test Packs`);
    
    // Prepare tags with test_pack_id
    const tagsToInsert: Array<Omit<Tag, "id" | "created_at" | "updated_at">> = [];
    const processedTagNames = new Set<string>();
    
    for (const tagItem of tagsData) {
      if (tagItem.testPackIndex >= testPacksData.length) {
        console.error(`Invalid test pack index: ${tagItem.testPackIndex}`);
        continue;
      }
      
      const testPackData = testPacksData[tagItem.testPackIndex];
      const basePackageName = testPackData.nombre_paquete.replace(/-\d+$/, '');
      
      // Find the corresponding test pack
      const testPack = createdTestPacks.find(tp => 
        tp.nombre_paquete.startsWith(basePackageName) && 
        tp.sistema === testPackData.sistema &&
        tp.subsistema === testPackData.subsistema
      );
      
      if (!testPack) {
        console.error(`No matching test pack found for tag ${tagItem.tagData.tag_name}`);
        continue;
      }
      
      // Avoid duplicate tags
      const tagKey = `${testPack.id}-${tagItem.tagData.tag_name}`;
      if (processedTagNames.has(tagKey)) {
        console.log(`Skipping duplicate tag: ${tagItem.tagData.tag_name} for test pack ${testPack.nombre_paquete}`);
        continue;
      }
      
      processedTagNames.add(tagKey);
      tagsToInsert.push({
        ...tagItem.tagData,
        test_pack_id: testPack.id
      });
    }
    
    if (tagsToInsert.length === 0) {
      console.log("No tags to insert");
      return { testPacks: createdTestPacks, tags: [] };
    }
    
    // Insert all tags
    const { data: createdTags, error: tagsError } = await supabase
      .from('tags')
      .insert(tagsToInsert)
      .select();
      
    if (tagsError) {
      console.error("Error bulk creating Tags:", tagsError);
      throw tagsError;
    }
    
    console.log(`Created ${createdTags?.length || 0} Tags`);
    
    // Log the activity
    await supabase.from('db_activity_log').insert({
      table_name: 'test_packs',
      action: 'BULK_INSERT',
      details: { 
        test_packs_count: createdTestPacks.length,
        tags_count: createdTags?.length || 0
      }
    });
    
    return { 
      testPacks: createdTestPacks,
      tags: (createdTags || []) as Tag[]
    };
  } catch (error) {
    console.error("Error in bulkCreateTestPacksAndTags:", error);
    throw error;
  }
};
