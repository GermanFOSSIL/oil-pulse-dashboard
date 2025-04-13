
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getITRsWithDetails, deleteITR } from '@/services/itrService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Plus, Search, Trash, Edit, Eye, FilterX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ProjectSelector } from '@/components/ProjectSelector';
import { ITRFormModal } from '@/components/modals/ITRFormModal';
import ITRList from '@/components/itr/ITRList';
import { ITRWithDetails } from '@/types/itr-types';

const ITRs = () => {
  const { toast } = useToast();
  const [itrs, setITRs] = useState<ITRWithDetails[]>([]);
  const [filteredITRs, setFilteredITRs] = useState<ITRWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedITR, setSelectedITR] = useState<ITRWithDetails | null>(null);

  const fetchITRs = async () => {
    setLoading(true);
    try {
      const fetchedITRs = await getITRsWithDetails(selectedProjectId || null);
      setITRs(fetchedITRs);
      filterITRs(fetchedITRs, selectedProjectId, searchQuery);
    } catch (error) {
      console.error('Error fetching ITRs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ITRs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchITRs();
  }, [toast, selectedProjectId]);

  const filterITRs = (itrList: ITRWithDetails[], projectId: string | null, query: string) => {
    let filtered = [...itrList];

    if (projectId) {
      filtered = filtered.filter(itr => {
        // This assumes there's a project property on the ITR that has an id
        const projectMatch = itr.projectId === projectId;
        return projectMatch;
      });
    }

    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(itr => 
        itr.name.toLowerCase().includes(lowerQuery) ||
        (itr.subsystemName && itr.subsystemName.toLowerCase().includes(lowerQuery)) ||
        (itr.systemName && itr.systemName.toLowerCase().includes(lowerQuery))
      );
    }

    setFilteredITRs(filtered);
  };

  useEffect(() => {
    filterITRs(itrs, selectedProjectId, searchQuery);
  }, [selectedProjectId, searchQuery, itrs]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearFilters = () => {
    setSelectedProjectId(null);
    setSearchQuery('');
  };

  const handleProjectSelect = (projectId: string | null) => {
    setSelectedProjectId(projectId);
  };

  const handleAddITR = () => {
    setSelectedITR(null);
    setIsModalOpen(true);
  };

  const handleEditITR = (itr: ITRWithDetails) => {
    setSelectedITR(itr);
    setIsModalOpen(true);
  };

  const handleDeleteITR = async (itr: ITRWithDetails) => {
    try {
      await deleteITR(itr.id);
      toast({
        title: 'Success',
        description: 'ITR deleted successfully',
        variant: 'default',
      });
      fetchITRs();
    } catch (error) {
      console.error('Error deleting ITR:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete ITR',
        variant: 'destructive',
      });
    }
  };

  const itrsWithActions = filteredITRs.map(itr => ({
    ...itr,
    progress: itr.progress || 0, // Ensure progress is defined
    onEdit: () => handleEditITR(itr),
    onDelete: () => handleDeleteITR(itr),
    onView: () => {/* View implementation */}
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ITRs</h1>
          <p className="text-muted-foreground">
            Manage Inspection Test Records
          </p>
        </div>
        <Button onClick={handleAddITR}>
          <Plus className="mr-2 h-4 w-4" />
          Add ITR
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ITRs..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-8"
                />
              </div>
            </div>
            <ProjectSelector 
              onSelectProject={handleProjectSelect}
              selectedProjectId={selectedProjectId}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              disabled={!selectedProjectId && !searchQuery}
            >
              <FilterX className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <ITRList
        itrs={itrsWithActions}
        loading={loading}
      />

      <ITRFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        itr={selectedITR}
        onSuccess={fetchITRs}
      />
    </div>
  );
};

export default ITRs;
