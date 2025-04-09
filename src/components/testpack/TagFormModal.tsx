
import { useState } from "react";
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
  const { addTag, updateTag } = useTestPacks();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tag_name: tag?.tag_name || "",
    },
  });
  
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      if (tag) {
        // Update existing TAG
        await updateTag(tag.id, values);
      } else {
        // Create new TAG
        await addTag({
          test_pack_id: testPackId,
          tag_name: values.tag_name,
          estado: 'pendiente',
          fecha_liberacion: null
        });
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
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : tag ? "Guardar cambios" : "Crear TAG"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TagFormModal;
