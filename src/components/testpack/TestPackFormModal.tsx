
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTestPacks } from "@/hooks/useTestPacks";
import { TestPack } from "@/services/types";
import { getITRs, getITRsBySubsystemId } from "@/services/itrDataService";
import { getSystemsByProjectId, getSystemsWithSubsystems } from "@/services/systemService";
import { getSubsystemsBySystemId } from "@/services/subsystemService";
import { getProjects } from "@/services/projectService";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TestPackFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  testPack?: TestPack;
}

const formSchema = z.object({
  nombre_paquete: z.string().min(1, "El nombre es requerido"),
  itrs_asociados: z.array(z.string()).min(1, "Al menos un ITR es requerido"),
  sistema: z.string().min(1, "El sistema es requerido"),
  subsistema: z.string().min(1, "El subsistema es requerido"),
});

type FormValues = z.infer<typeof formSchema>;

const TestPackFormModal = ({ isOpen, onClose, onSuccess, testPack }: TestPackFormModalProps) => {
  const { addTestPack, updateTestPack } = useTestPacks();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [systems, setSystems] = useState<{ id: string; name: string; project_id: string }[]>([]);
  const [subsystems, setSubsystems] = useState<{ id: string; name: string; system_id: string; id_db: string }[]>([]);
  const [itrs, setItrs] = useState<{ id: string; name: string }[]>([]);
  const [selectedItrs, setSelectedItrs] = useState<string[]>([]);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre_paquete: testPack?.nombre_paquete || "",
      itrs_asociados: testPack?.itr_asociado ? [testPack.itr_asociado] : [],
      sistema: testPack?.sistema || "",
      subsistema: testPack?.subsistema || "",
    },
  });
  
  // Reset form when modal opens or testPack changes
  useEffect(() => {
    if (isOpen) {
      // If editing, pre-populate with existing values (including comma-separated ITRs)
      const existingItrs = testPack?.itr_asociado ? 
        testPack.itr_asociado.split(',').map(itr => itr.trim()) : 
        [];
        
      form.reset({
        nombre_paquete: testPack?.nombre_paquete || "",
        itrs_asociados: existingItrs,
        sistema: testPack?.sistema || "",
        subsistema: testPack?.subsistema || "",
      });
      
      setSelectedItrs(existingItrs);
      setError(null);
    }
  }, [isOpen, testPack, form]);
  
  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      if (!isOpen) return;
      
      setLoadingData(true);
      try {
        console.log("Cargando datos iniciales para el formulario");
        // Load projects
        const projectsData = await getProjects();
        setProjects(projectsData.map(p => ({ id: p.id, name: p.name })));
        
        // Load all ITRs
        const itrsData = await getITRs();
        setItrs(itrsData.map(itr => ({ id: itr.id, name: itr.name })));
        
        // If editing, preset system and subsystem
        if (testPack) {
          console.log("Cargando datos para Test Pack existente:", testPack.nombre_paquete);
          // Get systems and subsystems data to find IDs
          const allSystemsData = await getSystemsWithSubsystems();
          
          // Find the system that matches the name
          const matchingSystem = allSystemsData.find(sys => sys.name === testPack.sistema);
          if (matchingSystem) {
            setSelectedSystemId(matchingSystem.id);
            
            // Get systems for this project
            const systemsForProject = await getSystemsByProjectId(matchingSystem.project_id);
            setSystems(systemsForProject.map(s => ({ 
              id: s.id, 
              name: s.name, 
              project_id: s.project_id 
            })));
            
            setSelectedProjectId(matchingSystem.project_id);
            
            // Find matching subsystem
            const matchingSubsystem = matchingSystem.subsystems.find(
              (sub: any) => sub.name === testPack.subsistema
            );
            
            if (matchingSubsystem) {
              setSelectedSubsystemId(matchingSubsystem.id);
              
              // Get subsystems for this system
              const subsystemsForSystem = await getSubsystemsBySystemId(matchingSystem.id);
              setSubsystems(subsystemsForSystem.map(s => ({ 
                id: s.id, 
                name: s.name, 
                system_id: s.system_id,
                id_db: s.id
              })));
              
              // Now load ITRs for this subsystem
              const itrsForSubsystem = await getITRsBySubsystemId(matchingSubsystem.id);
              setItrs(itrsForSubsystem.map(itr => ({ 
                id: itr.id, 
                name: itr.name 
              })));
            }
          }
        }
      } catch (err) {
        console.error("Error cargando datos del formulario:", err);
        setError("No se pudieron cargar los datos necesarios");
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos necesarios",
          variant: "destructive",
        });
      } finally {
        setLoadingData(false);
      }
    };
    
    loadInitialData();
  }, [isOpen, testPack, toast]);
  
  const handleProjectChange = async (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedSystemId(null);
    setSelectedSubsystemId(null);
    setSelectedItrs([]);
    form.setValue("sistema", "");
    form.setValue("subsistema", "");
    form.setValue("itrs_asociados", []);
    setLoadingData(true);
    
    try {
      console.log("Cargando sistemas para proyecto:", projectId);
      const systemsData = await getSystemsByProjectId(projectId);
      setSystems(systemsData.map(s => ({ 
        id: s.id, 
        name: s.name, 
        project_id: s.project_id 
      })));
      setSubsystems([]);
      setItrs([]);
    } catch (err) {
      console.error("Error cargando sistemas:", err);
      toast({
        title: "Error",
        description: "No se pudieron cargar los sistemas",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };
  
  const handleSystemChange = async (systemId: string, systemName: string) => {
    setSelectedSystemId(systemId);
    setSelectedSubsystemId(null);
    setSelectedItrs([]);
    form.setValue("sistema", systemName);
    form.setValue("subsistema", "");
    form.setValue("itrs_asociados", []);
    setLoadingData(true);
    
    try {
      console.log("Cargando subsistemas para sistema:", systemId);
      const subsystemsData = await getSubsystemsBySystemId(systemId);
      setSubsystems(subsystemsData.map(s => ({ 
        id: s.id, 
        name: s.name, 
        system_id: s.system_id,
        id_db: s.id
      })));
      setItrs([]);
    } catch (err) {
      console.error("Error cargando subsistemas:", err);
      toast({
        title: "Error",
        description: "No se pudieron cargar los subsistemas",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };
  
  const handleSubsystemChange = async (subsystemId: string, subsystemName: string) => {
    setSelectedSubsystemId(subsystemId);
    form.setValue("subsistema", subsystemName);
    form.setValue("itrs_asociados", []);
    setSelectedItrs([]);
    setLoadingData(true);
    
    try {
      console.log("Cargando ITRs para subsistema:", subsystemId);
      const itrsData = await getITRsBySubsystemId(subsystemId);
      setItrs(itrsData.map(itr => ({ 
        id: itr.id, 
        name: itr.name 
      })));
    } catch (err) {
      console.error("Error cargando ITRs:", err);
      toast({
        title: "Error",
        description: "No se pudieron cargar los ITRs",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };
  
  const handleItrToggle = (itrName: string) => {
    const updatedItrs = selectedItrs.includes(itrName)
      ? selectedItrs.filter(name => name !== itrName)
      : [...selectedItrs, itrName];
    
    setSelectedItrs(updatedItrs);
    form.setValue("itrs_asociados", updatedItrs);
  };
  
  const removeItr = (itrName: string) => {
    const updatedItrs = selectedItrs.filter(name => name !== itrName);
    setSelectedItrs(updatedItrs);
    form.setValue("itrs_asociados", updatedItrs);
  };
  
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Enviando formulario:", values);
      
      // Join the selected ITRs with commas for storage
      const itrAsociado = values.itrs_asociados.join(", ");
      
      if (testPack) {
        // Update existing Test Pack
        console.log("Actualizando Test Pack:", testPack.id);
        await updateTestPack(testPack.id, {
          nombre_paquete: values.nombre_paquete,
          itr_asociado: itrAsociado,
          sistema: values.sistema,
          subsistema: values.subsistema
        });
        toast({
          title: "Éxito",
          description: "Test Pack actualizado correctamente",
        });
      } else {
        // Create new Test Pack with required fields
        console.log("Creando nuevo Test Pack");
        const newTestPack: Omit<TestPack, "id" | "created_at" | "updated_at"> = {
          nombre_paquete: values.nombre_paquete,
          itr_asociado: itrAsociado,
          sistema: values.sistema,
          subsistema: values.subsistema,
          estado: 'pendiente'
        };
        await addTestPack(newTestPack);
        toast({
          title: "Éxito",
          description: "Test Pack creado correctamente",
        });
      }
      onSuccess();
    } catch (err) {
      console.error("Error enviando formulario:", err);
      setError("No se pudo guardar el Test Pack. Por favor, inténtelo de nuevo.");
      toast({
        title: "Error",
        description: "No se pudo guardar el Test Pack",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{testPack ? "Editar Test Pack" : "Nuevo Test Pack"}</DialogTitle>
          <DialogDescription>
            {testPack 
              ? "Actualice los detalles del Test Pack." 
              : "Complete los datos para crear un nuevo Test Pack."}
          </DialogDescription>
        </DialogHeader>
        
        {loadingData ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Cargando datos...</span>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="nombre_paquete"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Test Pack</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese el nombre del Test Pack" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {!testPack && (
                <FormItem>
                  <FormLabel>Proyecto</FormLabel>
                  <Select
                    onValueChange={handleProjectChange}
                    value={selectedProjectId || undefined}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
              
              {(selectedProjectId || testPack) && (
                <FormField
                  control={form.control}
                  name="sistema"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sistema</FormLabel>
                      <Select
                        onValueChange={(systemId) => {
                          const system = systems.find(s => s.id === systemId);
                          if (system) {
                            handleSystemChange(systemId, system.name);
                          }
                        }}
                        value={selectedSystemId || undefined}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un sistema" />
                        </SelectTrigger>
                        <SelectContent>
                          {systems.map((system) => (
                            <SelectItem key={system.id} value={system.id}>
                              {system.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {(selectedSystemId || testPack) && (
                <FormField
                  control={form.control}
                  name="subsistema"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subsistema</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          const subsystem = subsystems.find(s => s.id === value);
                          if (subsystem) {
                            handleSubsystemChange(value, subsystem.name);
                          }
                        }}
                        value={selectedSubsystemId || undefined}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un subsistema" />
                        </SelectTrigger>
                        <SelectContent>
                          {subsystems.map((subsystem) => (
                            <SelectItem key={subsystem.id} value={subsystem.id}>
                              {subsystem.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {selectedSubsystemId && (
                <FormField
                  control={form.control}
                  name="itrs_asociados"
                  render={() => (
                    <FormItem>
                      <FormLabel>ITRs Asociados</FormLabel>
                      <div className="mb-2 mt-1 flex flex-wrap gap-1">
                        {selectedItrs.map(itr => (
                          <Badge key={itr} variant="secondary" className="flex items-center gap-1 p-1">
                            {itr}
                            <button 
                              type="button" 
                              onClick={() => removeItr(itr)}
                              className="ml-1 rounded-full hover:bg-muted p-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <ScrollArea className="h-[180px] border rounded-md p-2">
                        <div className="space-y-2">
                          {itrs.map(itr => (
                            <div key={itr.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={itr.id} 
                                checked={selectedItrs.includes(itr.name)}
                                onCheckedChange={() => handleItrToggle(itr.name)}
                              />
                              <label 
                                htmlFor={itr.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {itr.name}
                              </label>
                            </div>
                          ))}
                          {itrs.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              No hay ITRs disponibles para este subsistema
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {error && (
                <div className="text-sm text-destructive">
                  {error}
                </div>
              )}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading || loadingData}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {testPack ? "Guardando..." : "Creando..."}
                    </>
                  ) : (
                    testPack ? "Guardar cambios" : "Crear Test Pack"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TestPackFormModal;
