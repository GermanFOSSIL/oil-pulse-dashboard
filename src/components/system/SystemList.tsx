
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, MoreVertical, Calendar } from "lucide-react";
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SystemListSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {[...Array(6)].map((_, i) => (
      <Card key={i} className="overflow-hidden">
        <CardHeader className="p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const SystemList = ({ systems, loading, onRefresh, selectedProjectId, onEdit, onDelete }) => {
  if (loading) {
    return <SystemListSkeleton />;
  }

  if (!systems || systems.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed">
        <CardContent className="pt-6 flex flex-col items-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6 text-muted-foreground"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No hay sistemas</h3>
          <p className="text-muted-foreground mb-4">
            {selectedProjectId 
              ? "No se encontraron sistemas para este proyecto. Comienza creando uno nuevo."
              : "Selecciona un proyecto para ver sus sistemas o crea uno nuevo."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {systems.map((system) => (
        <Card key={system.id} className="overflow-hidden">
          <CardHeader className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{system.name}</CardTitle>
                <CardDescription className="mt-1">
                  ID: {system.id.substring(0, 8)}...
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(system)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(system)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-1 h-4 w-4" />
                {system.start_date && (
                  <span>
                    {format(new Date(system.start_date), "dd MMM yyyy")}
                  </span>
                )}
                {system.end_date && system.start_date && <span className="mx-1">-</span>}
                {system.end_date && (
                  <span>
                    {format(new Date(system.end_date), "dd MMM yyyy")}
                  </span>
                )}
              </div>
              <Badge variant="outline" className={
                system.completion_rate >= 100 ? "bg-green-50 text-green-700 border-green-200" :
                system.completion_rate === 0 ? "bg-gray-50 text-gray-700 border-gray-200" :
                "bg-blue-50 text-blue-700 border-blue-200"
              }>
                {system.completion_rate >= 100 ? "Completado" :
                 system.completion_rate === 0 ? "Sin iniciar" :
                 "En progreso"}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso</span>
                <span className="font-medium">{system.completion_rate || 0}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    system.completion_rate >= 100
                      ? "bg-green-500"
                      : system.completion_rate >= 50
                      ? "bg-blue-500"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${system.completion_rate || 0}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
          {(onEdit || onDelete) && (
            <CardFooter className="p-6 pt-0 flex justify-between border-t mt-4">
              {onEdit && (
                <Button variant="outline" onClick={() => onEdit(system)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              )}
              {onDelete && (
                <Button variant="outline" className="text-red-600" onClick={() => onDelete(system)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              )}
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
};

export default SystemList;
