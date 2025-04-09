
import { supabase } from "@/integrations/supabase/client";
import { Tag } from "../testPackService";

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
      const { updateTestPackStatusBasedOnTags } = await import('./testPackMutations');
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
