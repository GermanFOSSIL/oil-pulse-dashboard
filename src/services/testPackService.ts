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
    
    // Insert all test packs
    const { data: createdTestPacks, error: testPacksError } = await supabase
      .from('test_packs')
      .insert(testPacksData)
      .select();
      
    if (testPacksError) {
      console.error("Error bulk creating Test Packs:", testPacksError);
      throw testPacksError;
    }
    
    console.log(`Created ${createdTestPacks.length} Test Packs`);
    
    // Prepare tags with test_pack_id
    const tagsToInsert = tagsData.map(tagItem => {
      const testPackId = createdTestPacks[tagItem.testPackIndex]?.id;
      if (!testPackId) {
        console.error(`No Test Pack found at index ${tagItem.testPackIndex}`);
        return null;
      }
      return {
        ...tagItem.tagData,
        test_pack_id: testPackId
      };
    }).filter(Boolean) as Omit<Tag, "id" | "created_at" | "updated_at">[];
    
    if (tagsToInsert.length === 0) {
      console.log("No tags to insert");
      return { testPacks: createdTestPacks as TestPack[], tags: [] };
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
    
    console.log(`Created ${createdTags.length} Tags`);
    
    // Log the activity
    await supabase.from('db_activity_log').insert({
      table_name: 'test_packs',
      action: 'BULK_INSERT',
      details: { 
        test_packs_count: createdTestPacks.length,
        tags_count: createdTags.length
      }
    });
    
    return { 
      testPacks: createdTestPacks as TestPack[],
      tags: createdTags as Tag[]
    };
  } catch (error) {
    console.error("Error in bulkCreateTestPacksAndTags:", error);
    throw error;
  }
};
