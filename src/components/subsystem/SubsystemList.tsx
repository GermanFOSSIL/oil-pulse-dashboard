
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { deleteSubsystem } from "@/services/supabaseService";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SubsystemListProps {
  subsystems: any;
  systems: any;
  loading: any;
  onOpenModal: any;
  onRefresh: any;
  selectedProjectId: any;
  onEdit: any;
  onDelete: any;
}

const SubsystemList = ({
  subsystems,
  systems,
  loading,
  onOpenModal,
  onRefresh,
  selectedProjectId,
  onEdit,
  onDelete
}: SubsystemListProps) => {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (subsystemId: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este subsistema?")) {
      return;
    }

    setDeletingId(subsystemId);
    try {
      await deleteSubsystem(subsystemId);
      toast({
        title: "Subsistema eliminado",
        description: "El subsistema ha sido eliminado correctamente",
      });
      onRefresh();
    } catch (error) {
      console.error("Error al eliminar subsistema:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el subsistema",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getSystemName = (systemId: string) => {
    const system = systems.find((s: any) => s.id === systemId);
    return system ? system.name : "N/A";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Subsistemas</CardTitle>
        <Button onClick={onOpenModal}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Subsistema
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Sistema</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subsystems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No hay subsistemas disponibles para el proyecto seleccionado.
                    </TableCell>
                  </TableRow>
                ) : (
                  subsystems.map((subsystem: any) => (
                    <TableRow key={subsystem.id}>
                      <TableCell className="font-medium">{subsystem.name}</TableCell>
                      <TableCell>{getSystemName(subsystem.system_id)}</TableCell>
                      <TableCell>{formatDate(subsystem.start_date)}</TableCell>
                      <TableCell>{formatDate(subsystem.end_date)}</TableCell>
                      <TableCell>{subsystem.completion_rate || 0}%</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onEdit(subsystem)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onDelete(subsystem.id)}
                            disabled={deletingId === subsystem.id}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubsystemList;
