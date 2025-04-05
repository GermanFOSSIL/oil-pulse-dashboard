
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getITRs, ITR, getSubsystems, Subsystem, deleteITR } from "@/services/supabaseService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ITRFormModal } from "@/components/modals/ITRFormModal";

interface ITRWithDetails extends ITR {
  subsystemName?: string;
  systemName?: string;
  projectName?: string;
}

const ITRs = () => {
  const [itrs, setITRs] = useState<ITRWithDetails[]>([]);
  const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedITR, setSelectedITR] = useState<ITR | undefined>(undefined);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itrsData, subsystemsData] = await Promise.all([
        getITRs(),
        getSubsystems()
      ]);
      
      // Enrich ITRs with subsystem details
      const enrichedITRs = itrsData.map(itr => {
        const relatedSubsystem = subsystemsData.find(sub => sub.id === itr.subsystem_id);
        return {
          ...itr,
          subsystemName: relatedSubsystem?.name || 'Subsistema Desconocido'
        };
      });
      
      setITRs(enrichedITRs);
      setSubsystems(subsystemsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de ITRs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      header: "Asignado a",
      accessorKey: "assigned_to" as const,
      cell: (itr: ITRWithDetails) => <span>{itr.assigned_to || 'No Asignado'}</span>,
    },
    {
      header: "Fecha Límite",
      accessorKey: "due_date" as const,
      cell: (itr: ITRWithDetails) => <span>{itr.due_date ? new Date(itr.due_date).toLocaleDateString('es-ES') : 'Sin Fecha'}</span>,
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
        fetchData();
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
    fetchData();
    setShowModal(false);
    setSelectedITR(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ITRs</h1>
          <p className="text-muted-foreground">
            Gestión de Registros de Inspección (ITRs)
          </p>
        </div>
        <Button onClick={handleNewITR}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo ITR
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
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
      </div>

      {filteredITRs.length === 0 && !loading ? (
        <Card>
          <CardHeader>
            <CardTitle>No hay ITRs</CardTitle>
            <CardDescription>
              No se encontraron registros de inspección en la base de datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Puede importar datos utilizando la función de importación en la página de configuración.</p>
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
          subsystems={subsystems}
        />
      )}
    </div>
  );
};

export default ITRs;
