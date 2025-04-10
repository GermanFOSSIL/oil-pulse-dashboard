
import { supabase } from "@/integrations/supabase/client";
import { Tag, TestPack, AccionesLog, StatsData } from "./types";

// Get all test packs
export const getTestPacks = async (): Promise<TestPack[]> => {
  try {
    const { data, error } = await supabase
      .from('test_packs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching test packs:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getTestPacks:", error);
    throw error;
  }
};

// Get a specific test pack by ID
export const getTestPackById = async (id: string): Promise<TestPack | null> => {
  try {
    const { data, error } = await supabase
      .from('test_packs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching test pack with id ${id}:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in getTestPackById:", error);
    throw error;
  }
};

// Get test packs filtered by ITR ID
export const getTestPackByITR = async (itrId: string): Promise<TestPack[]> => {
  try {
    const { data, error } = await supabase
      .from('test_packs')
      .select('*')
      .eq('itr_asociado', itrId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching test packs for ITR ${itrId}:`, error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getTestPackByITR:", error);
    throw error;
  }
};

// Create a new test pack
export const createTestPack = async (testPack: Omit<TestPack, "id" | "created_at" | "updated_at">): Promise<TestPack> => {
  try {
    const { data, error } = await supabase
      .from('test_packs')
      .insert({
        nombre_paquete: testPack.nombre_paquete,
        sistema: testPack.sistema,
        subsistema: testPack.subsistema,
        itr_asociado: testPack.itr_asociado,
        estado: testPack.estado
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating test pack:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in createTestPack:", error);
    throw error;
  }
};

// Update an existing test pack
export const updateTestPack = async (id: string, updates: Partial<TestPack>): Promise<TestPack> => {
  try {
    const { data, error } = await supabase
      .from('test_packs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating test pack with id ${id}:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in updateTestPack:", error);
    throw error;
  }
};

// Delete a test pack
export const deleteTestPack = async (id: string): Promise<void> => {
  try {
    // First, delete all tags associated with the test pack
    const { error: tagsError } = await supabase
      .from('tags')
      .delete()
      .eq('test_pack_id', id);

    if (tagsError) {
      console.error(`Error deleting tags for test pack ${id}:`, tagsError);
      throw tagsError;
    }

    // Then delete the test pack itself
    const { error } = await supabase
      .from('test_packs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting test pack with id ${id}:`, error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteTestPack:", error);
    throw error;
  }
};

// Get all tags for a test pack
export const getTagsByTestPackId = async (testPackId: string): Promise<Tag[]> => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('test_pack_id', testPackId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching tags for test pack ${testPackId}:`, error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getTagsByTestPackId:", error);
    throw error;
  }
};

// Create a new tag
export const createTag = async (tag: Omit<Tag, "id" | "created_at" | "updated_at">): Promise<Tag> => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .insert({
        tag_name: tag.tag_name,
        test_pack_id: tag.test_pack_id,
        estado: tag.estado,
        fecha_liberacion: tag.fecha_liberacion
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating tag:", error);
      throw error;
    }

    // Log the action
    await logTagAction(data.id, 'creacion');

    return data;
  } catch (error) {
    console.error("Error in createTag:", error);
    throw error;
  }
};

// Update an existing tag
export const updateTag = async (id: string, updates: Partial<Tag>): Promise<Tag> => {
  try {
    // Get the current tag state
    const { data: currentTag, error: fetchError } = await supabase
      .from('tags')
      .select('estado')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error(`Error fetching current tag state for ${id}:`, fetchError);
      throw fetchError;
    }

    // Update the tag
    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating tag with id ${id}:`, error);
      throw error;
    }

    // Log state change if the estado field was updated
    if (updates.estado && updates.estado !== currentTag.estado) {
      if (updates.estado === 'liberado') {
        await logTagAction(id, 'liberacion');
      } else {
        await logTagAction(id, 'cambio_estado');
      }
    }

    return data;
  } catch (error) {
    console.error("Error in updateTag:", error);
    throw error;
  }
};

