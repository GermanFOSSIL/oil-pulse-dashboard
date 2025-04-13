
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProjectListProps {
  projects: any[];
  loading: boolean;
  onEdit: (project: any) => void;
  onDelete: (projectId: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, loading, onEdit, onDelete }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    if (status === "complete") {
      return <Badge variant="outline">Completado</Badge>;
    } else if (status === "delayed") {
      return <Badge variant="destructive">Retrasado</Badge>;
    } else {
      return <Badge variant="secondary">En progreso</Badge>;
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

  const handleDelete = async (projectId: string) => {
    if (window.confirm("¿Está seguro de que desea eliminar este proyecto? Esta acción no se puede deshacer.")) {
      setDeletingId(projectId);
      try {
        await onDelete(projectId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No projects found. Create your first project by clicking "Add Project".
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell>{project.progress || 0}%</TableCell>
                    <TableCell>{formatDate(project.start_date)}</TableCell>
                    <TableCell>{formatDate(project.end_date)}</TableCell>
                    <TableCell>{project.location || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onEdit(project)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(project.id)}
                          disabled={deletingId === project.id}
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
      </CardContent>
    </Card>
  );
};

export default ProjectList;
