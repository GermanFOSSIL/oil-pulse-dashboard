
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
          subsystemName: relatedSubsystem?.name || 'Unknown Subsystem'
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
      header: "ITR Name",
      accessorKey: "name" as const,
    },
    {
      header: "Subsystem",
      accessorKey: "subsystemName" as const,
    },
    {
      header: "Assigned To",
      accessorKey: "assigned_to" as const,
      cell: (itr: ITRWithDetails) => <span>{itr.assigned_to || 'Not Assigned'}</span>,
    },
    {
      header: "Due Date",
      accessorKey: "due_date" as const,
      cell: (itr: ITRWithDetails) => <span>{itr.due_date || 'No Date Set'}</span>,
    },
    {
      header: "Status",
      accessorKey: "status" as const,
      cell: (itr: ITRWithDetails) => <StatusBadge status={itr.status} />,
    },
    {
      header: "Progress",
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
    console.log("Edit ITR:", itr);
    // Will be implemented in a future update
    toast({
      title: "Funcionalidad no implementada",
      description: "La edición de ITRs se implementará próximamente",
    });
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
    // Will be implemented in a future update
    toast({
      title: "Funcionalidad no implementada",
      description: "La creación de ITRs se implementará próximamente",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ITRs</h1>
          <p className="text-muted-foreground">
            Inspection Test Records Management
          </p>
        </div>
        <Button onClick={handleNewITR}>
          <Plus className="h-4 w-4 mr-2" />
          New ITR
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="w-[180px]">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
              <SelectItem value="inprogress">In Progress</SelectItem>
              <SelectItem value="delayed">Delayed</SelectItem>
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
    </div>
  );
};

export default ITRs;
