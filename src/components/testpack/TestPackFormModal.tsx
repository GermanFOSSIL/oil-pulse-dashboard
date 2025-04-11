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
import { useTestPacks } from "@/hooks/useTestPacks";
import { TestPack } from "@/services/types";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TestPackFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  testPack?: TestPack;
}

const formSchema = z.object({
  nombre_paquete: z.string().min(1, "El nombre del paquete es requerido"),
  sistema: z.string().min(1, "El sistema es requerido"),
  subsistema: z.string().min(1, "El subsistema es requerido"),
  itr_asociado: z.string().min(1, "El ITR asociado es requerido"),
  estado: z.enum(["pendiente", "completo", "en_progreso"]).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const TestPackFormModal = ({ isOpen, onClose, onSuccess, testPack }: TestPackFormModalProps) => {
  const { addTestPack, updateTestPack } = useTestPacks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre_paquete: testPack?.nombre_paquete || "",
      sistema: testPack?.sistema || "",
      subsistema: testPack?.subsistema || "",
      itr_asociado: testPack?.itr_asociado || "",
      estado: testPack?.estado as "pendiente" | "completo" | "en_progreso" || "pendiente",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        nombre_paquete: testPack?.nombre_paquete || "",
        sistema: testPack?.sistema || "",
        subsistema: testPack?.subsistema || "",
        itr_asociado: testPack?.itr_asociado || "",
        estado: testPack?.estado as "pendiente" | "completo" | "en_progreso" || "pendiente",
      });
      setError(null);
    }
  }, [isOpen, testPack, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Prepare data object for the API
      const testPackData = {
        nombre_paquete: values.nombre_paquete,
        sistema: values.sistema,
        subsistema: values.subsistema,
        itr_asociado: values.itr_asociado,
        estado: values.estado || 'pendiente'
      };
      
      if (testPack) {
        // Update existing test pack
        await updateTestPack(testPack.id, testPackData);
        toast({
          title: "Test Pack Actualizado",
          description: "El test pack ha sido actualizado correctamente"
        });
      } else {
        // Create new test pack
        await addTestPack(testPackData);
        toast({
          title: "Test Pack Creado",
          description: "El test pack ha sido creado correctamente"
        });
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error al enviar el formulario:", err);
      setError("No se pudo guardar el test pack. Por favor, inténtelo de nuevo.");
      toast({
        title: "Error",
        description: "No se pudo guardar el test pack",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{testPack ? "Editar Test Pack" : "Nuevo Test Pack"}</DialogTitle>
          <DialogDescription>
            {testPack
              ? "Actualice los detalles del test pack."
              : "Complete los datos para crear un nuevo test pack."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre_paquete"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Paquete</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el nombre del paquete" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sistema"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sistema</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el sistema" {...field} />
                  </FormControl>
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
                  <FormControl>
                    <Input placeholder="Ingrese el subsistema" {...field} />
                  </FormControl>
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
                  <FormControl>
                    <Input placeholder="Ingrese el ITR asociado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="text-sm text-destructive mt-2">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
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
      </DialogContent>
    </Dialog>
  );
};

export default TestPackFormModal;
