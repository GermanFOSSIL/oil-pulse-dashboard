import React, { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyPlaceholder } from "@/components/ui/EmptyPlaceholder";
import { ITRWithDetails, ITRWithActions } from "@/types/itr-types";
import { Subsystem, System } from "@/services/types";
import ITRFormModal from "@/components/modals/ITRFormModal";
import { deleteITR } from "@/services/itrDataService";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2 } from "lucide-react";

// Update the ITRListProps interface to include onAddSampleData
interface ITRListProps {
  itrs: ITRWithDetails[];
  subsystems: Subsystem[];
  systems: System[];
  loading: boolean;
  selectedProjectId: string;
  onRefresh: () => Promise<void>;
  onAddSampleData: () => Promise<void>;
  addingSampleData: boolean;
}

const ITRList: React.FC<ITRListProps> = ({
  itrs,
  subsystems,
  systems,
  loading,
  selectedProjectId,
  onRefresh,
  onAddSampleData,
  addingSampleData
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedITR, setSelectedITR] = useState<ITRWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [ITRToDelete, setITRToDelete] = useState<ITRWithDetails | null>(null);
  const { toast } = useToast();

  const handleOpenModal = (itr?: ITRWithDetails) => {
    setSelectedITR(itr || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedITR(null);
  };

  const handleEditITR = (itr: ITRWithDetails) => {
    setSelectedITR(itr);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (itr: ITRWithDetails) => {
    setITRToDelete(itr);
  };

  const handleConfirmDelete = async () => {
    if (!ITRToDelete) return;

    setIsDeleting(true);
    try {
      await deleteITR(ITRToDelete.id);
      toast({
        title: "ITR Deleted",
        description: "The ITR has been successfully deleted.",
      });
      onRefresh();
    } catch (error) {
      console.error("Error deleting ITR:", error);
      toast({
        title: "Error",
        description: "Failed to delete the ITR. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setITRToDelete(null);
    }
  };

  const getSubsystemName = (subsystemId: string) => {
    const subsystem = subsystems.find((s) => s.id === subsystemId);
    return subsystem ? subsystem.name : "Unknown Subsystem";
  };

  const getSystemName = (systemId: string) => {
    const system = systems.find((s) => s.id === systemId);
    return system ? system.name : "Unknown System";
  };

  if (loading) {
    return <div className="py-8 text-center">Loading ITRs...</div>;
  }

  if (itrs.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>ITRs</CardTitle>
          <Button onClick={() => handleOpenModal()} disabled={addingSampleData}>
            Add ITR
          </Button>
        </CardHeader>
        <CardContent>
          <EmptyPlaceholder
            title="No ITRs Found"
            description="Get started by creating your first ITR."
          />
          <Button onClick={onAddSampleData} disabled={addingSampleData}>
            {addingSampleData ? "Adding Sample Data..." : "Add Sample Data"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // When showing ITRFormModal, ensure all required props are passed correctly
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>ITRs</CardTitle>
          <Button onClick={() => handleOpenModal()} disabled={addingSampleData}>
            Add ITR
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Subsystem</TableHead>
                <TableHead>System</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itrs.map((itr) => (
                <TableRow key={itr.id}>
                  <TableCell className="font-medium">{itr.name}</TableCell>
                  <TableCell>{getSubsystemName(itr.subsystem_id)}</TableCell>
                  <TableCell>{getSystemName(itr.subsystem_id)}</TableCell>
                  <TableCell>{itr.status}</TableCell>
                  <TableCell>{itr.progress}%</TableCell>
                  <TableCell>{itr.assigned_to}</TableCell>
                  <TableCell>
                    {itr.start_date
                      ? format(new Date(itr.start_date), "MMM d, yyyy", {
                          locale: es,
                        })
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {itr.end_date
                      ? format(new Date(itr.end_date), "MMM d, yyyy", {
                          locale: es,
                        })
                      : "N/A"}
                  </TableCell>
                  <TableCell>{itr.quantity}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditITR(itr)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(itr)}
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
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={onAddSampleData} disabled={addingSampleData}>
            {addingSampleData ? "Adding Sample Data..." : "Add Sample Data"}
          </Button>
        </CardFooter>
      </Card>

      {isModalOpen && (
        <ITRFormModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          itr={selectedITR as ITRWithActions}
          systems={systems}
          subsystems={subsystems}
          onSuccess={() => {
            setIsModalOpen(false);
            onRefresh();
          }}
        />
      )}

      <AlertDialog open={!!ITRToDelete} onOpenChange={(open) => !open && setITRToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the ITR "{ITRToDelete?.name}".
              This action cannot be undone.
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

export default ITRList;
