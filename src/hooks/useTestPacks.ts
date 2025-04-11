
import { useState, useEffect } from 'react';
import { useTestPacksList } from './testpack/useTestPacksList';
import { useTestPackDetail } from './testpack/useTestPackDetail';
import { useTagOperations } from './testpack/useTagOperations';
import { useTestPackCreation } from './testpack/useTestPackCreation';
import { TestPack, Tag } from '@/services/types';

export interface TestPackWithTags {
  testPack: TestPack;
  tags: Tag[];
}

export const useTestPacks = () => {
  const testPacksList = useTestPacksList();
  const testPackDetail = useTestPackDetail('');
  const tagOperations = useTagOperations();
  const testPackCreation = useTestPackCreation();
  
  // Combined loading state
  const [loading, setLoading] = useState(false);
  
  // Update combined loading state when any operation is loading
  useEffect(() => {
    const isLoading = testPacksList.loading || 
                     testPackDetail.loading || 
                     tagOperations.loading || 
                     (testPackCreation.creating || testPackCreation.bulkCreating);
    setLoading(isLoading);
  }, [
    testPacksList.loading,
    testPackDetail.loading,
    tagOperations.loading,
    testPackCreation.creating,
    testPackCreation.bulkCreating
  ]);
  
  return {
    // Test Pack List
    testPacks: testPacksList.testPacks,
    error: testPacksList.error,
    statsData: testPacksList.stats,
    fetchTestPacks: testPacksList.refresh,
    
    // Test Pack Detail
    currentTestPack: testPackDetail.testPack,
    fetchTestPackWithTags: testPackDetail.refresh,
    updateTestPack: testPackDetail.updateTestPack,
    removeTestPack: testPackDetail.deleteTestPack,
    
    // Tag Operations
    addTag: tagOperations.addTag,
    addTagWithRetry: tagOperations.addTag,
    updateTag: (tagId: string, updates: Partial<Tag>) => {
      console.error("updateTag not implemented, using releaseTag as fallback");
      return tagOperations.releaseTag(tagId, new Date().toISOString());
    },
    releaseTag: tagOperations.releaseTag,
    changeTagStatus: (tagId: string, status: string) => {
      if (status === 'liberado') {
        return tagOperations.releaseTag(tagId, new Date().toISOString());
      }
      console.error("changeTagStatus with non-liberado status not implemented");
      return Promise.resolve(false);
    },
    removeTag: tagOperations.removeTag,
    
    // Test Pack Creation
    addTestPack: testPackCreation.createSingleTestPack,
    bulkCreateData: testPackCreation.createMultipleTestPacks,
    
    // Combined state
    loading
  };
};
