
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Subsystem, System } from "@/services/types";
import { createSubsystem, updateSubsystem } from "@/services/subsystemService";

interface SubsystemFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subsystem?: Subsystem | null;
  systems: System[];
}

export const SubsystemFormModal = ({ 
  open, 
  onClose, 
  onSuccess, 
  subsystem, 
  systems 
}: SubsystemFormModalProps) => {
  const isEditMode = !!subsystem;
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: subsystem?.name || "",
    system_id: subsystem?.system_id || "",
    completion_rate: subsystem?.completion_rate || 0,
    start_date: subsystem?.start_date ? new Date(subsystem.start_date).toISOString().split('T')[0] : "",
    end_date: subsystem?.end_date ? new Date(subsystem.end_date).toISOString().split('T')[0] : ""
  });
  
  const [loading, setLoading] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.system_id) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      if (isEditMode && subsystem) {
        await updateSubsystem(subsystem.id, formData);
        toast({
          title: "Subsistema actualizado",
          description: "El subsistema ha sido actualizado correctamente"
        });
      } else {
        await createSubsystem(formData);
        toast({
          title: "Subsistema creado",
          description: "El subsistema ha sido creado correctamente"
        });
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error al guardar subsistema:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el subsistema",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Subsistema" : "Nuevo Subsistema"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Subsistema *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ingrese nombre del subsistema"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="system_id">Sistema *</Label>
            <Select
              value={formData.system_id}
              onValueChange={(value) => handleSelectChange("system_id", value)}
            >
              <SelectTrigger id="system_id">
                <SelectValue placeholder="Seleccionar sistema" />
              </SelectTrigger>
              <SelectContent>
                {systems.map(system => (
                  <SelectItem key={system.id} value={system.id}>
                    {system.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="start_date">Fecha de inicio</Label>
            <Input
              id="start_date"
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="end_date">Fecha de fin</Label>
            <Input
              id="end_date"
              name="end_date"
              type="date"
              value={formData.end_date}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="completion_rate">Tasa de Completado (%)</Label>
            <Input
              id="completion_rate"
              name="completion_rate"
              type="number"
              min="0"
              max="100"
              value={formData.completion_rate}
              onChange={handleInputChange}
              placeholder="0"
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : isEditMode ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
