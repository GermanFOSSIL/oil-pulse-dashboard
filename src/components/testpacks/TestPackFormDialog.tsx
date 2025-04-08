
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TestPack, createTestPack, updateTestPack } from "@/services/testPackService";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { getProjectsHierarchy } from "@/services/systemService";
import { getAvailableITRs } from "@/services/systemService";

interface TestPackFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testPack: TestPack | null;
  onSuccess: () => void;
}

const formSchema = z.object({
  sistema: z.string().min(1, "El sistema es requerido"),
  subsistema: z.string().min(1, "El subsistema es requerido"),
  nombre_paquete: z.string().min(1, "El nombre del paquete es requerido"),
  itr_asociado: z.string().min(1, "El ITR asociado es requerido")
});

type FormValues = z.infer<typeof formSchema>;

const TestPackFormDialog = ({ open, onOpenChange, testPack, onSuccess }: TestPackFormDialogProps) => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [systems, setSystems] = useState<any[]>([]);
  const [subsystems, setSubsystems] = useState<any[]>([]);
  const [itrs, setItrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sistema: testPack?.sistema || "",
      subsistema: testPack?.subsistema || "",
      nombre_paquete: testPack?.nombre_paquete || "",
      itr_asociado: testPack?.itr_asociado || ""
    }
  });

  // Load projects and systems on component mount
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setLoading(true);
        const data = await getProjectsHierarchy();
        console.log("Projects hierarchy loaded:", data);
        setProjects(data || []);
        
        // Extract all systems from projects
        const allSystems: any[] = [];
        data.forEach((project: any) => {
          if (project.systems && Array.isArray(project.systems)) {
            project.systems.forEach((system: any) => {
              allSystems.push({
                ...system,
                projectName: project.name
              });
            });
          }
        });
        
        setSystems(allSystems);
      } catch (error) {
        console.error("Error loading project data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del proyecto",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();
  }, [toast]);

  // Update subsystems when system changes
  useEffect(() => {
    if (selectedSystemId) {
      const system = systems.find(s => s.id === selectedSystemId);
      if (system && system.subsystems && Array.isArray(system.subsystems)) {
        setSubsystems(system.subsystems);
        console.log("Subsystems updated:", system.subsystems);
      } else {
        setSubsystems([]);
        console.log("No subsystems found for system:", selectedSystemId);
      }
      form.setValue("subsistema", "");
      setSelectedSubsystemId(null);
      setItrs([]);
    }
  }, [selectedSystemId, systems, form]);

  // Update ITRs when subsystem changes
  useEffect(() => {
    const loadITRs = async () => {
      if (selectedSubsystemId) {
        try {
          setLoading(true);
          const itrsData = await getAvailableITRs(selectedSubsystemId);
          console.log("ITRs loaded:", itrsData);
          setItrs(itrsData || []);
        } catch (error) {
          console.error("Error loading ITRs:", error);
          toast({
            title: "Error",
            description: "No se pudieron cargar los ITRs",
            variant: "destructive"
          });
          setItrs([]);
        } finally {
          setLoading(false);
        }
      }
    };

    loadITRs();
  }, [selectedSubsystemId, toast]);

  // Set form values if editing
  useEffect(() => {
    if (testPack) {
      const systemId = testPack.sistema;
      const subsystemId = testPack.subsistema;
      
      form.reset({
        sistema: systemId,
        subsistema: subsystemId,
        nombre_paquete: testPack.nombre_paquete,
        itr_asociado: testPack.itr_asociado
      });
      
      // Set selected values for dropdowns
      setSelectedSystemId(systemId);
      setSelectedSubsystemId(subsystemId);
    }
  }, [testPack, form]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      console.log("Form values:", values);
      
      // Get system and subsystem names from their IDs
      const system = systems.find(s => s.id === values.sistema);
      const subsystem = subsystems.find(s => s.id === values.subsistema);
      const systemName = system ? system.name : "Sistema desconocido";
      const subsystemName = subsystem ? subsystem.name : "Subsistema desconocido";
      
      if (testPack) {
        // Update existing test pack
        await updateTestPack(testPack.id, {
          sistema: systemName,
          subsistema: subsystemName,
          nombre_paquete: values.nombre_paquete,
          itr_asociado: values.itr_asociado,
          estado: testPack.estado
        });
        toast({
          title: "Test Pack actualizado",
          description: "El Test Pack ha sido actualizado correctamente"
        });
      } else {
        // Create new test pack
        await createTestPack({
          sistema: systemName,
          subsistema: subsystemName,
          nombre_paquete: values.nombre_paquete,
          itr_asociado: values.itr_asociado,
          estado: 'pendiente'
        });
        toast({
          title: "Test Pack creado",
          description: "Se ha creado un nuevo Test Pack. Ahora puede añadir TAGs individuales."
        });
      }
      onSuccess();
    } catch (error: any) {
      console.error("Error saving test pack:", error);
      toast({
        title: "Error",
        description: `No se pudo guardar el Test Pack: ${error.message || "Error desconocido"}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSystemLabel = (systemId: string) => {
    const system = systems.find(s => s.id === systemId);
    return system ? `${system.name} (${system.projectName || 'Sin proyecto'})` : "Sistema";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{testPack ? "Editar Test Pack" : "Nuevo Test Pack"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="sistema"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sistema</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedSystemId(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar sistema" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {systems.map((system) => (
                        <SelectItem key={system.id} value={system.id}>
                          {system.name} ({system.projectName || 'Sin proyecto'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subsistema"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subsistema</FormLabel>
                  <Select
                    disabled={loading || !selectedSystemId}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedSubsystemId(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedSystemId ? "Seleccionar subsistema" : "Primero seleccione un sistema"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subsystems.map((subsystem) => (
                        <SelectItem key={subsystem.id} value={subsystem.id}>
                          {subsystem.name}
                        </SelectItem>
                      ))}
                      {subsystems.length === 0 && selectedSystemId && (
                        <SelectItem value="no-subsystems" disabled>
                          No hay subsistemas disponibles
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="itr_asociado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ITR Asociado</FormLabel>
                  <Select
                    disabled={loading || !selectedSubsystemId}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedSubsystemId ? "Seleccionar ITR" : "Primero seleccione un subsistema"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {itrs.length > 0 ? (
                        itrs.map((itr) => (
                          <SelectItem key={itr.id} value={itr.id}>
                            {itr.name} ({itr.quantity || 0} TAGs)
                          </SelectItem>
                        ))
                      ) : selectedSubsystemId ? (
                        <SelectItem value="no-itrs" disabled>No hay ITRs disponibles</SelectItem>
                      ) : (
                        <SelectItem value="select-subsystem-first" disabled>Seleccione un subsistema primero</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nombre_paquete"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Test Pack</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : (testPack ? "Actualizar" : "Crear")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TestPackFormDialog;
