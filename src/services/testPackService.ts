
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
