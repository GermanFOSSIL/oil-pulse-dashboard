
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ITRWithDetails } from "@/types/itr-types";
import { Plus, Database } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ITRFormModal } from "@/components/modals/ITRFormModal";
import { Subsystem, deleteITR } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";

interface ITRListProps {
  itrs: ITRWithDetails[];
  subsystems: Subsystem[];
  systems: any[];
  loading: boolean;
  selectedProjectId: string | null;
  onRefresh: () => void;
  onAddSampleData: () => void;
  addingSampleData: boolean;
}

export const ITRList = ({ 
  itrs, 
  subsystems, 
  systems, 
  loading, 
  selectedProjectId,
  onRefresh,
  onAddSampleData,
  addingSampleData
}: ITRListProps) => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedITR, setSelectedITR] = useState<ITRWithDetails | undefined>(undefined);
  const { toast } = useToast();

  const columns = [
    {
      header: "Nombre ITR",
      accessorKey: "name" as const,
    },
    {
      header: "Subsistema",
      accessorKey: "subsystemName" as const,
    },
    {
      header: "Sistema",
      accessorKey: "systemName" as const,
      cell: (itr: ITRWithDetails) => <span>{itr.systemName || 'No disponible'}</span>,
    },
    {
      header: "Asignado a",
      accessorKey: "assigned_to" as const,
      cell: (itr: ITRWithDetails) => <span>{itr.assigned_to || 'No Asignado'}</span>,
    },
    {
      header: "Fecha Inicio",
      accessorKey: "start_date" as const,
      cell: (itr: ITRWithDetails) => <span>{itr.start_date ? new Date(itr.start_date).toLocaleDateString('es-ES') : 'Sin Fecha'}</span>,
    },
    {
      header: "Fecha Límite",
      accessorKey: "end_date" as const,
      cell: (itr: ITRWithDetails) => <span>{itr.end_date ? new Date(itr.end_date).toLocaleDateString('es-ES') : 'Sin Fecha'}</span>,
    },
    {
      header: "Estado",
      accessorKey: "status" as const,
      cell: (itr: ITRWithDetails) => <StatusBadge status={itr.status} />,
    },
    {
      header: "Progreso",
      accessorKey: "progress" as const,
      cell: (itr: ITRWithDetails) => (
        <div className="w-full bg-secondary/10 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${
              itr.status === "complete"
                ? "bg-status-complete"
                : itr.status === "delayed"
                ? "bg-status-delayed"
                : "bg-status-inprogress"
            }`}
            style={{ width: `${itr.progress || 0}%` }}
          ></div>
        </div>
      ),
    },
  ];

  const filteredITRs =
    statusFilter === "all"
      ? itrs
      : itrs.filter((itr) => itr.status === statusFilter);

  const handleEditITR = (itr: ITRWithDetails) => {
    setSelectedITR(itr);
    setShowModal(true);
  };

  const handleDeleteITR = async (itr: ITRWithDetails) => {
    if (confirm(`¿Está seguro que desea eliminar ${itr.name}?`)) {
      try {
        await deleteITR(itr.id);
        toast({
          title: "ITR eliminado",
          description: "El ITR ha sido eliminado correctamente",
        });
        onRefresh();
      } catch (error) {
        console.error("Error al eliminar ITR:", error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el ITR",
          variant: "destructive"
        });
      }
    }
  };

  const handleNewITR = () => {
    setSelectedITR(undefined);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedITR(undefined);
  };

  const handleModalSuccess = () => {
    onRefresh();
    setShowModal(false);
    setSelectedITR(undefined);
  };

  if (!selectedProjectId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seleccione un proyecto</CardTitle>
          <CardDescription>
            Por favor seleccione un proyecto para ver y gestionar sus ITRs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Para gestionar ITRs, primero seleccione un proyecto de la lista desplegable en la parte superior.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="w-[180px]">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="complete">Completado</SelectItem>
              <SelectItem value="inprogress">En Progreso</SelectItem>
              <SelectItem value="delayed">Retrasado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleNewITR}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo ITR
          </Button>
          <Button onClick={onAddSampleData} variant="outline" disabled={addingSampleData}>
            <Database className="h-4 w-4 mr-2" />
            {addingSampleData ? "Añadiendo datos..." : "Añadir datos de muestra"}
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-10">
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      ) : filteredITRs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No hay ITRs</CardTitle>
            <CardDescription>
              No se encontraron registros de inspección para el proyecto seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Puede crear un nuevo ITR usando el botón "Nuevo ITR" o importar datos desde la página de configuración.</p>
            <p className="mt-4">También puede utilizar el botón "Añadir datos de muestra" para generar ITRs de ejemplo.</p>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          data={filteredITRs}
          columns={columns}
          onEdit={handleEditITR}
          onDelete={handleDeleteITR}
          loading={loading}
        />
      )}

      {showModal && (
        <ITRFormModal
          open={showModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          itr={selectedITR}
          subsystems={subsystems.filter(subsystem => 
            systems.some(system => system.id === subsystem.system_id)
          )}
        />
      )}
    </>
  );
};
