
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
import { Edit, Trash2, AlertCircle, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Subsystem, System } from "@/services/types";
import { deleteSubsystem } from "@/services/subsystemService";
import { useToast } from "@/hooks/use-toast";
import { SubsystemFormModal } from "@/components/modals/SubsystemFormModal";

interface SubsystemListProps {
  subsystems: Subsystem[];
  systems: System[];
  loading: boolean;
  onOpenModal: () => void;
  onRefresh: () => Promise<void>;
  selectedProjectId: string | null;
}

export const SubsystemList = ({ 
  subsystems, 
  systems, 
  loading, 
  onOpenModal, 
  onRefresh,
  selectedProjectId 
}: SubsystemListProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingSubsystem, setEditingSubsystem] = useState<Subsystem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      await deleteSubsystem(id);
      toast({
        title: "Success",
        description: "Subsystem deleted successfully",
      });
      onRefresh();
    } catch (error) {
      console.error("Error deleting subsystem:", error);
      toast({
        title: "Error",
        description: "Failed to delete subsystem",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (subsystem: Subsystem) => {
    setEditingSubsystem(subsystem);
    setIsEditModalOpen(true);
  };

  const getSystemName = (systemId: string) => {
    const system = systems.find(s => s.id === systemId);
    return system ? system.name : "Unknown System";
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Subsistemas</CardTitle>
        <Button onClick={onOpenModal} disabled={!selectedProjectId}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Subsistema
        </Button>
      </CardHeader>
      {subsystems.length === 0 ? (
        <CardContent className="flex flex-col items-center justify-center pt-6 pb-6 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No hay subsistemas</h3>
          <p className="text-sm text-muted-foreground">
            Comience agregando un nuevo subsistema para el proyecto seleccionado.
          </p>
        </CardContent>
      ) : (
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Sistema</TableHead>
                <TableHead>Completado</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Fecha Fin</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subsystems.map((subsystem) => (
                <TableRow key={subsystem.id}>
                  <TableCell className="font-medium">{subsystem.name}</TableCell>
                  <TableCell>{getSystemName(subsystem.system_id)}</TableCell>
                  <TableCell>{subsystem.completion_rate !== undefined ? `${subsystem.completion_rate}%` : "—"}</TableCell>
                  <TableCell>
                    {subsystem.start_date ? format(new Date(subsystem.start_date), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell>
                    {subsystem.end_date ? format(new Date(subsystem.end_date), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(subsystem)}
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
                            <AlertDialogTitle>Eliminar subsistema</AlertDialogTitle>
                            <AlertDialogDescription>
                              ¿Está seguro de que desea eliminar este subsistema? Esta acción no se puede deshacer y eliminará todos los ITRs asociados a este subsistema.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(subsystem.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Eliminar
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
      )}

      <SubsystemFormModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        subsystem={editingSubsystem}
        systems={systems}
        onSuccess={() => {
          setIsEditModalOpen(false);
          onRefresh();
        }}
      />
    </Card>
  );
};
