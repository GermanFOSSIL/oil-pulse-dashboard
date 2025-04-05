
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Plus } from "lucide-react";

interface System {
  id: number;
  name: string;
  project: string;
  subsystems: number;
  itrs: number;
  completionRate: number;
}

const mockSystems: System[] = [
  {
    id: 1,
    name: "Pipeline System",
    project: "North Sea Platform A",
    subsystems: 5,
    itrs: 48,
    completionRate: 85,
  },
  {
    id: 2,
    name: "Power Generation",
    project: "Gulf of Mexico Drilling",
    subsystems: 4,
    itrs: 32,
    completionRate: 60,
  },
  {
    id: 3,
    name: "Safety Systems",
    project: "North Sea Platform A",
    subsystems: 6,
    itrs: 56,
    completionRate: 90,
  },
  {
    id: 4,
    name: "Gas Compression",
    project: "Brazilian Offshore Platform",
    subsystems: 3,
    itrs: 24,
    completionRate: 45,
  },
  {
    id: 5,
    name: "Instrumentation",
    project: "Caspian Pipeline",
    subsystems: 8,
    itrs: 76,
    completionRate: 30,
  },
  {
    id: 6,
    name: "Water Injection",
    project: "Norwegian Oil Field",
    subsystems: 4,
    itrs: 36,
    completionRate: 100,
  },
];

const Systems = () => {
  const [systems, setSystems] = useState<System[]>(mockSystems);

  const columns = [
    {
      header: "System Name",
      accessorKey: "name",
    },
    {
      header: "Project",
      accessorKey: "project",
    },
    {
      header: "Subsystems",
      accessorKey: "subsystems",
    },
    {
      header: "ITRs",
      accessorKey: "itrs",
    },
    {
      header: "Completion Rate",
      accessorKey: "completionRate",
      cell: (system: System) => (
        <div className="flex items-center">
          <div className="w-full bg-secondary/10 rounded-full h-2.5 mr-2">
            <div
              className="bg-secondary h-2.5 rounded-full"
              style={{ width: `${system.completionRate}%` }}
            ></div>
          </div>
          <span>{system.completionRate}%</span>
        </div>
      ),
    },
  ];

  const handleEditSystem = (system: System) => {
    console.log("Edit system:", system);
  };

  const handleDeleteSystem = (system: System) => {
    if (confirm(`Are you sure you want to delete ${system.name}?`)) {
      setSystems(systems.filter((s) => s.id !== system.id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Systems</h1>
          <p className="text-muted-foreground">
            Manage systems within your projects
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New System
        </Button>
      </div>

      <DataTable
        data={systems}
        columns={columns}
        onEdit={handleEditSystem}
        onDelete={handleDeleteSystem}
      />
    </div>
  );
};

export default Systems;
