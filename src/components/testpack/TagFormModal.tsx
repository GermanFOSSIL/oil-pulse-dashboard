
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
import { Tag } from "@/services/types";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TagFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  testPackId: string;
  tag?: Tag;
}

const formSchema = z.object({
  tag_name: z.string().min(1, "El nombre es requerido"),
});

type FormValues = z.infer<typeof formSchema>;

const TagFormModal = ({ isOpen, onClose, onSuccess, testPackId, tag }: TagFormModalProps) => {
  const { addTagWithRetry, updateTag } = useTestPacks();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tag_name: tag?.tag_name || "",
    },
  });
  
  useEffect(() => {
    // Reset form when modal opens or when tag changes
    if (isOpen) {
      form.reset({
        tag_name: tag?.tag_name || "",
      });
      setError(null);
    }
  }, [isOpen, tag, form]);
  
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      if (tag) {
        // Update existing TAG
        console.log("Actualizando TAG:", { id: tag.id, ...values });
        await updateTag(tag.id, values);
        toast({
          title: "Éxito",
          description: "TAG actualizado correctamente",
        });
      } else {
        // Create new TAG
        console.log("Creando nuevo TAG:", { test_pack_id: testPackId, ...values });
        await addTagWithRetry({
          test_pack_id: testPackId,
          tag_name: values.tag_name,
          estado: 'pendiente',
          fecha_liberacion: null
        });
        toast({
          title: "Éxito",
          description: "TAG creado correctamente",
        });
      }
      onSuccess();
    } catch (err) {
      console.error("Error al enviar el formulario:", err);
      setError("No se pudo guardar el TAG. Por favor, inténtelo de nuevo.");
      toast({
        title: "Error",
        description: "No se pudo guardar el TAG",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{tag ? "Editar TAG" : "Nuevo TAG"}</DialogTitle>
          <DialogDescription>
            {tag 
              ? "Actualice los detalles del TAG." 
              : "Complete los datos para crear un nuevo TAG."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tag_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del TAG</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el nombre del TAG" {...field} />
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
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {tag ? "Guardando..." : "Creando..."}
                  </>
                ) : (
                  tag ? "Guardar cambios" : "Crear TAG"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TagFormModal;
