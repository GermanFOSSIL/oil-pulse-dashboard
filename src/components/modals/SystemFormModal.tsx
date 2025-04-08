import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { System, Project, createSystem, updateSystem } from "@/services/supabaseService";

interface SystemFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  system?: System;
  projects: Project[];
}

export const SystemFormModal = ({ 
  open, 
  onClose, 
  onSuccess, 
  system, 
  projects 
}: SystemFormModalProps) => {
  const isEditMode = !!system;
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: system?.name || "",
    project_id: system?.project_id || "",
    completion_rate: system?.completion_rate || 0,
    start_date: system?.start_date ? new Date(system.start_date).toISOString().split('T')[0] : "",
    end_date: system?.end_date ? new Date(system.end_date).toISOString().split('T')[0] : ""
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
    
    if (!formData.name || !formData.project_id) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      if (isEditMode && system) {
        await updateSystem(system.id, formData);
        toast({
          title: "Sistema actualizado",
          description: "El sistema ha sido actualizado correctamente"
        });
      } else {
        await createSystem(formData);
        toast({
          title: "Sistema creado",
          description: "El sistema ha sido creado correctamente"
        });
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error al guardar sistema:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el sistema",
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
            {isEditMode ? "Editar Sistema" : "Nuevo Sistema"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Sistema *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ingrese nombre del sistema"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="project_id">Proyecto *</Label>
            <Select
              value={formData.project_id}
              onValueChange={(value) => handleSelectChange("project_id", value)}
            >
              <SelectTrigger id="project_id">
                <SelectValue placeholder="Seleccionar proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
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
