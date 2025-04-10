
import { useState, useEffect } from "react";
import { getTestPacks, getTestPackStats, getTagCompletionData } from "@/services/testPackService";
import { TestPack, StatsData } from "@/services/types";

export const useTestPacksList = () => {
  const [testPacks, setTestPacks] = useState<TestPack[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTestPacks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [packsData, statsData] = await Promise.all([
        getTestPacks(),
        getTestPackStats()
      ]);
      
      setTestPacks(packsData);
      setStats(statsData);
    } catch (err) {
      console.error("Error fetching test packs:", err);
      setError("Failed to load test packs. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestPacks();
  }, []);

  return {
    testPacks,
    stats,
    loading,
    error,
    refresh: fetchTestPacks
  };
};
