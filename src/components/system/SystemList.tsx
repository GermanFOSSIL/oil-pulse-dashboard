
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { deleteSystem } from "@/services/supabaseService";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SystemListProps {
  systems: any;
  loading: any;
  onRefresh: any;
  selectedProjectId: any;
  onEdit: any;
  onDelete: any;
}

const SystemList = ({ systems, loading, onRefresh, selectedProjectId, onEdit, onDelete }: SystemListProps) => {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (systemId: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este sistema?")) {
      return;
    }

    setDeletingId(systemId);
    try {
      await deleteSystem(systemId);
      toast({
        title: "Sistema eliminado",
        description: "El sistema ha sido eliminado correctamente",
      });
      onRefresh();
    } catch (error) {
      console.error("Error al eliminar sistema:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el sistema",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
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
      <CardHeader>
        <CardTitle>Sistemas</CardTitle>
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
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No hay sistemas disponibles.
                    </TableCell>
                  </TableRow>
                ) : (
                  systems.map((system: any) => (
                    <TableRow key={system.id}>
                      <TableCell className="font-medium">{system.name}</TableCell>
                      <TableCell>{system.project_name || "N/A"}</TableCell>
                      <TableCell>{formatDate(system.start_date)}</TableCell>
                      <TableCell>{formatDate(system.end_date)}</TableCell>
                      <TableCell>{system.completion_rate || 0}%</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onEdit(system)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onDelete(system.id)}
                            disabled={deletingId === system.id}
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

export default SystemList;
