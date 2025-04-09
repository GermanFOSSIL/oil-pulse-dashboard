
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  getTestPackById, 
  getTagsByTestPackId,
  updateTestPack,
  deleteTestPack
} from '@/services/testPackService';
import { TestPack, Tag } from '@/services/types';

export type TestPackWithTags = TestPack & { tags: Tag[] };

export const useTestPackDetail = () => {
  const [currentTestPack, setCurrentTestPack] = useState<TestPackWithTags | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  
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
  
  const updateTestPackData = useCallback(async (id: string, updates: Partial<TestPack>) => {
    setLoading(true);
    try {
      const updatedTestPack = await updateTestPack(id, updates);
      
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
  
  return {
    currentTestPack,
    loading,
    error,
    fetchTestPackWithTags,
    updateTestPack: updateTestPackData,
    removeTestPack,
    setCurrentTestPack
  };
};
