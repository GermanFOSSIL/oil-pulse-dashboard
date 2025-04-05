
import { useState } from "react";
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

interface ITR {
  id: number;
  name: string;
  project: string;
  system: string;
  subsystem: string;
  assignedTo: string;
  dueDate: string;
  status: "complete" | "inprogress" | "delayed";
  progress: number;
}

const mockITRs: ITR[] = [
  {
    id: 1,
    name: "Pressure Testing",
    project: "North Sea Platform A",
    system: "Pipeline System",
    subsystem: "High Pressure Lines",
    assignedTo: "John Doe",
    dueDate: "2025-05-15",
    status: "inprogress",
    progress: 65,
  },
  {
    id: 2,
    name: "Electrical Inspection",
    project: "Gulf of Mexico Drilling",
    system: "Power Generation",
    subsystem: "Control Panels",
    assignedTo: "Jane Smith",
    dueDate: "2025-04-30",
    status: "delayed",
    progress: 30,
  },
  {
    id: 3,
    name: "Valve Certification",
    project: "North Sea Platform A",
    system: "Safety Systems",
    subsystem: "Emergency Shutdown",
    assignedTo: "Michael Brown",
    dueDate: "2025-04-10",
    status: "complete",
    progress: 100,
  },
  {
    id: 4,
    name: "Compressor Inspection",
    project: "Brazilian Offshore Platform",
    system: "Gas Compression",
    subsystem: "Main Compressor",
    assignedTo: "Sarah Johnson",
    dueDate: "2025-06-05",
    status: "inprogress",
    progress: 40,
  },
  {
    id: 5,
    name: "Instrument Calibration",
    project: "Caspian Pipeline",
    system: "Instrumentation",
    subsystem: "Flow Meters",
    assignedTo: "David Wilson",
    dueDate: "2025-05-20",
    status: "inprogress",
    progress: 70,
  },
  {
    id: 6,
    name: "Pump Testing",
    project: "Norwegian Oil Field",
    system: "Water Injection",
    subsystem: "Primary Pumps",
    assignedTo: "Anna Lee",
    dueDate: "2025-04-25",
    status: "complete",
    progress: 100,
  },
];

const ITRs = () => {
  const [itrs, setITRs] = useState<ITR[]>(mockITRs);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const columns = [
    {
      header: "ITR Name",
      accessorKey: "name",
    },
    {
      header: "Project",
      accessorKey: "project",
    },
    {
      header: "System",
      accessorKey: "system",
    },
    {
      header: "Subsystem",
      accessorKey: "subsystem",
    },
    {
      header: "Assigned To",
      accessorKey: "assignedTo",
    },
    {
      header: "Due Date",
      accessorKey: "dueDate",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (itr: ITR) => <StatusBadge status={itr.status} />,
    },
    {
      header: "Progress",
      accessorKey: "progress",
      cell: (itr: ITR) => (
        <div className="w-full bg-secondary/10 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${
              itr.status === "complete"
                ? "bg-status-complete"
                : itr.status === "delayed"
                ? "bg-status-delayed"
                : "bg-status-inprogress"
            }`}
            style={{ width: `${itr.progress}%` }}
          ></div>
        </div>
      ),
    },
  ];

  const filteredITRs =
    statusFilter === "all"
      ? itrs
      : itrs.filter((itr) => itr.status === statusFilter);

  const handleEditITR = (itr: ITR) => {
    console.log("Edit ITR:", itr);
  };

  const handleDeleteITR = (itr: ITR) => {
    if (confirm(`Are you sure you want to delete ${itr.name}?`)) {
      setITRs(itrs.filter((i) => i.id !== itr.id));
    }
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
        <Button>
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

      <DataTable
        data={filteredITRs}
        columns={columns}
        onEdit={handleEditITR}
        onDelete={handleDeleteITR}
      />
    </div>
  );
};

export default ITRs;
