
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus } from "lucide-react";

interface Project {
  id: number;
  name: string;
  location: string;
  systems: number;
  itrs: number;
  status: "complete" | "inprogress" | "delayed";
  progress: number;
}

const mockProjects: Project[] = [
  {
    id: 1,
    name: "North Sea Platform A",
    location: "North Sea",
    systems: 12,
    itrs: 156,
    status: "inprogress",
    progress: 78,
  },
  {
    id: 2,
    name: "Gulf of Mexico Drilling",
    location: "Gulf of Mexico",
    systems: 8,
    itrs: 92,
    status: "inprogress",
    progress: 45,
  },
  {
    id: 3,
    name: "Caspian Pipeline",
    location: "Caspian Sea",
    systems: 6,
    itrs: 76,
    status: "delayed",
    progress: 23,
  },
  {
    id: 4,
    name: "Norwegian Oil Field",
    location: "Norway",
    systems: 10,
    itrs: 120,
    status: "complete",
    progress: 100,
  },
  {
    id: 5,
    name: "Brazilian Offshore Platform",
    location: "Brazil",
    systems: 14,
    itrs: 186,
    status: "inprogress",
    progress: 62,
  },
];

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>(mockProjects);

  const columns = [
    {
      header: "Project Name",
      accessorKey: "name" as const,
    },
    {
      header: "Location",
      accessorKey: "location" as const,
    },
    {
      header: "Systems",
      accessorKey: "systems" as const,
    },
    {
      header: "ITRs",
      accessorKey: "itrs" as const,
    },
    {
      header: "Status",
      accessorKey: "status" as const,
      cell: (project: Project) => (
        <StatusBadge status={project.status} />
      ),
    },
    {
      header: "Progress",
      accessorKey: "progress" as const,
      cell: (project: Project) => (
        <div className="w-full bg-secondary/10 rounded-full h-2.5">
          <div
            className="bg-secondary h-2.5 rounded-full"
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      ),
    },
  ];

  const handleEditProject = (project: Project) => {
    console.log("Edit project:", project);
  };

  const handleDeleteProject = (project: Project) => {
    if (confirm(`Are you sure you want to delete ${project.name}?`)) {
      setProjects(projects.filter((p) => p.id !== project.id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your oil and gas projects
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <DataTable
        data={projects}
        columns={columns}
        onEdit={handleEditProject}
        onDelete={handleDeleteProject}
      />
    </div>
  );
};

export default Projects;
