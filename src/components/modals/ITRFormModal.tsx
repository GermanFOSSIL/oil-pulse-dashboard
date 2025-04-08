import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ITR, Subsystem, createITR, updateITR } from "@/services/supabaseService";

interface ITRFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itr?: ITR;
  subsystems: Subsystem[];
}

export const ITRFormModal = ({ 
  open, 
  onClose, 
  onSuccess, 
  itr, 
  subsystems 
}: ITRFormModalProps) => {
  const isEditMode = !!itr;
  const { toast } = useToast();
  
  // Inside the formData useState, replace due_date with end_date and add start_date:
  const [formData, setFormData] = useState({
    name: itr?.name || "",
    subsystem_id: itr?.subsystem_id || "",
    status: itr?.status || "inprogress",
    progress: itr?.progress || 0,
    assigned_to: itr?.assigned_to || "",
    start_date: itr?.start_date ? new Date(itr.start_date).toISOString().split('T')[0] : "",
    end_date: itr?.end_date ? new Date(itr.end_date).toISOString().split('T')[0] : ""
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
    
    if (!formData.name || !formData.subsystem_id) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      if (isEditMode && itr) {
        await updateITR(itr.id, formData);
        toast({
          title: "ITR actualizado",
          description: "El ITR ha sido actualizado correctamente"
        });
      } else {
        await createITR(formData);
        toast({
          title: "ITR creado",
          description: "El ITR ha sido creado correctamente"
        });
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error al guardar ITR:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el ITR",
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
            {isEditMode ? "Editar ITR" : "Nuevo ITR"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del ITR *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ingrese nombre del ITR"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subsystem_id">Subsistema *</Label>
            <Select
              value={formData.subsystem_id}
              onValueChange={(value) => handleSelectChange("subsystem_id", value)}
            >
              <SelectTrigger id="subsystem_id">
                <SelectValue placeholder="Seleccionar subsistema" />
              </SelectTrigger>
              <SelectContent>
                {subsystems.map(subsystem => (
                  <SelectItem key={subsystem.id} value={subsystem.id}>
                    {subsystem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Inside the form JSX, update the date fields: */}
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
            <Label htmlFor="progress">Progreso (%)</Label>
            <Input
              id="progress"
              name="progress"
              type="number"
              min="0"
              max="100"
              value={formData.progress}
              onChange={handleInputChange}
              placeholder="0"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange("status", value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inprogress">En progreso</SelectItem>
                <SelectItem value="complete">Completado</SelectItem>
                <SelectItem value="delayed">Retrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Asignado a</Label>
            <Input
              id="assigned_to"
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleInputChange}
              placeholder="Ingrese el nombre del responsable"
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
