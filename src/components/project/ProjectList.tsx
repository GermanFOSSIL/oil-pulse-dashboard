
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Edit, Trash2, MoreVertical, MapPin, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ProjectStatus = ({ status }) => {
  const statuses = {
    complete: { label: "Completado", color: "bg-green-500" },
    inprogress: { label: "En Progreso", color: "bg-blue-500" },
    delayed: { label: "Retrasado", color: "bg-red-500" }
  };

  const { label, color } = statuses[status] || statuses.inprogress;

  return (
    <Badge variant="outline" className="flex items-center gap-1">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span>{label}</span>
    </Badge>
  );
};

const ProjectListSkeleton = () => (
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

const ProjectList = ({ projects, loading, onEdit, onDelete }) => {
  if (loading) {
    return <ProjectListSkeleton />;
  }

  if (!projects || projects.length === 0) {
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
          <h3 className="text-lg font-semibold mb-2">No hay proyectos</h3>
          <p className="text-muted-foreground mb-4">
            No se encontraron proyectos en el sistema. Comienza creando uno nuevo.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="overflow-hidden">
          <CardHeader className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{project.name}</CardTitle>
                {project.location && (
                  <CardDescription className="flex items-center mt-1">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    {project.location}
                  </CardDescription>
                )}
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
                  <DropdownMenuItem onClick={() => onEdit(project)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(project)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-1 h-4 w-4" />
                {project.start_date && (
                  <span>
                    {format(new Date(project.start_date), "dd MMM yyyy")}
                  </span>
                )}
                {project.end_date && project.start_date && <span className="mx-1">-</span>}
                {project.end_date && (
                  <span>
                    {format(new Date(project.end_date), "dd MMM yyyy")}
                  </span>
                )}
              </div>
              <ProjectStatus status={project.status} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso</span>
                <span className="font-medium">{project.progress || 0}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    project.status === "complete"
                      ? "bg-green-500"
                      : project.status === "delayed"
                      ? "bg-red-500"
                      : "bg-blue-500"
                  }`}
                  style={{ width: `${project.progress || 0}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-6 pt-0 flex justify-between border-t mt-4">
            <Button variant="outline" onClick={() => onEdit(project)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="outline" className="text-red-600" onClick={() => onDelete(project)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default ProjectList;
