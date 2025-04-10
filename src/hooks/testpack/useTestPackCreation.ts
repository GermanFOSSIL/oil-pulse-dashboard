
import { useState } from "react";
import { createTestPack, bulkCreateTestPacksAndTags } from "@/services/testPackService";
import { TestPack, Tag } from "@/services/types";
import { useToast } from "@/hooks/use-toast";

export const useTestPackCreation = (onSuccess?: () => void) => {
  const [creating, setCreating] = useState(false);
  const [bulkCreating, setBulkCreating] = useState(false);
  const { toast } = useToast();

  const createSingleTestPack = async (testPackData: Omit<TestPack, "id" | "created_at" | "updated_at">) => {
    if (creating) return;

    try {
      setCreating(true);
      const createdPack = await createTestPack(testPackData);
      
      toast({
        title: "Test Pack Created",
        description: "Test pack has been created successfully.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      return createdPack;
    } catch (error) {
      console.error("Error creating test pack:", error);
      toast({
        title: "Error",
        description: "Failed to create test pack. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setCreating(false);
    }
  };

  const createMultipleTestPacks = async (
    testPacks: Omit<TestPack, "id" | "created_at" | "updated_at">[],
    tagsByPack: { [packIndex: number]: Omit<Tag, "id" | "created_at" | "updated_at" | "test_pack_id">[] }
  ) => {
    if (bulkCreating) return;

    try {
      setBulkCreating(true);
      
      const result = await bulkCreateTestPacksAndTags(testPacks, tagsByPack);
      
      toast({
        title: "Bulk Creation Successful",
        description: `Created ${result.testPacks.length} test packs and ${result.tags.length} tags.`,
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      return result;
    } catch (error) {
      console.error("Error in bulk creation:", error);
      toast({
        title: "Error",
        description: "Failed to create test packs. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setBulkCreating(false);
    }
  };

  return {
    creating,
    bulkCreating,
    createSingleTestPack,
    createMultipleTestPacks
  };
};
