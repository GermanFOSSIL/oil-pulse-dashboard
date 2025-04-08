
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ITR, Subsystem } from "@/services/types";
import { createITR, updateITR } from "@/services/itrDataService";

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
  
  const [formData, setFormData] = useState({
    name: "",
    subsystem_id: "",
    status: "inprogress" as "inprogress" | "complete" | "delayed",
    progress: 0,
    assigned_to: "",
    start_date: "",
    end_date: "",
    quantity: 1 // Default quantity is 1
  });
  
  const [loading, setLoading] = useState(false);
  
  // Initialize form data when the modal opens or when the ITR changes
  useEffect(() => {
    if (itr) {
      setFormData({
        name: itr.name || "",
        subsystem_id: itr.subsystem_id || "",
        status: itr.status || "inprogress",
        progress: itr.progress || 0,
        assigned_to: itr.assigned_to || "",
        start_date: itr.start_date ? new Date(itr.start_date).toISOString().split('T')[0] : "",
        end_date: itr.end_date ? new Date(itr.end_date).toISOString().split('T')[0] : "",
        quantity: (itr as any).quantity || 1 // Get quantity if available
      });
    } else {
      // Reset form for new ITR
      setFormData({
        name: "",
        subsystem_id: subsystems.length > 0 ? subsystems[0].id : "",
        status: "inprogress",
        progress: 0,
        assigned_to: "",
        start_date: "",
        end_date: "",
        quantity: 1 // Default new ITRs to quantity 1
      });
    }
  }, [itr, subsystems, open]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Por favor ingrese un nombre para el ITR",
        variant: "destructive"
      });
      return false;
    }
    
    if (!formData.subsystem_id) {
      toast({
        title: "Subsistema requerido",
        description: "Por favor seleccione un subsistema",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.quantity || formData.quantity < 1) {
      toast({
        title: "Cantidad inválida",
        description: "La cantidad debe ser al menos 1",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Log para depuración
      console.log("Formulario a enviar:", {
        ...formData,
        progress: Number(formData.progress),
        quantity: Number(formData.quantity)
      });
      
      const dataToSend = {
        ...formData,
        progress: Number(formData.progress),
        quantity: Number(formData.quantity), // Add quantity to data sent
        assigned_to: formData.assigned_to || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };
      
      if (isEditMode && itr) {
        console.log("Actualizando ITR con ID:", itr.id);
        const updatedITR = await updateITR(itr.id, dataToSend);
        
        console.log("ITR actualizado:", updatedITR);
        
        toast({
          title: "ITR actualizado",
          description: "El ITR ha sido actualizado correctamente"
        });
      } else {
        console.log("Creando nuevo ITR");
        const newITR = await createITR(dataToSend);
        
        console.log("ITR creado:", newITR);
        
        toast({
          title: "ITR creado",
          description: "El ITR ha sido creado correctamente"
        });
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error al guardar ITR:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el ITR: " + (error instanceof Error ? error.message : "Error desconocido"),
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

          <div className="space-y-2">
            <Label htmlFor="quantity">Cantidad *</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={handleInputChange}
              placeholder="Cantidad de ITRs"
              required
            />
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
              onValueChange={(value) => handleSelectChange("status", value as "inprogress" | "complete" | "delayed")}
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
