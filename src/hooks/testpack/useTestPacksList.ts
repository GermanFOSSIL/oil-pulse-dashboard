
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getTestPacks, getTestPacksStats, getTestPacksByITR } from '@/services/testPackService';
import { TestPack, StatsData } from '@/services/types';

export const useTestPacksList = () => {
  const [testPacks, setTestPacks] = useState<TestPack[]>([]);
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
  
  return {
    testPacks,
    loading,
    error,
    statsData,
    fetchTestPacks,
    fetchTestPacksStats,
    fetchTestPacksByITR,
    setTestPacks
  };
};
