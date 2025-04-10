
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { System } from "@/services/types";
import { deleteSystem } from "@/services/systemService";
import { useToast } from "@/hooks/use-toast";
import { SystemFormModal } from "@/components/modals/SystemFormModal";

interface SystemListProps {
  systems: System[];
  loading: boolean;
  selectedProjectId: string | null;
  onRefresh: () => void;
}

export const SystemList = ({ systems, loading, selectedProjectId, onRefresh }: SystemListProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingSystem, setEditingSystem] = useState<System | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      await deleteSystem(id);
      toast({
        title: "Success",
        description: "System deleted successfully",
      });
      onRefresh();
    } catch (error) {
      console.error("Error deleting system:", error);
      toast({
        title: "Error",
        description: "Failed to delete system",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (system: System) => {
    setEditingSystem(system);
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (systems.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No systems found</h3>
          <p className="text-sm text-muted-foreground">
            {selectedProjectId 
              ? "Get started by creating a new system for this project." 
              : "Please select a project to view its systems."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
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
                  <TableCell>{system.completion_rate !== undefined ? `${system.completion_rate}%` : "—"}</TableCell>
                  <TableCell>
                    {system.start_date ? format(new Date(system.start_date), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell>
                    {system.end_date ? format(new Date(system.end_date), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(system)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete system</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this system? This action cannot be undone and will delete all subsystems and ITRs associated with this system.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(system.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SystemFormModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        system={editingSystem}
        projects={[]}
        onSuccess={() => {
          setIsEditModalOpen(false);
          onRefresh();
        }}
        defaultProjectId={selectedProjectId || undefined}
      />
    </>
  );
};
