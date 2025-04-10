import { supabase } from "@/integrations/supabase/client";
import { Tag, TestPack, AccionesLog, StatsData } from "./types";

export const getTestPacks = async (): Promise<TestPack[]> => {
  const { data, error } = await supabase
    .from('test_packs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching test packs:", error);
    throw error;
  }

  return data as TestPack[] || [];
};

export const getTestPackById = async (id: string): Promise<TestPack | null> => {
  const { data, error } = await supabase
    .from('test_packs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching test pack with id ${id}:`, error);
    throw error;
  }

  return data as TestPack;
};

export const getTagsByTestPackId = async (testPackId: string): Promise<Tag[]> => {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('test_pack_id', testPackId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`Error fetching tags for test pack ${testPackId}:`, error);
    throw error;
  }

  return data as Tag[] || [];
};

export const createTestPack = async (testPack: Omit<TestPack, "id" | "created_at" | "updated_at">): Promise<TestPack> => {
  const { data, error } = await supabase
    .from('test_packs')
    .insert({
      nombre_paquete: testPack.nombre_paquete,
      sistema: testPack.sistema,
      subsistema: testPack.subsistema,
      itr_asociado: testPack.itr_asociado,
      estado: testPack.estado || 'pendiente'
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating test pack:", error);
    throw error;
  }

  return data as TestPack;
};

export const createTag = async (tag: Omit<Tag, "id" | "created_at" | "updated_at">): Promise<Tag> => {
  const { data, error } = await supabase
    .from('tags')
    .insert({
      tag_name: tag.tag_name,
      test_pack_id: tag.test_pack_id,
      estado: tag.estado || 'pendiente',
      fecha_liberacion: tag.fecha_liberacion
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating tag:", error);
    throw error;
  }

  return data as Tag;
};

export const getTestPackWithTags = async (id: string): Promise<{ testPack: TestPack; tags: Tag[] }> => {
  try {
    const testPack = await getTestPackById(id);
    if (!testPack) {
      throw new Error(`Test pack with id ${id} not found`);
    }
    
    const tags = await getTagsByTestPackId(id);
    
    return {
      testPack,
      tags
    };
  } catch (error) {
    console.error(`Error fetching test pack with tags for id ${id}:`, error);
    throw error;
  }
};

export const updateTestPack = async (id: string, updates: Partial<TestPack>): Promise<TestPack> => {
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

  return data as TestPack;
};

export const updateTag = async (id: string, updates: Partial<Tag>): Promise<Tag> => {
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

  return data as Tag;
};

export const deleteTestPack = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .rpc('delete_test_pack_with_tags', { test_pack_id: id });
      
    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting test pack with id ${id}:`, error);
    throw error;
  }
};

export const deleteTag = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting tag with id ${id}:`, error);
    throw error;
  }
};

export const logTagAction = async (action: string, tagId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('acciones_log')
    .insert({
      accion: action,
      tag_id: tagId,
      usuario_id: userId
    });

  if (error) {
    console.error(`Error logging tag action:`, error);
    throw error;
  }
};

export const getTestPackStats = async (): Promise<StatsData> => {
  try {
    const { data: totalPacks, error: totalPacksError } = await supabase
      .from('test_packs')
      .select('id', { count: 'exact' });
      
    if (totalPacksError) throw totalPacksError;
    
    const { data: pendingPacks, error: pendingPacksError } = await supabase
      .from('test_packs')
      .select('id', { count: 'exact' })
      .eq('estado', 'pendiente');
      
    if (pendingPacksError) throw pendingPacksError;
    
    const { data: completedPacks, error: completedPacksError } = await supabase
      .from('test_packs')
      .select('id', { count: 'exact' })
      .eq('estado', 'listo');
      
    if (completedPacksError) throw completedPacksError;
    
    const { data: totalTags, error: totalTagsError } = await supabase
      .from('tags')
      .select('id', { count: 'exact' });
      
    if (totalTagsError) throw totalTagsError;
    
    const { data: pendingTags, error: pendingTagsError } = await supabase
      .from('tags')
      .select('id', { count: 'exact' })
      .eq('estado', 'pendiente');
      
    if (pendingTagsError) throw pendingTagsError;
    
    const { data: releasedTags, error: releasedTagsError } = await supabase
      .from('tags')
      .select('id', { count: 'exact' })
      .eq('estado', 'liberado');
      
    if (releasedTagsError) throw releasedTagsError;
    
    const totalPacksCount = totalPacks?.length || 0;
    const completedPacksCount = completedPacks?.length || 0;
    const completionRate = totalPacksCount > 0 ? Math.round((completedPacksCount / totalPacksCount) * 100) : 0;
    
    return {
      totalPacks: totalPacksCount,
      pendingPacks: pendingPacks?.length || 0,
      completedPacks: completedPacksCount,
      totalTags: totalTags?.length || 0,
      pendingTags: pendingTags?.length || 0,
      releasedTags: releasedTags?.length || 0,
      completionRate
    };
  } catch (error) {
    console.error("Error fetching test pack stats:", error);
    throw error;
  }
};

export const bulkCreateTestPacks = async (testPacks: Omit<TestPack, "id" | "created_at" | "updated_at">[]): Promise<TestPack[]> => {
  try {
    const formattedTestPacks = testPacks.map(tp => ({
      nombre_paquete: tp.nombre_paquete,
      sistema: tp.sistema,
      subsistema: tp.subsistema,
      itr_asociado: tp.itr_asociado,
      estado: tp.estado || 'pendiente'
    }));
    
    const { data, error } = await supabase
      .from('test_packs')
      .insert(formattedTestPacks)
      .select();
      
    if (error) throw error;
    
    return data as TestPack[];
  } catch (error) {
    console.error("Error in bulk creating test packs:", error);
    throw error;
  }
};

export const bulkCreateTags = async (tags: Omit<Tag, "id" | "created_at" | "updated_at">[]): Promise<Tag[]> => {
  try {
    const formattedTags = tags.map(tag => ({
      tag_name: tag.tag_name,
      test_pack_id: tag.test_pack_id,
      estado: tag.estado || 'pendiente',
      fecha_liberacion: tag.fecha_liberacion
    }));
    
    const { data, error } = await supabase
      .from('tags')
      .insert(formattedTags)
      .select();
      
    if (error) throw error;
    
    return data as Tag[];
  } catch (error) {
    console.error("Error in bulk creating tags:", error);
    throw error;
  }
};
