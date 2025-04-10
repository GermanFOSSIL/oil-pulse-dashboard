
import { useState, useEffect } from "react";
import { getTestPackById, getTagsByTestPackId, updateTestPack, deleteTestPack } from "@/services/testPackService";
import { TestPack, Tag } from "@/services/types";
import { useToast } from "@/hooks/use-toast";

export const useTestPackDetail = (testPackId: string) => {
  const [testPack, setTestPack] = useState<TestPack | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTestPackDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [packData, tagsData] = await Promise.all([
        getTestPackById(testPackId),
        getTagsByTestPackId(testPackId)
      ]);
      
      setTestPack(packData);
      setTags(tagsData);
    } catch (err) {
      console.error("Error fetching test pack details:", err);
      setError("Failed to load test pack details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const updateTestPackDetails = async (updates: Partial<TestPack>) => {
    if (updating || !testPack) return false;

    try {
      setUpdating(true);
      setError(null);
      
      const updatedPack = await updateTestPack(testPackId, updates);
      setTestPack(updatedPack);
      
      toast({
        title: "Test Pack Updated",
        description: "Test pack has been updated successfully.",
      });
      
      return true;
    } catch (err) {
      console.error("Error updating test pack:", err);
      setError("Failed to update test pack. Please try again.");
      
      toast({
        title: "Error",
        description: "Failed to update test pack. Please try again.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const removeTestPack = async () => {
    if (deleting) return false;

    try {
      setDeleting(true);
      setError(null);
      
      await deleteTestPack(testPackId);
      
      toast({
        title: "Test Pack Deleted",
        description: "Test pack has been deleted successfully.",
      });
      
      return true;
    } catch (err) {
      console.error("Error deleting test pack:", err);
      setError("Failed to delete test pack. Please try again.");
      
      toast({
        title: "Error",
        description: "Failed to delete test pack. Please try again.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (testPackId) {
      fetchTestPackDetails();
    }
  }, [testPackId]);

  return {
    testPack,
    tags,
    loading,
    updating,
    deleting,
    error,
    refresh: fetchTestPackDetails,
    updateTestPack: updateTestPackDetails,
    deleteTestPack: removeTestPack
  };
};
