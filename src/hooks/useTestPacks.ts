
import { useState, useEffect } from 'react';
import { useTestPacksList } from './testpack/useTestPacksList';
import { useTestPackDetail, TestPackWithTags } from './testpack/useTestPackDetail';
import { useTagOperations } from './testpack/useTagOperations';
import { useTestPackCreation } from './testpack/useTestPackCreation';

export type { TestPackWithTags } from './testpack/useTestPackDetail';

export const useTestPacks = () => {
  const testPacksList = useTestPacksList();
  const testPackDetail = useTestPackDetail();
  const tagOperations = useTagOperations();
  const testPackCreation = useTestPackCreation();
  
  // Combined loading state
  const [loading, setLoading] = useState(false);
  
  // Update combined loading state when any operation is loading
  useEffect(() => {
    const isLoading = testPacksList.loading || 
                     testPackDetail.loading || 
                     tagOperations.loading || 
                     testPackCreation.loading;
    setLoading(isLoading);
  }, [
    testPacksList.loading,
    testPackDetail.loading,
    tagOperations.loading,
    testPackCreation.loading
  ]);
  
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await testPacksList.fetchTestPacks();
        await testPacksList.fetchTestPacksStats();
      } catch (err) {
        console.error("Error loading initial data:", err);
      }
    };
    
    loadInitialData();
  }, []);
  
  return {
    // Test Pack List
    testPacks: testPacksList.testPacks,
    error: testPacksList.error,
    statsData: testPacksList.statsData,
    fetchTestPacks: testPacksList.fetchTestPacks,
    fetchTestPacksStats: testPacksList.fetchTestPacksStats,
    fetchTestPacksByITR: testPacksList.fetchTestPacksByITR,
    
    // Test Pack Detail
    currentTestPack: testPackDetail.currentTestPack,
    fetchTestPackWithTags: testPackDetail.fetchTestPackWithTags,
    updateTestPack: testPackDetail.updateTestPack,
    removeTestPack: testPackDetail.removeTestPack,
    
    // Tag Operations
    addTag: tagOperations.addTag,
    addTagWithRetry: tagOperations.addTagWithRetry,
    updateTag: tagOperations.updateTag,
    releaseTag: tagOperations.releaseTag,
    changeTagStatus: tagOperations.changeTagStatus,
    removeTag: tagOperations.removeTag,
    
    // Test Pack Creation
    addTestPack: testPackCreation.addTestPack,
    bulkCreateData: testPackCreation.bulkCreateData,
    
    // Combined state
    loading
  };
};
