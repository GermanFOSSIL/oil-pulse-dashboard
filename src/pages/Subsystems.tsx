
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Subsystem, System, getSubsystems, getSystemsByProjectId } from "@/services/supabaseService";
import { ProjectSelector } from "@/components/ProjectSelector";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Search, Filter } from "lucide-react";
import { SubsystemFormModal } from "@/components/modals/SubsystemFormModal";

interface SubsystemsProps {
  projectId: string | null;
}

const Subsystems = () => {
  const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedSubsystem, setSelectedSubsystem] = useState<Subsystem | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      if (selectedProjectId) {
        const systemsData = await getSystemsByProjectId(selectedProjectId);
        setSystems(systemsData);
        const systemsIds = systemsData.map((system) => system.id);
        const subsystemsData = await getSubsystems();
        const filteredSubsystems = subsystemsData.filter((subsystem) =>
          systemsIds.includes(subsystem.system_id)
        );
        setSubsystems(filteredSubsystems);
      } else {
        setSystems([]);
        setSubsystems([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load subsystems",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedProjectId]);

  const handleSelectProject = (projectId: string | null) => {
    setSelectedProjectId(projectId);
  };

  const handleEdit = (subsystem: Subsystem) => {
    setSelectedSubsystem(subsystem);
    setOpen(true);
  };

  const handleDelete = (subsystem: Subsystem) => {
    // Implement delete logic here
    console.log("Delete subsystem", subsystem);
  };

  const columns = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "System ID",
      accessorKey: "system_id",
    },
  ];

  const filteredSubsystems = subsystems.filter((subsystem) =>
    subsystem.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subsystems</h1>
          <p className="text-muted-foreground">
            Manage and monitor subsystems within your projects.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <ProjectSelector
            onSelectProject={handleSelectProject}
            selectedProjectId={selectedProjectId}
          />
          <Button onClick={() => setOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Subsystem
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Subsystems List</CardTitle>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search subsystems..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredSubsystems}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />
        </CardContent>
      </Card>
      <SubsystemFormModal
        open={open}
        onOpenChange={setOpen}
        systems={systems}
        onSubmit={() => {
          fetchData();
          setOpen(false);
          setSelectedSubsystem(null);
        }}
        subsystem={selectedSubsystem}
      />
    </div>
  );
};

export default Subsystems;
