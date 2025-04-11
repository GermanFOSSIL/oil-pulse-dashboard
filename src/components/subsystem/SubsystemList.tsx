
import React, { useState } from "react";
import { Subsystem, System } from "@/services/types";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, Plus } from "lucide-react";
import { deleteSubsystem } from "@/services/subsystemService";
import { useToast } from "@/hooks/use-toast";
import { EmptyPlaceholder } from "@/components/ui/EmptyPlaceholder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SubsystemListProps {
  subsystems: Subsystem[];
  systems: System[];
  loading: boolean;
  selectedProjectId: string | null;
  onOpenModal: () => void;
  onRefresh: () => void;
}

const SubsystemList: React.FC<SubsystemListProps> = ({ 
  subsystems, 
  systems, 
  loading, 
  selectedProjectId,
  onOpenModal,
  onRefresh 
}) => {
  const [subsystemToDelete, setSubsystemToDelete] = useState<Subsystem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteClick = (subsystem: Subsystem) => {
    setSubsystemToDelete(subsystem);
  };

  const handleConfirmDelete = async () => {
    if (!subsystemToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteSubsystem(subsystemToDelete.id);
      toast({
        title: "Subsystem Deleted",
        description: "The subsystem has been successfully deleted.",
      });
      onRefresh();
    } catch (error) {
      console.error("Error deleting subsystem:", error);
      toast({
        title: "Error",
        description: "Failed to delete the subsystem. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setSubsystemToDelete(null);
    }
  };

  // Find system name for each subsystem
  const getSystemName = (systemId: string) => {
    const system = systems.find(s => s.id === systemId);
    return system ? system.name : 'Unknown System';
  };

  if (loading) {
    return <div className="py-8 text-center">Loading subsystems...</div>;
  }

  if (subsystems.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Subsystems</CardTitle>
            <Button onClick={onOpenModal} className="ml-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Subsystem
            </Button>
          </CardHeader>
          <CardContent>
            <EmptyPlaceholder
              title="No Subsystems Found"
              description={selectedProjectId ? "Get started by creating your first subsystem for this project." : "Select a project first to see subsystems."}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Subsystems ({subsystems.length})</h2>
        <Button onClick={onOpenModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subsystem
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>System</TableHead>
            <TableHead>Completion Rate</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subsystems.map((subsystem) => (
            <TableRow key={subsystem.id}>
              <TableCell className="font-medium">{subsystem.name}</TableCell>
              <TableCell>{getSystemName(subsystem.system_id)}</TableCell>
              <TableCell>{subsystem.completion_rate || 0}%</TableCell>
              <TableCell>
                {subsystem.start_date ? format(new Date(subsystem.start_date), "MMM d, yyyy") : "N/A"}
              </TableCell>
              <TableCell>
                {subsystem.end_date ? format(new Date(subsystem.end_date), "MMM d, yyyy") : "N/A"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(subsystem)}
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

      <AlertDialog open={!!subsystemToDelete} onOpenChange={(open) => !open && setSubsystemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the subsystem "{subsystemToDelete?.name}". This action cannot be undone.
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

export default SubsystemList;
