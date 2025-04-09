
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  createTestPack,
  bulkCreateTestPacksAndTags
} from '@/services/testPackService';
import { TestPack, Tag } from '@/services/types';

export const useTestPackCreation = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  
  const addTestPack = useCallback(async (testPackData: Omit<TestPack, "id" | "created_at" | "updated_at">) => {
    setLoading(true);
    try {
      const newTestPack = await createTestPack(testPackData);
      toast({
        title: "Éxito",
        description: "Test Pack creado correctamente",
      });
      return newTestPack;
    } catch (error) {
      console.error("Error creating Test Pack:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el Test Pack",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  const bulkCreateData = useCallback(async (
    testPacksData: Array<Omit<TestPack, "id" | "created_at" | "updated_at">>,
    tagsData: Array<{ testPackIndex: number; tagData: Omit<Tag, "id" | "created_at" | "updated_at" | "test_pack_id"> }>
  ) => {
    setLoading(true);
    try {
      const result = await bulkCreateTestPacksAndTags(testPacksData, tagsData);
      
      toast({
        title: "Éxito",
        description: `Se crearon ${result.testPacks.length} Test Packs y ${result.tags.length} TAGs correctamente`,
      });
      
      return result;
    } catch (error) {
      console.error("Error in bulk creation:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error durante la creación masiva",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  return {
    loading,
    addTestPack,
    bulkCreateData
  };
};
