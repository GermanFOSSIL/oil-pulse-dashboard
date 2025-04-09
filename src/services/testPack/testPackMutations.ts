
import { supabase } from "@/integrations/supabase/client";
import { TestPack } from "../testPackService";

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

// Delete a test pack and all its associated tags
export const deleteTestPack = async (testPackId: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`Starting deletion process for test pack ${testPackId}`);
    
    // Call the RPC function to delete test pack and its tags in a transaction
    const { data, error } = await supabase.rpc(
      'delete_test_pack_with_tags',
      { test_pack_id: testPackId }
    );
    
    if (error) {
      console.error(`Error in RPC call to delete test pack ${testPackId}:`, error);
      return { 
        success: false, 
        message: error.message || "Error al eliminar el test pack. Por favor, inténtelo de nuevo." 
      };
    }
    
    // The function returns a boolean indicating success
    if (data !== true) {
      console.error(`Test pack ${testPackId} deletion failed.`);
      return { 
        success: false, 
        message: "El test pack no se eliminó correctamente. Puede que no exista o que ya haya sido eliminado." 
      };
    }
    
    console.log(`Test pack ${testPackId} successfully deleted.`);
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
