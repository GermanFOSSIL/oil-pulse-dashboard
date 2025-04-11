
import React, { useState } from "react";
import { System, Project } from "@/services/types";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { deleteSystem } from "@/services/systemService";
import { useToast } from "@/hooks/use-toast";
import { EmptyPlaceholder } from "@/components/ui/EmptyPlaceholder";

interface SystemListProps {
  systems: System[];
  loading: boolean;
  selectedProjectId: string | null;
  onRefresh: () => void;
}

const SystemList: React.FC<SystemListProps> = ({ systems, loading, selectedProjectId, onRefresh }) => {
  const [systemToDelete, setSystemToDelete] = useState<System | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteClick = (system: System) => {
    setSystemToDelete(system);
  };

  const handleConfirmDelete = async () => {
    if (!systemToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteSystem(systemToDelete.id);
      toast({
        title: "System Deleted",
        description: "The system has been successfully deleted.",
      });
      onRefresh();
    } catch (error) {
      console.error("Error deleting system:", error);
      toast({
        title: "Error",
        description: "Failed to delete the system. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setSystemToDelete(null);
    }
  };

  if (loading) {
    return <div className="py-8 text-center">Loading systems...</div>;
  }

  if (systems.length === 0 && selectedProjectId) {
    return (
      <EmptyPlaceholder
        title="No Systems Found"
        description="Get started by creating your first system for this project."
      />
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Completion Rate</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {systems.map((system) => (
            <TableRow key={system.id}>
              <TableCell className="font-medium">{system.name}</TableCell>
              <TableCell>{system.completion_rate || 0}%</TableCell>
              <TableCell>
                {system.start_date ? format(new Date(system.start_date), "MMM d, yyyy") : "N/A"}
              </TableCell>
              <TableCell>
                {system.end_date ? format(new Date(system.end_date), "MMM d, yyyy") : "N/A"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(system)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!systemToDelete} onOpenChange={(open) => !open && setSystemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the system "{systemToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SystemList;
