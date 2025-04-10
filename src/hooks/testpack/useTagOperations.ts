
import { useState } from "react";
import { createTag, updateTag, deleteTag, logTagAction } from "@/services/testPackService";
import { Tag } from "@/services/types";
import { useToast } from "@/hooks/use-toast";

export const useTagOperations = (onSuccess?: () => void) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const addTag = async (tagData: Omit<Tag, "id" | "created_at" | "updated_at">) => {
    if (loading) return null;

    try {
      setLoading(true);
      setError(null);
      
      const result = await createTag(tagData);
      
      toast({
        title: "Tag Created",
        description: "Tag has been created successfully.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      return result;
    } catch (err) {
      const errorMessage = "Failed to create tag. Please try again.";
      console.error(errorMessage, err);
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  const releaseTag = async (tagId: string, fecha_liberacion: string) => {
    if (loading) return false;

    try {
      setLoading(true);
      setError(null);
      
      await updateTag(tagId, {
        estado: "liberado",
        fecha_liberacion
      });
      
      toast({
        title: "Tag Released",
        description: "Tag has been released successfully.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      return true;
    } catch (err) {
      const errorMessage = "Failed to release tag. Please try again.";
      console.error(errorMessage, err);
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeTag = async (tagId: string) => {
    if (loading) return false;

    try {
      setLoading(true);
      setError(null);
      
      await deleteTag(tagId);
      
      toast({
        title: "Tag Deleted",
        description: "Tag has been deleted successfully.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      return true;
    } catch (err) {
      const errorMessage = "Failed to delete tag. Please try again.";
      console.error(errorMessage, err);
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    addTag,
    releaseTag,
    removeTag
  };
};
