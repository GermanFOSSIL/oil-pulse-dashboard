
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ProjectSelector } from "@/components/ProjectSelector";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  MoreHorizontal,
  Filter, 
  Search, 
  Edit, 
  Trash,
  Loader2, 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  getSubsystems, 
  deleteSubsystem, 
  getSystemsByProjectId,
  Subsystem,
  System
} from "@/services/supabaseService";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import SubsystemFormModal from "@/components/modals/SubsystemFormModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Subsystems = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [systems, setSystems] = useState<System[]>([]);
  const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
  const [filteredSubsystems, setFilteredSubsystems] = useState<Subsystem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubsystem, setEditingSubsystem] = useState<Subsystem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const filteredResults = subsystems.filter(subsystem => 
      subsystem.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSubsystems(filteredResults);
  }, [searchQuery, subsystems]);

  const fetchData = async () => {
    if (!selectedProjectId) {
      setSystems([]);
      setSubsystems([]);
      setFilteredSubsystems([]);
      return;
    }
    
    setLoading(true);
    try {
        const systemsData = await getSystemsByProjectId(selectedProjectId);
        setSystems(systemsData);
        
        const systemIds = systemsData.map(system => system.id);
        const subsystemsData = await getSubsystems();
        
        const systemsMap = new Map<string, System>();
        systemsData.forEach(system => systemsMap.set(system.id, system));
        
        // Filter subsystems that belong to the systems of the selected project
        const filteredSubsystems = subsystemsData.filter(
          subsystem => systemIds.includes(subsystem.system_id)
        );
        
        setSubsystems(filteredSubsystems);
        setFilteredSubsystems(filteredSubsystems);
    } catch (error) {
        console.error("Error fetching data:", error);
        toast({
            title: "Error",
            description: "No se pudieron cargar los subsistemas",
            variant: "destructive"
        });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedProjectId]);

  const handleProjectSelect = (projectId: string | null) => {
    setSelectedProjectId(projectId);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return format(new Date(date), "dd MMM yyyy", { locale: es });
  };

  const getSystemName = (systemId: string) => {
    const system = systems.find(s => s.id === systemId);
    return system ? system.name : "Unknown System";
  };

  const handleEdit = (subsystem: Subsystem) => {
    setEditingSubsystem(subsystem);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSubsystem(id);
      toast({
        title: "Subsistema eliminado",
        description: "El subsistema ha sido eliminado correctamente",
      });
      fetchData();
    } catch (error) {
      console.error("Error deleting subsystem:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el subsistema",
        variant: "destructive"
      });
    }
  };

  const handleOpenModal = () => {
    setEditingSubsystem(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingSubsystem(null);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    setEditingSubsystem(null);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subsistemas</h1>
          <p className="text-muted-foreground">
            Gestión de subsistemas para los proyectos
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <ProjectSelector 
            onSelectProject={handleProjectSelect}
            selectedProjectId={selectedProjectId}
          />
          <Button onClick={handleOpenModal} disabled={!selectedProjectId}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Subsistema
          </Button>
        </div>
      </div>

      {!selectedProjectId && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Selección requerida</AlertTitle>
          <AlertDescription>
            Debe seleccionar un proyecto para ver y gestionar los subsistemas.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Subsistemas</CardTitle>
          <CardDescription>
            Lista de todos los subsistemas disponibles para el proyecto seleccionado.
          </CardDescription>
          <div className="flex items-center mt-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar subsistemas..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="ml-2">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedProjectId && filteredSubsystems.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Sistema</TableHead>
                    <TableHead>Fecha de inicio</TableHead>
                    <TableHead>Fecha de fin</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubsystems.map((subsystem) => (
                    <TableRow key={subsystem.id}>
                      <TableCell className="font-medium">
                        {subsystem.name}
                      </TableCell>
                      <TableCell>{getSystemName(subsystem.system_id)}</TableCell>
                      <TableCell>{formatDate(subsystem.start_date)}</TableCell>
                      <TableCell>{formatDate(subsystem.end_date)}</TableCell>
                      <TableCell>{subsystem.completion_rate || 0}%</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(subsystem)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(subsystem.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : selectedProjectId ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>No hay subsistemas disponibles para este proyecto.</p>
              <p className="mt-2">Haga clic en "Nuevo Subsistema" para crear uno.</p>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <p>Seleccione un proyecto para ver los subsistemas.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <SubsystemFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        subsystem={editingSubsystem}
        systems={systems}
      />
    </div>
  );
};

export default Subsystems;
