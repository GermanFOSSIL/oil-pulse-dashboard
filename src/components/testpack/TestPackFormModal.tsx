
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
import { getITRs } from "@/services/itrDataService";
import { getSystemsByProjectId, getSystemsWithSubsystems } from "@/services/systemService";
import { getSubsystemsBySystemId } from "@/services/subsystemService";
import { getProjects } from "@/services/projectService";

interface TestPackFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  testPack?: TestPack;
}

const formSchema = z.object({
  nombre_paquete: z.string().min(1, "El nombre es requerido"),
  itr_asociado: z.string().min(1, "El ITR es requerido"),
  sistema: z.string().min(1, "El sistema es requerido"),
  subsistema: z.string().min(1, "El subsistema es requerido"),
});

type FormValues = z.infer<typeof formSchema>;

const TestPackFormModal = ({ isOpen, onClose, onSuccess, testPack }: TestPackFormModalProps) => {
  const { addTestPack, updateTestPack } = useTestPacks();
  const [isLoading, setIsLoading] = useState(false);
  
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [systems, setSystems] = useState<{ id: string; name: string; project_id: string }[]>([]);
  const [subsystems, setSubsystems] = useState<{ id: string; name: string; system_id: string }[]>([]);
  const [itrs, setItrs] = useState<{ id: string; name: string }[]>([]);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre_paquete: testPack?.nombre_paquete || "",
      itr_asociado: testPack?.itr_asociado || "",
      sistema: testPack?.sistema || "",
      subsistema: testPack?.subsistema || "",
    },
  });
  
  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load projects
        const projectsData = await getProjects();
        setProjects(projectsData.map(p => ({ id: p.id, name: p.name })));
        
        // Load all ITRs
        const itrsData = await getITRs();
        setItrs(itrsData.map(itr => ({ id: itr.id, name: itr.name })));
        
        // If editing, preset system and subsystem
        if (testPack) {
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
              // Get subsystems for this system
              const subsystemsForSystem = await getSubsystemsBySystemId(matchingSystem.id);
              setSubsystems(subsystemsForSystem.map(s => ({ 
                id: s.id, 
                name: s.name, 
                system_id: s.system_id 
              })));
            }
          }
        }
      } catch (error) {
        console.error("Error loading form data:", error);
      }
    };
    
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen, testPack]);
  
  const handleProjectChange = async (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedSystemId(null);
    form.setValue("sistema", "");
    form.setValue("subsistema", "");
    
    try {
      const systemsData = await getSystemsByProjectId(projectId);
      setSystems(systemsData.map(s => ({ 
        id: s.id, 
        name: s.name, 
        project_id: s.project_id 
      })));
      setSubsystems([]);
    } catch (error) {
      console.error("Error loading systems:", error);
    }
  };
  
  const handleSystemChange = async (systemId: string, systemName: string) => {
    setSelectedSystemId(systemId);
    form.setValue("sistema", systemName);
    form.setValue("subsistema", "");
    
    try {
      const subsystemsData = await getSubsystemsBySystemId(systemId);
      setSubsystems(subsystemsData.map(s => ({ 
        id: s.id, 
        name: s.name, 
        system_id: s.system_id 
      })));
    } catch (error) {
      console.error("Error loading subsystems:", error);
    }
  };
  
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      if (testPack) {
        // Update existing Test Pack
        await updateTestPack(testPack.id, values);
      } else {
        // Create new Test Pack with required fields
        const newTestPack: Omit<TestPack, "id" | "created_at" | "updated_at"> = {
          nombre_paquete: values.nombre_paquete,
          itr_asociado: values.itr_asociado,
          sistema: values.sistema,
          subsistema: values.subsistema,
          estado: 'pendiente'
        };
        await addTestPack(newTestPack);
      }
      onSuccess();
    } catch (error) {
      console.error("Error submitting form:", error);
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
                          field.onChange(subsystem.name);
                        }
                      }}
                      value={subsystems.find(s => s.name === field.value)?.id}
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
            
            <FormField
              control={form.control}
              name="itr_asociado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ITR Asociado</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const itr = itrs.find(i => i.id === value);
                      if (itr) {
                        field.onChange(itr.name);
                      }
                    }}
                    value={itrs.find(i => i.name === field.value)?.id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un ITR" />
                    </SelectTrigger>
                    <SelectContent>
                      {itrs.map((itr) => (
                        <SelectItem key={itr.id} value={itr.id}>
                          {itr.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : testPack ? "Guardar cambios" : "Crear Test Pack"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TestPackFormModal;
