import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ITRWithActions } from "@/types/itr-types";

const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
  switch (status) {
    case "complete":
      return "outline"; // Changed from "success" to "outline"
    case "delayed":
      return "destructive";
    default:
      return "secondary";
  }
};

const getStatusName = (status: string): string => {
  switch (status) {
    case "complete":
      return "Completado";
    case "delayed":
      return "Retrasado";
    case "inprogress":
      return "En progreso";
    default:
      return status;
  }
};

interface ITRListProps {
  itrs: ITRWithActions[];
  loading: boolean;
}

const ITRList = ({ itrs, loading }: ITRListProps) => {
  const LoadingRows = () => (
    <>
      {[...Array(5)].map((_, index) => (
        <TableRow key={index}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-36" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de ITRs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Subsistema</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <LoadingRows />
              ) : itrs.length > 0 ? (
                itrs.map((itr) => (
                  <TableRow key={itr.id}>
                    <TableCell className="font-medium">{itr.name}</TableCell>
                    <TableCell>{itr.quantity}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(itr.status)}>
                        {getStatusName(itr.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{itr.subsystemName || 'N/A'}</TableCell>
                    <TableCell>
                      {typeof itr.progress === 'number' ? `${itr.progress}%` : 'N/A'}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      {itr.onView && (
                        <Button variant="outline" size="icon" onClick={itr.onView}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {itr.onEdit && (
                        <Button variant="outline" size="icon" onClick={itr.onEdit}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {itr.onDelete && (
                        <Button variant="outline" size="icon" onClick={itr.onDelete}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    No hay ITRs para mostrar
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ITRList;
