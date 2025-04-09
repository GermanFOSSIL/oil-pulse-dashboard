
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  createTag, 
  updateTag, 
  deleteTag
} from '@/services/testPackService';
import { Tag } from '@/services/types';

export const useTagOperations = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  
  const addTag = useCallback(async (tagData: Omit<Tag, "id" | "created_at" | "updated_at">) => {
    setLoading(true);
    try {
      const newTag = await createTag(tagData);
      
      toast({
        title: "Éxito",
        description: "TAG creado correctamente",
      });
      
      return newTag;
    } catch (error) {
      console.error("Error creating TAG:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el TAG",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  const updateTagData = useCallback(async (id: string, updates: Partial<Tag>) => {
    setLoading(true);
    try {
      const updatedTag = await updateTag(id, updates, user?.id);
      
      toast({
        title: "Éxito",
        description: "TAG actualizado correctamente",
      });
      
      return updatedTag;
    } catch (error) {
      console.error(`Error updating TAG with id ${id}:`, error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el TAG",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, user]);
  
  const releaseTag = useCallback(async (id: string) => {
    return updateTagData(id, { estado: 'liberado' });
  }, [updateTagData]);
  
  const changeTagStatus = useCallback(async (id: string, newStatus: 'pendiente' | 'liberado') => {
    return updateTagData(id, { estado: newStatus });
  }, [updateTagData]);
  
  const removeTag = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await deleteTag(id);
      
      toast({
        title: "Éxito",
        description: "TAG eliminado correctamente",
      });
      
      return true;
    } catch (error) {
      console.error(`Error deleting TAG with id ${id}:`, error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el TAG",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  const retryOperation = useCallback(async <T,>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T | null> => {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        return await operation();
      } catch (err) {
        retries++;
        console.log(`Reintento ${retries}/${maxRetries}`);
        if (retries >= maxRetries) {
          throw err;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return null;
  }, []);
  
  const addTagWithRetry = useCallback(async (tagData: Omit<Tag, "id" | "created_at" | "updated_at">) => {
    return retryOperation(() => addTag(tagData));
  }, [addTag, retryOperation]);
  
  return {
    loading,
    addTag,
    addTagWithRetry,
    updateTag: updateTagData,
    releaseTag,
    changeTagStatus,
    removeTag
  };
};
