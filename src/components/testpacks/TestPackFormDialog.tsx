
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createTestPack, createTag, TestPack } from "@/services/testPackService";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash } from "lucide-react";

interface TestPackFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testPack?: TestPack | null;
  onSuccess: () => void;
}

// Define the schema for the test pack form
const testPackSchema = z.object({
  sistema: z.string().min(1, { message: "El sistema es requerido" }),
  subsistema: z.string().min(1, { message: "El subsistema es requerido" }),
  nombre_paquete: z.string().min(1, { message: "El nombre del paquete es requerido" }),
  itr_asociado: z.string().min(1, { message: "El ITR asociado es requerido" }),
  tags: z.array(
    z.object({
      tag_name: z.string().min(1, { message: "El nombre del TAG es requerido" })
    })
  ).optional()
});

type TestPackFormValues = z.infer<typeof testPackSchema>;

const TestPackFormDialog = ({ open, onOpenChange, testPack, onSuccess }: TestPackFormDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInputs, setTagInputs] = useState<{ id: number; tag_name: string }[]>([
    { id: 1, tag_name: "" }
  ]);

  // Initialize the form
  const form = useForm<TestPackFormValues>({
    resolver: zodResolver(testPackSchema),
    defaultValues: {
      sistema: testPack?.sistema || "",
      subsistema: testPack?.subsistema || "",
      nombre_paquete: testPack?.nombre_paquete || "",
      itr_asociado: testPack?.itr_asociado || "",
      tags: []
    }
  });

  // Add a new tag input field
  const addTagInput = () => {
    const newId = tagInputs.length > 0 ? Math.max(...tagInputs.map(t => t.id)) + 1 : 1;
    setTagInputs([...tagInputs, { id: newId, tag_name: "" }]);
  };

  // Remove a tag input field
  const removeTagInput = (id: number) => {
    if (tagInputs.length > 1) {
      setTagInputs(tagInputs.filter(t => t.id !== id));
    }
  };

  // Update a tag input field
  const updateTagInput = (id: number, value: string) => {
    setTagInputs(tagInputs.map(t => (t.id === id ? { ...t, tag_name: value } : t)));
  };

  // Submit handler
  const onSubmit = async (values: TestPackFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Filter out empty tags
      const validTags = tagInputs.filter(t => t.tag_name.trim() !== "");
      
      if (validTags.length === 0) {
        toast({
          title: "Error",
          description: "Debe agregar al menos un TAG válido",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Create the test pack
      const newTestPack = await createTestPack({
        sistema: values.sistema,
        subsistema: values.subsistema,
        nombre_paquete: values.nombre_paquete,
        itr_asociado: values.itr_asociado,
        estado: 'pendiente'
      });
      
      // Create tags for the test pack
      const tagPromises = validTags.map(tag => 
        createTag({
          test_pack_id: newTestPack.id,
          tag_name: tag.tag_name,
          estado: 'pendiente',
          fecha_liberacion: null
        })
      );
      
      await Promise.all(tagPromises);
      
      toast({
        title: "Test Pack creado",
        description: `Se ha creado correctamente el Test Pack con ${validTags.length} TAGs.`
      });
      
      onSuccess();
    } catch (error) {
      console.error("Error creating test pack:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el Test Pack. Por favor, inténtelo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear Test Pack</DialogTitle>
          <DialogDescription>
            Complete el formulario para crear un nuevo Test Pack con sus TAGs asociados.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sistema"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sistema</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del sistema" {...field} />
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
                      <Input placeholder="Nombre del subsistema" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombre_paquete"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Paquete</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del test pack" {...field} />
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
                      <Input placeholder="Código de ITR" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <FormLabel>TAGs</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={addTagInput}>
                  <Plus className="h-4 w-4 mr-1" /> Agregar TAG
                </Button>
              </div>
              
              <div className="space-y-2">
                {tagInputs.map((tag) => (
                  <div key={tag.id} className="flex items-center gap-2">
                    <Input
                      placeholder="Nombre del TAG"
                      value={tag.tag_name}
                      onChange={(e) => updateTagInput(tag.id, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTagInput(tag.id)}
                      disabled={tagInputs.length <= 1}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando...
                  </>
                ) : (
                  "Crear Test Pack"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TestPackFormDialog;
