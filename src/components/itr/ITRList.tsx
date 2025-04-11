
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ITRWithDetails } from "@/types/itr-types";
import { Plus, Database, CheckCircle2, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ITRFormModal } from "@/components/modals/ITRFormModal";
import { Subsystem, deleteITR, updateITR } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";
import { System } from "@/services/types";

interface ITRListProps {
  itrs: ITRWithDetails[];
  subsystems: Subsystem[];
  systems: System[];
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
  const [systemFilter, setSystemFilter] = useState<string>("all");
  const [subsystemFilter, setSubsystemFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedITR, setSelectedITR] = useState<ITRWithDetails | undefined>(undefined);
  const [markingComplete, setMarkingComplete] = useState<string | null>(null);
  const { toast } = useToast();

  // Modify the ITRWithDetails type to include actions dynamically
  type ITRWithActions = ITRWithDetails & { actions?: string };

  const columns = [
    {
      header: "Nombre ITR",
      accessorKey: "name" as keyof ITRWithActions,
    },
    {
      header: "Subsistema",
      accessorKey: "subsystemName" as keyof ITRWithActions,
    },
    {
      header: "Sistema",
      accessorKey: "systemName" as keyof ITRWithActions,
      cell: (item: ITRWithActions) => <span>{item.systemName || 'No disponible'}</span>,
    },
    {
      header: "Asignado a",
      accessorKey: "assigned_to" as keyof ITRWithActions,
      cell: (item: ITRWithActions) => <span>{item.assigned_to || 'No Asignado'}</span>,
    },
    {
      header: "Fecha Inicio",
      accessorKey: "start_date" as keyof ITRWithActions,
      cell: (item: ITRWithActions) => <span>{item.start_date ? new Date(item.start_date).toLocaleDateString('es-ES') : 'Sin Fecha'}</span>,
    },
    {
      header: "Fecha Límite",
      accessorKey: "end_date" as keyof ITRWithActions,
      cell: (item: ITRWithActions) => <span>{item.end_date ? new Date(item.end_date).toLocaleDateString('es-ES') : 'Sin Fecha'}</span>,
    },
    {
      header: "Estado",
      accessorKey: "status" as keyof ITRWithActions,
      cell: (item: ITRWithActions) => <StatusBadge status={item.status} />,
    },
    {
      header: "Progreso",
      accessorKey: "progress" as keyof ITRWithActions,
      cell: (item: ITRWithActions) => (
        <div className="w-full bg-secondary/10 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${
              item.status === "complete"
                ? "bg-status-complete"
                : item.status === "delayed"
                ? "bg-status-delayed"
                : "bg-status-inprogress"
            }`}
            style={{ width: `${item.progress || 0}%` }}
          ></div>
        </div>
      ),
    },
    {
      header: "Acciones",
      accessorKey: "id" as keyof ITRWithActions, // Use id instead of actions
      cell: (item: ITRWithActions) => (
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              handleMarkComplete(item);
            }}
            disabled={item.status === "complete" || markingComplete === item.id}
          >
            {markingComplete === item.id ? (
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                <span>Completar</span>
              </>
            )}
          </Button>
        </div>
      ),
    }
  ];

  // Apply all active filters
  const filteredITRs = itrs.filter(itr => {
    // Status filter
    if (statusFilter !== "all" && itr.status !== statusFilter) {
      return false;
    }
    
    // System filter
    if (systemFilter !== "all" && itr.systemName !== systemFilter) {
      return false;
    }
    
    // Subsystem filter
    if (subsystemFilter !== "all" && itr.subsystemName !== subsystemFilter) {
      return false;
    }
    
    return true;
  });

  const handleMarkComplete = async (itr: ITRWithDetails) => {
    setMarkingComplete(itr.id);
    try {
      await updateITR(itr.id, {
        status: "complete",
        progress: 100
      });
      
      toast({
        title: "ITR completado",
        description: `${itr.name} ha sido marcado como completado`,
      });
      
      onRefresh();
    } catch (error) {
      console.error("Error al marcar como completado:", error);
      toast({
        title: "Error",
        description: "No se pudo marcar el ITR como completado",
        variant: "destructive"
      });
    } finally {
      setMarkingComplete(null);
    }
  };

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

  // Get unique system and subsystem names for filters
  const uniqueSystems = Array.from(new Set(itrs.map(itr => itr.systemName))).filter(Boolean);
  const uniqueSubsystems = Array.from(new Set(itrs.map(itr => itr.subsystemName))).filter(Boolean);

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
        <div className="flex space-x-2">
          {/* Status Filter */}
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
          
          {/* System Filter */}
          <div className="w-[180px]">
            <Select
              value={systemFilter}
              onValueChange={setSystemFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por sistema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los sistemas</SelectItem>
                {uniqueSystems.map((system, index) => (
                  <SelectItem key={index} value={system as string}>
                    {system}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Subsystem Filter */}
          <div className="w-[180px]">
            <Select
              value={subsystemFilter}
              onValueChange={setSubsystemFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por subsistema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los subsistemas</SelectItem>
                {uniqueSubsystems.map((subsystem, index) => (
                  <SelectItem key={index} value={subsystem as string}>
                    {subsystem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
