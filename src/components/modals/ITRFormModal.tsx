
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ITR, Subsystem, System } from '@/services/types';
import { ITRWithActions } from '@/types/itr-types';
import { createITR, updateITR, deleteITR } from '@/services/itrDataService';

export interface ITRFormModalProps {
  open: boolean;
  onClose: () => void;
  itr?: ITRWithActions;
  systems: System[];
  subsystems: Subsystem[];
  onSuccess: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  subsystem_id: z.string().min(1, 'Debe seleccionar un subsistema'),
  status: z.enum(['complete', 'inprogress', 'delayed']),
  assigned_to: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  progress: z.coerce.number().min(0).max(100).optional(),
  quantity: z.coerce.number().min(1).optional()
});

type FormValues = z.infer<typeof formSchema>;

export default function ITRFormModal({ open, onClose, itr, systems, subsystems, onSuccess }: ITRFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const defaultValues: FormValues = {
    name: '',
    subsystem_id: '',
    status: 'inprogress' as const,
    assigned_to: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    progress: 0,
    quantity: 1
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  useEffect(() => {
    if (itr) {
      form.reset({
        name: itr.name,
        subsystem_id: itr.subsystem_id,
        status: itr.status,
        assigned_to: itr.assigned_to || '',
        start_date: itr.start_date ? new Date(itr.start_date).toISOString().split('T')[0] : '',
        end_date: itr.end_date ? new Date(itr.end_date).toISOString().split('T')[0] : '',
        progress: itr.progress || 0,
        quantity: itr.quantity || 1
      });
    } else {
      form.reset(defaultValues);
    }
  }, [itr, form, open]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (itr) {
        await updateITR(itr.id, values);
        toast({
          title: 'ITR Actualizado',
          description: 'El ITR ha sido actualizado correctamente.'
        });
      } else {
        await createITR(values);
        toast({
          title: 'ITR Creado',
          description: 'El ITR ha sido creado correctamente.'
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al guardar el ITR:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al guardar el ITR. Por favor, intente nuevamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrar subsistemas por sistema seleccionado
  const filteredSubsystems = subsystems;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{itr ? 'Editar ITR' : 'Crear Nuevo ITR'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del ITR" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subsystem_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subsistema</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar subsistema" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredSubsystems.map((subsystem) => (
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="inprogress">En Progreso</SelectItem>
                      <SelectItem value="complete">Completado</SelectItem>
                      <SelectItem value="delayed">Retrasado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assigned_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asignado a</FormLabel>
                  <FormControl>
                    <Input placeholder="Responsable" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Inicio</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Fin</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="progress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progreso (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        max="100"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : itr ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
