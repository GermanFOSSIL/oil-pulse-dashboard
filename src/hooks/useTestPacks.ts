import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  TestPack,
  TestPackStatsData,
  createTestPack,
  getTestPacks,
  getTestPackStats,
  updateTestPack,
  deleteTestPack,
  releaseTag,
  downloadTemplate,
  exportDataToExcel,
} from "@/services/testPackService";
import { useAuth } from "@/contexts/AuthContext";

export const useTestPacks = () => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const userRole = userProfile?.role || 'user';
  const [selectedTab, setSelectedTab] = useState("list");
  const [testPacks, setTestPacks] = useState<TestPack[] | null>(null);
  const [stats, setStats] = useState<TestPackStatsData | null>(null);
  const [isLoadingTestPacks, setIsLoadingTestPacks] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [selectedTestPack, setSelectedTestPack] = useState<TestPack | null>(null);

  const fetchTestPacks = useCallback(async () => {
    setIsLoadingTestPacks(true);
    try {
      const packs = await getTestPacks();
      setTestPacks(packs);
    } catch (error: any) {
      console.error("Error fetching test packs:", error);
      toast({
        title: "Error",
        description:
          "Failed to fetch test packs. Please check your internet connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTestPacks(false);
    }
  }, [toast]);

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const statsData = await getTestPackStats();
      setStats(statsData);
    } catch (error: any) {
      console.error("Error fetching test pack stats:", error);
      toast({
        title: "Error",
        description:
          "Failed to fetch test pack stats. Please check your internet connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStats(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTestPacks();
    fetchStats();
  }, [fetchTestPacks, fetchStats]);

  const handleFormSuccess = () => {
    setShowFormDialog(false);
    setSelectedTestPack(null);
    fetchTestPacks();
    fetchStats();
    toast({
      title: "Success",
      description: "Test pack saved successfully.",
    });
  };

  const handleImportSuccess = () => {
    setShowImportDialog(false);
    fetchTestPacks();
    fetchStats();
    toast({
      title: "Success",
      description: "Test packs imported successfully.",
    });
  };

  const openNewTestPackForm = () => {
    setSelectedTestPack(null);
    setShowFormDialog(true);
  };

  const openEditTestPackForm = (testPack: TestPack) => {
    setSelectedTestPack(testPack);
    setShowFormDialog(true);
  };

  const openImportDialog = () => {
    setShowImportDialog(true);
  };

  const handleCreateTestPack = async (data: Omit<TestPack, "id">) => {
    try {
      await createTestPack(data);
      toast({
        title: "Success",
        description: "Test pack created successfully.",
      });
      fetchTestPacks(); // Refresh test packs after creating
      fetchStats(); // Refresh stats after creating
    } catch (error: any) {
      console.error("Error creating test pack:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to create test pack. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTestPack = async (
    id: string,
    data: Partial<Omit<TestPack, "id">>
  ) => {
    try {
      await updateTestPack(id, data);
      toast({
        title: "Success",
        description: "Test pack updated successfully.",
      });
      fetchTestPacks(); // Refresh test packs after updating
      fetchStats(); // Refresh stats after updating
    } catch (error: any) {
      console.error("Error updating test pack:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to update test pack. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTestPack = async (id: string) => {
    try {
      await deleteTestPack(id);
      toast({
        title: "Success",
        description: "Test pack deleted successfully.",
      });
      fetchTestPacks(); // Refresh test packs after deleting
      fetchStats(); // Refresh stats after deleting
    } catch (error: any) {
      console.error("Error deleting test pack:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to delete test pack. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTagRelease = async (tagId: string) => {
    try {
      await releaseTag(tagId);
      toast({
        title: "Success",
        description: "Tag released successfully.",
      });
      fetchTestPacks(); // Refresh test packs after releasing tag
      fetchStats(); // Refresh stats after releasing tag
    } catch (error: any) {
      console.error("Error releasing tag:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to release tag. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const url = await downloadTemplate();
       // Trigger the download by creating a temporary link
       const link = document.createElement('a');
       link.href = url;
       link.setAttribute('download', 'TestPacks_Template.xlsx'); // Set the filename
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
      toast({
        title: "Success",
        description: "Template downloaded successfully.",
      });
    } catch (error: any) {
      console.error("Error downloading template:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to download template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportData = async () => {
    try {
      await exportDataToExcel();
      toast({
        title: "Success",
        description: "Data exported successfully.",
      });
    } catch (error: any) {
      console.error("Error exporting data:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const refetchTestPacks = () => {
    fetchTestPacks();
  };

  return {
    selectedTab,
    testPacks,
    stats,
    isLoadingTestPacks,
    isLoadingStats,
    showImportDialog,
    showFormDialog,
    selectedTestPack,
    userRole,
    setSelectedTab,
    setTestPacks,
    setStats,
    setIsLoadingTestPacks,
    setIsLoadingStats,
    setShowImportDialog,
    setShowFormDialog,
    setSelectedTestPack,
    fetchTestPacks,
    fetchStats,
    handleCreateTestPack,
    handleUpdateTestPack,
    handleDeleteTestPack,
    handleTagRelease,
    handleDownloadTemplate,
    handleExportData,
    refetchTestPacks,
    openNewTestPackForm,
    openEditTestPackForm,
    openImportDialog,
    handleFormSuccess,
    handleImportSuccess,
  };
};
