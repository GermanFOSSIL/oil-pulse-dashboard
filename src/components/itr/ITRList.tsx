
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Plus, Filter, RefreshCw, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ITRWithDetails } from "@/types/itr-types";
import { Skeleton } from "@/components/ui/skeleton";

// Componente para mostrar un estado visual con un badge de color
const StatusBadge = ({ status }: { status: "complete" | "inprogress" | "delayed" }) => {
  const statusConfig = {
    complete: { label: "Completado", variant: "success" as const },
    inprogress: { label: "En Progreso", variant: "default" as const },
    delayed: { label: "Retrasado", variant: "destructive" as const }
  };

  const config = statusConfig[status] || statusConfig.inprogress;

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
};

// Skeleton loader para la lista de ITRs
const ITRListSkeleton = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, index) => (
      <Card key={index}>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-3 w-full">
              <Skeleton className="h-4 w-2/3" />
              <div className="flex space-x-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex space-x-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Interfaces para los props
interface ITRListProps {
  itrs: ITRWithDetails[];
  loading: boolean;
  onAddITR: () => void;
  onEditITR: (itr: ITRWithDetails) => void;
  onDeleteITR: (itr: ITRWithDetails) => void;
  onViewDetails?: (itr: ITRWithDetails) => void;
  selectedSubsystemId?: string | null;
  userIsAdmin?: boolean;
}

interface EmptyStateProps {
  onAddITR: () => void;
  message?: string;
  filterActive?: boolean;
}

// EmptyState component
const EmptyState: React.FC<EmptyStateProps> = ({ onAddITR, message, filterActive = false }) => (
  <Card className="border-dashed">
    <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
      <ClipboardList className="h-12 w-12 text-muted-foreground/60" />
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">No hay ITRs registrados</h3>
        <p className="text-muted-foreground">
          {message || (filterActive 
            ? "No se encontraron ITRs que coincidan con los criterios de filtrado." 
            : "Comienza agregando tu primer ITR al sistema.")}
        </p>
      </div>
      <Button onClick={onAddITR}>
        <Plus className="h-4 w-4 mr-2" />
        Agregar ITR
      </Button>
    </CardContent>
  </Card>
);

// Main ITR List component
const ITRList: React.FC<ITRListProps> = ({
  itrs,
  loading,
  onAddITR,
  onEditITR,
  onDeleteITR,
  onViewDetails,
  selectedSubsystemId,
  userIsAdmin = false
}) => {
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const filteredITRs = filterStatus
    ? itrs.filter(itr => itr.status === filterStatus)
    : itrs;

  if (loading) return <ITRListSkeleton />;

  if (itrs.length === 0) {
    return <EmptyState onAddITR={onAddITR} />;
  }

  if (filteredITRs.length === 0) {
    return <EmptyState 
      onAddITR={onAddITR} 
      message="No hay ITRs que coincidan con el filtro seleccionado." 
      filterActive={true}
    />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterStatus(null)}>Todos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("complete")}>Completados</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("inprogress")}>En Progreso</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("delayed")}>Retrasados</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button onClick={onAddITR} disabled={!selectedSubsystemId}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar ITR
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredITRs.map((itr) => (
          <Card key={itr.id} className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg truncate" title={itr.name}>
                  {itr.name}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {onViewDetails && (
                      <DropdownMenuItem onClick={() => onViewDetails(itr)}>
                        Ver detalles
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onEditITR(itr)}>
                      Editar
                    </DropdownMenuItem>
                    {userIsAdmin && (
                      <DropdownMenuItem 
                        onClick={() => onDeleteITR(itr)}
                        className="text-red-600"
                      >
                        Eliminar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription className="mt-1">
                {itr.subsystemName && (
                  <>
                    <span className="font-medium">Subsistema:</span> {itr.subsystemName}
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Asignado a</p>
                  <p>{itr.assigned_to || "No asignado"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Inicio</p>
                  <p>{itr.start_date ? format(new Date(itr.start_date), 'dd/MM/yyyy') : "No definido"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fin</p>
                  <p>{itr.end_date ? format(new Date(itr.end_date), 'dd/MM/yyyy') : "No definido"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estado</p>
                  <StatusBadge status={itr.status as "complete" | "inprogress" | "delayed"} />
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">Progreso</span>
                  <span className="text-xs font-medium">{itr.progress || 0}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      itr.status === "complete"
                        ? "bg-green-500"
                        : itr.status === "delayed"
                        ? "bg-red-500"
                        : "bg-blue-500"
                    }`}
                    style={{ width: `${itr.progress || 0}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between">
              <span className="text-xs text-muted-foreground">
                ID: {itr.id.substring(0, 8)}...
              </span>
              <span className="text-xs font-medium">
                {itr.quantity > 1 ? `Cantidad: ${itr.quantity}` : ''}
              </span>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ITRList;
