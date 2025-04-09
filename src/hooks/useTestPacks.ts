import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getTestPacks, 
  getTestPackById, 
  createTestPack, 
  updateTestPack, 
  deleteTestPack, 
  getTagsByTestPackId, 
  createTag, 
  updateTag, 
  deleteTag,
  getTestPacksStats,
  getTestPacksByITR,
  bulkCreateTestPacksAndTags
} from '@/services/testPackService';
import { TestPack, Tag, StatsData } from '@/services/types';

export type TestPackWithTags = TestPack & { tags: Tag[] };

export const useTestPacks = () => {
  const [testPacks, setTestPacks] = useState<TestPack[]>([]);
  const [currentTestPack, setCurrentTestPack] = useState<TestPackWithTags | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statsData, setStatsData] = useState<StatsData>({
    testPacks: { total: 0, completed: 0, progress: 0 },
    tags: { total: 0, released: 0, progress: 0 },
    systems: [],
    subsystems: [],
    itrs: []
  });
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  const fetchTestPacks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Iniciando fetchTestPacks");
      const data = await getTestPacks();
      console.log("Test Packs obtenidos:", data?.length || 0);
      setTestPacks(data);
      return data;
    } catch (err) {
      console.error("Error fetching Test Packs:", err);
      setError("No se pudieron cargar los Test Packs");
      toast({
        title: "Error",
        description: "No se pudieron cargar los Test Packs",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  const fetchTestPacksStats = useCallback(async () => {
    try {
      console.log("Iniciando fetchTestPacksStats");
      const data = await getTestPacksStats();
      setStatsData(data);
      return data;
    } catch (err) {
      console.error("Error fetching Test Packs stats:", err);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas de Test Packs",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);
  
  const fetchTestPacksByITR = useCallback(async (itrName: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Iniciando fetchTestPacksByITR para ${itrName}`);
      const data = await getTestPacksByITR(itrName);
      setTestPacks(data);
      return data;
    } catch (err) {
      console.error(`Error fetching Test Packs for ITR ${itrName}:`, err);
      setError(`No se pudieron cargar los Test Packs para el ITR ${itrName}`);
      toast({
        title: "Error",
        description: `No se pudieron cargar los Test Packs para el ITR ${itrName}`,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  const fetchTestPackWithTags = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Iniciando fetchTestPackWithTags para ID ${id}`);
      const testPack = await getTestPackById(id);
      if (!testPack) {
        console.log("Test Pack no encontrado");
        setError("Test Pack no encontrado");
        toast({
          title: "Error",
          description: "Test Pack no encontrado",
          variant: "destructive",
        });
        setCurrentTestPack(null);
        return null;
      }
      
      console.log("Test Pack encontrado, obteniendo TAGs");
      const tags = await getTagsByTestPackId(id);
      console.log(`TAGs obtenidos: ${tags?.length || 0}`);
      const testPackWithTags = { ...testPack, tags };
      
      setCurrentTestPack(testPackWithTags);
      return testPackWithTags;
    } catch (err) {
      console.error(`Error fetching Test Pack with id ${id}:`, err);
      setError("No se pudo cargar el Test Pack");
      toast({
        title: "Error",
        description: "No se pudo cargar el Test Pack",
        variant: "destructive",
      });
      setCurrentTestPack(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  const addTestPack = useCallback(async (testPackData: Omit<TestPack, "id" | "created_at" | "updated_at">) => {
    setLoading(true);
    try {
      const newTestPack = await createTestPack(testPackData);
      setTestPacks(prevTestPacks => [newTestPack, ...prevTestPacks]);
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
  
  const updateTestPackData = useCallback(async (id: string, updates: Partial<TestPack>) => {
    setLoading(true);
    try {
      const updatedTestPack = await updateTestPack(id, updates);
      
      // Update in testPacks list
      setTestPacks(prevTestPacks => 
        prevTestPacks.map(tp => 
          tp.id === id ? updatedTestPack : tp
        )
      );
      
      // Update in currentTestPack if it's the active one
      if (currentTestPack && currentTestPack.id === id) {
        setCurrentTestPack(prevState => 
          prevState ? { ...updatedTestPack, tags: prevState.tags } : null
        );
      }
      
      toast({
        title: "Éxito",
        description: "Test Pack actualizado correctamente",
      });
      
      return updatedTestPack;
    } catch (error) {
      console.error(`Error updating Test Pack with id ${id}:`, error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el Test Pack",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, currentTestPack]);
  
  const removeTestPack = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const result = await deleteTestPack(id);
      
      if (result) {
        // Remove from testPacks list
        setTestPacks(prevTestPacks => 
          prevTestPacks.filter(tp => tp.id !== id)
        );
        
        // Clear currentTestPack if it's the active one
        if (currentTestPack && currentTestPack.id === id) {
          setCurrentTestPack(null);
        }
        
        toast({
          title: "Éxito",
          description: "Test Pack eliminado correctamente",
        });
        
        return true;
      } else {
        toast({
          title: "Advertencia",
          description: "No se encontró el Test Pack para eliminar",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error(`Error deleting Test Pack with id ${id}:`, error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el Test Pack",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, currentTestPack]);
  
  const addTag = useCallback(async (tagData: Omit<Tag, "id" | "created_at" | "updated_at">) => {
    setLoading(true);
    try {
      const newTag = await createTag(tagData);
      
      // Update in currentTestPack if it's the active one
      if (currentTestPack && currentTestPack.id === tagData.test_pack_id) {
        setCurrentTestPack(prevState => 
          prevState ? { ...prevState, tags: [newTag, ...prevState.tags] } : null
        );
      }
      
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
  }, [toast, currentTestPack]);
  
  const updateTagData = useCallback(async (id: string, updates: Partial<Tag>) => {
    setLoading(true);
    try {
      const updatedTag = await updateTag(id, updates, user?.id);
      
      // Update in currentTestPack if it contains this tag
      if (currentTestPack) {
        const tagIndex = currentTestPack.tags.findIndex(tag => tag.id === id);
        
        if (tagIndex !== -1) {
          const updatedTags = [...currentTestPack.tags];
          updatedTags[tagIndex] = updatedTag;
          
          setCurrentTestPack(prevState => 
            prevState ? { ...prevState, tags: updatedTags } : null
          );
        }
      }
      
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
  }, [toast, currentTestPack, user]);
  
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
      
      // Update in currentTestPack if it contains this tag
      if (currentTestPack) {
        const updatedTags = currentTestPack.tags.filter(tag => tag.id !== id);
        
        setCurrentTestPack(prevState => 
          prevState ? { ...prevState, tags: updatedTags } : null
        );
      }
      
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
  }, [toast, currentTestPack]);
  
  const bulkCreateData = useCallback(async (
    testPacksData: Array<Omit<TestPack, "id" | "created_at" | "updated_at">>,
    tagsData: Array<{ testPackIndex: number; tagData: Omit<Tag, "id" | "created_at" | "updated_at" | "test_pack_id"> }>
  ) => {
    setLoading(true);
    try {
      const result = await bulkCreateTestPacksAndTags(testPacksData, tagsData);
      
      // Update testPacks list with the new data
      setTestPacks(prevTestPacks => [...result.testPacks, ...prevTestPacks]);
      
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
  
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchTestPacks();
        await fetchTestPacksStats();
      } catch (err) {
        console.error("Error loading initial data:", err);
      }
    };
    
    loadInitialData();
  }, [fetchTestPacks, fetchTestPacksStats]);
  
  return {
    testPacks,
    currentTestPack,
    loading,
    error,
    statsData,
    fetchTestPacks,
    fetchTestPacksStats,
    fetchTestPacksByITR,
    fetchTestPackWithTags,
    addTestPack,
    updateTestPack: updateTestPackData,
    removeTestPack,
    addTag,
    addTagWithRetry,
    updateTag: updateTagData,
    releaseTag,
    changeTagStatus,
    removeTag,
    bulkCreateData
  };
};
