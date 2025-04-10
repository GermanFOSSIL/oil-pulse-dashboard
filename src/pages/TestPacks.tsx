
import { useState } from "react";
import { useTestPacksList } from "@/hooks/testpack/useTestPacksList";
import { TestPacksHeader } from "@/components/testpack/TestPacksHeader";
import { TestPacksSearch } from "@/components/testpack/TestPacksSearch";
import { TestPackStats } from "@/components/testpack/TestPackStats";
import { TestPackList } from "@/components/testpack/TestPackList";
import { TestPacksExportButtons } from "@/components/testpack/TestPacksExportButtons";
import { TestPackFormModal } from "@/components/testpack/TestPackFormModal";
import { TestPacksErrorState } from "@/components/testpack/TestPacksErrorState";
import { TestPackSkeleton } from "@/components/testpack/TestPackSkeleton";
import { BatchUploadModal } from "@/components/testpack/BatchUploadModal";
import { TestPack } from "@/services/types";

const TestPacks = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { testPacks, stats, loading, error, refresh } = useTestPacksList();

  const filteredTestPacks = testPacks.filter((testPack) => {
    const query = searchQuery.toLowerCase();
    return (
      testPack.nombre_paquete.toLowerCase().includes(query) ||
      testPack.sistema.toLowerCase().includes(query) ||
      testPack.subsistema.toLowerCase().includes(query) ||
      testPack.estado.toLowerCase().includes(query)
    );
  });

  // Handle search input
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle "Add Test Pack" button click
  const handleAddClick = () => {
    setIsFormModalOpen(true);
  };

  // Handle "Batch Upload" button click
  const handleBatchUploadClick = () => {
    setIsUploadModalOpen(true);
  };

  // Handle successful creation/update
  const handleSuccess = () => {
    refresh();
    setIsFormModalOpen(false);
    setIsUploadModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <TestPacksHeader
        onAddClick={handleAddClick}
        onBatchUploadClick={handleBatchUploadClick}
      />

      <TestPackStats />

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <TestPacksSearch onSearch={handleSearch} />
        <TestPacksExportButtons testPacks={filteredTestPacks} />
      </div>

      {error ? (
        <TestPacksErrorState error={error} onRetry={refresh} />
      ) : loading ? (
        <TestPackSkeleton />
      ) : (
        <TestPackList testPacks={filteredTestPacks} onRefresh={refresh} />
      )}

      <TestPackFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleSuccess}
      />

      <BatchUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default TestPacks;
