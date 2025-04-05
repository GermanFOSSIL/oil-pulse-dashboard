
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Plus } from "lucide-react";

interface Subsystem {
  id: number;
  name: string;
  system: string;
  project: string;
  itrs: number;
  completionRate: number;
}

const mockSubsystems: Subsystem[] = [
  {
    id: 1,
    name: "High Pressure Lines",
    system: "Pipeline System",
    project: "North Sea Platform A",
    itrs: 12,
    completionRate: 75,
  },
  {
    id: 2,
    name: "Control Panels",
    system: "Power Generation",
    project: "Gulf of Mexico Drilling",
    itrs: 8,
    completionRate: 40,
  },
  {
    id: 3,
    name: "Emergency Shutdown",
    system: "Safety Systems",
    project: "North Sea Platform A",
    itrs: 15,
    completionRate: 100,
  },
  {
    id: 4,
    name: "Main Compressor",
    system: "Gas Compression",
    project: "Brazilian Offshore Platform",
    itrs: 10,
    completionRate: 60,
  },
  {
    id: 5,
    name: "Flow Meters",
    system: "Instrumentation",
    project: "Caspian Pipeline",
    itrs: 14,
    completionRate: 35,
  },
  {
    id: 6,
    name: "Primary Pumps",
    system: "Water Injection",
    project: "Norwegian Oil Field",
    itrs: 9,
    completionRate: 100,
  },
];

const Subsystems = () => {
  const [subsystems, setSubsystems] = useState<Subsystem[]>(mockSubsystems);

  const columns = [
    {
      header: "Subsystem Name",
      accessorKey: "name",
    },
    {
      header: "System",
      accessorKey: "system",
    },
    {
      header: "Project",
      accessorKey: "project",
    },
    {
      header: "ITRs",
      accessorKey: "itrs",
    },
    {
      header: "Completion Rate",
      accessorKey: "completionRate",
      cell: (subsystem: Subsystem) => (
        <div className="flex items-center">
          <div className="w-full bg-secondary/10 rounded-full h-2.5 mr-2">
            <div
              className={`h-2.5 rounded-full ${
                subsystem.completionRate === 100
                  ? "bg-status-complete"
                  : subsystem.completionRate < 50
                  ? "bg-status-delayed"
                  : "bg-status-inprogress"
              }`}
              style={{ width: `${subsystem.completionRate}%` }}
            ></div>
          </div>
          <span>{subsystem.completionRate}%</span>
        </div>
      ),
    },
  ];

  const handleEditSubsystem = (subsystem: Subsystem) => {
    console.log("Edit subsystem:", subsystem);
  };

  const handleDeleteSubsystem = (subsystem: Subsystem) => {
    if (confirm(`Are you sure you want to delete ${subsystem.name}?`)) {
      setSubsystems(subsystems.filter((s) => s.id !== subsystem.id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subsystems</h1>
          <p className="text-muted-foreground">
            Manage subsystems within your systems
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Subsystem
        </Button>
      </div>

      <DataTable
        data={subsystems}
        columns={columns}
        onEdit={handleEditSubsystem}
        onDelete={handleDeleteSubsystem}
      />
    </div>
  );
};

export default Subsystems;
