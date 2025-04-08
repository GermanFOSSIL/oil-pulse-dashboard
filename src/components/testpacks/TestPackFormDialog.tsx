
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
import { getSystemsWithSubsystems, getAvailableITRs } from "@/services/systemService";

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
  itr_asociado: z.string().min(1, "El ITR asociado es requerido"),
  tagsCount: z.coerce.number().min(1, "Debe crear al menos un TAG").max(50, "Máximo 50 TAGs permitidos")
});

type FormValues = z.infer<typeof formSchema>;

const TestPackFormDialog = ({ open, onOpenChange, testPack, onSuccess }: TestPackFormDialogProps) => {
  const { toast } = useToast();
  const [systems, setSystems] = useState<any[]>([]);
  const [subsystems, setSubsystems] = useState<any[]>([]);
  const [itrs, setItrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [selectedSubsystem, setSelectedSubsystem] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sistema: testPack?.sistema || "",
      subsistema: testPack?.subsistema || "",
      nombre_paquete: testPack?.nombre_paquete || "",
      itr_asociado: testPack?.itr_asociado || "",
      tagsCount: 10 // Default to 10 tags
    }
  });

  // Load systems on component mount
  useEffect(() => {
    const loadSystemData = async () => {
      try {
        const systemsData = await getSystemsWithSubsystems();
        setSystems(systemsData);
      } catch (error) {
        console.error("Error loading systems:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los sistemas",
          variant: "destructive"
        });
      }
    };

    loadSystemData();
  }, [toast]);

  // Update subsystems when system changes
  useEffect(() => {
    if (selectedSystem) {
      const system = systems.find(s => s.id === selectedSystem);
      if (system && system.subsystems) {
        setSubsystems(system.subsystems);
      } else {
        setSubsystems([]);
      }
      form.setValue("subsistema", "");
      setSelectedSubsystem(null);
      setItrs([]);
    }
  }, [selectedSystem, systems, form]);

  // Update ITRs when subsystem changes
  useEffect(() => {
    const loadITRs = async () => {
      if (selectedSubsystem) {
        try {
          const itrsData = await getAvailableITRs(selectedSubsystem);
          setItrs(itrsData);
        } catch (error) {
          console.error("Error loading ITRs:", error);
          toast({
            title: "Error",
            description: "No se pudieron cargar los ITRs",
            variant: "destructive"
          });
        }
      }
    };

    loadITRs();
  }, [selectedSubsystem, toast]);

  // Set form values if editing
  useEffect(() => {
    if (testPack) {
      form.reset({
        sistema: testPack.sistema,
        subsistema: testPack.subsistema,
        nombre_paquete: testPack.nombre_paquete,
        itr_asociado: testPack.itr_asociado,
        tagsCount: 10
      });
    }
  }, [testPack, form]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      if (testPack) {
        // Update existing test pack
        await updateTestPack(testPack.id, values);
        toast({
          title: "Test Pack actualizado",
          description: "El Test Pack ha sido actualizado correctamente"
        });
      } else {
        // Create new test pack
        await createTestPack(values, values.tagsCount);
        toast({
          title: "Test Pack creado",
          description: `Se ha creado un nuevo Test Pack con ${values.tagsCount} TAGs`
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
                      setSelectedSystem(value);
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
                          {system.name}
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
                    disabled={loading || !selectedSystem}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedSubsystem(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedSystem ? "Seleccionar subsistema" : "Primero seleccione un sistema"} />
                      </SelectTrigger>
                    </FormControl>
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

            <FormField
              control={form.control}
              name="itr_asociado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ITR Asociado</FormLabel>
                  <Select
                    disabled={loading || !selectedSubsystem}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedSubsystem ? "Seleccionar ITR" : "Primero seleccione un subsistema"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {itrs.map((itr) => (
                        <SelectItem key={itr.id} value={itr.id}>
                          {itr.name} ({itr.quantity} TAGs)
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

            <FormField
              control={form.control}
              name="tagsCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad de TAGs</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={50} {...field} disabled={loading || !!testPack} />
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