// Delete a tag
export const deleteTag = async (id: string): Promise<void> => {
  try {
    // First, delete all action logs associated with the tag
    const { error: logsError } = await supabase
      .from('acciones_log')
      .delete()
      .eq('tag_id', id);

    if (logsError) {
      console.error(`Error deleting logs for tag ${id}:`, logsError);
      throw logsError;
    }

    // Then delete the tag itself
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting tag with id ${id}:`, error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deleteTag:", error);
    throw error;
  }
};

// Log an action for a tag
export const logTagAction = async (tagId: string, action: string): Promise<void> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'anonymous';

    const { error } = await supabase
      .from('acciones_log')
      .insert({
        tag_id: tagId,
        accion: action,
        fecha: new Date().toISOString(),
        usuario_id: userId
      });

    if (error) {
      console.error(`Error logging action ${action} for tag ${tagId}:`, error);
      throw error;
    }
  } catch (error) {
    console.error("Error in logTagAction:", error);
    throw error;
  }
};

// Get action logs for a tag
export const getTagActionLogs = async (tagId: string): Promise<AccionesLog[]> => {
  try {
    const { data, error } = await supabase
      .from('acciones_log')
      .select('*')
      .eq('tag_id', tagId)
      .order('fecha', { ascending: false });

    if (error) {
      console.error(`Error fetching action logs for tag ${tagId}:`, error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in getTagActionLogs:", error);
    throw error;
  }
};

// Get statistics for test packs
export const getTestPackStats = async (): Promise<StatsData> => {
  try {
    const { data: testPacksData, error: testPacksError } = await supabase
      .from('test_packs')
      .select('*');

    if (testPacksError) {
      console.error("Error fetching test packs for stats:", testPacksError);
      throw testPacksError;
    }

    const { data: tagsData, error: tagsError } = await supabase
      .from('tags')
      .select('*');

    if (tagsError) {
      console.error("Error fetching tags for stats:", tagsError);
      throw tagsError;
    }

    const totalPacks = testPacksData.length;
    const pendingPacks = testPacksData.filter(pack => pack.estado !== 'completado').length;
    const completedPacks = testPacksData.filter(pack => pack.estado === 'completado').length;

    const totalTags = tagsData.length;
    const pendingTags = tagsData.filter(tag => tag.estado !== 'liberado').length;
    const releasedTags = tagsData.filter(tag => tag.estado === 'liberado').length;

    const completionRate = totalPacks > 0 ? (completedPacks / totalPacks) * 100 : 0;

    return {
      totalPacks,
      pendingPacks,
      completedPacks,
      totalTags,
      pendingTags,
      releasedTags,
      completionRate
    };
  } catch (error) {
    console.error("Error in getTestPackStats:", error);
    throw error;
  }
};

// Get tag completion data for visualizations
export const getTagCompletionData = async (): Promise<any> => {
  try {
    const { data: tagsData, error: tagsError } = await supabase
      .from('tags')
      .select('*');

    if (tagsError) {
      console.error("Error fetching tags for completion data:", tagsError);
      throw tagsError;
    }

    const totalCount = tagsData.length;
    const liberadoCount = tagsData.filter(tag => tag.estado === 'liberado').length;
    const pendienteCount = tagsData.filter(tag => tag.estado === 'pendiente').length;
    const enProcesoCount = tagsData.filter(tag => tag.estado === 'en_proceso').length;

    return [
      { name: 'Liberado', value: liberadoCount },
      { name: 'Pendiente', value: pendienteCount },
      { name: 'En Proceso', value: enProcesoCount }
    ];
  } catch (error) {
    console.error("Error in getTagCompletionData:", error);
    throw error;
  }
};

// Bulk create test packs
export const bulkCreateTestPacks = async (testPacks: Omit<TestPack, "id" | "created_at" | "updated_at">[]): Promise<TestPack[]> => {
  try {
    const formattedTestPacks = testPacks.map(pack => ({
      nombre_paquete: pack.nombre_paquete,
      sistema: pack.sistema,
      subsistema: pack.subsistema,
      itr_asociado: pack.itr_asociado,
      estado: pack.estado
    }));

    const { data, error } = await supabase
      .from('test_packs')
      .insert(formattedTestPacks)
      .select();

    if (error) {
      console.error("Error in bulk creating test packs:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in bulkCreateTestPacks:", error);
    throw error;
  }
};

// Bulk create tags
export const bulkCreateTags = async (tags: Omit<Tag, "id" | "created_at" | "updated_at">[]): Promise<Tag[]> => {
  try {
    const formattedTags = tags.map(tag => ({
      tag_name: tag.tag_name,
      test_pack_id: tag.test_pack_id,
      estado: tag.estado,
      fecha_liberacion: tag.fecha_liberacion
    }));

    const { data, error } = await supabase
      .from('tags')
      .insert(formattedTags)
      .select();

    if (error) {
      console.error("Error in bulk creating tags:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Error in bulkCreateTags:", error);
    throw error;
  }
};

// Export combined function to create test packs and tags together
export const bulkCreateTestPacksAndTags = async (
  testPacks: Omit<TestPack, "id" | "created_at" | "updated_at">[],
  tagsByPack: { [packIndex: number]: Omit<Tag, "id" | "created_at" | "updated_at" | "test_pack_id">[] }
): Promise<{ testPacks: TestPack[], tags: Tag[] }> => {
  try {
    // First create all test packs
    const createdPacks = await bulkCreateTestPacks(testPacks);
    
    // Then create tags by mapping them to the created test pack IDs
    let allTags: Omit<Tag, "id" | "created_at" | "updated_at">[] = [];
    
    Object.entries(tagsByPack).forEach(([packIndex, packTags]) => {
      const index = parseInt(packIndex);
      if (createdPacks[index]) {
        const packId = createdPacks[index].id;
        const tagsWithPackId = packTags.map(tag => ({
          ...tag,
          test_pack_id: packId
        }));
        allTags = [...allTags, ...tagsWithPackId];
      }
    });
    
    const createdTags = await bulkCreateTags(allTags);
    
    return {
      testPacks: createdPacks,
      tags: createdTags
    };
  } catch (error) {
    console.error("Error in bulkCreateTestPacksAndTags:", error);
    throw error;
  }
};
