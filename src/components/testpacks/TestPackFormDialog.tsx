
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createTestPack, updateTestPack, TestPack } from "@/services/testPackService";

interface TestPackFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  testPack?: TestPack | null;
}

const TestPackFormDialog = ({ open, onOpenChange, onSuccess, testPack }: TestPackFormDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!testPack;
  
  const [formData, setFormData] = useState({
    sistema: '',
    subsistema: '',
    nombre_paquete: '',
    itr_asociado: '',
    estado: 'pendiente'
  });
  
  useEffect(() => {
    if (testPack) {
      setFormData({
        sistema: testPack.sistema,
        subsistema: testPack.subsistema,
        nombre_paquete: testPack.nombre_paquete,
        itr_asociado: testPack.itr_asociado,
        estado: testPack.estado
      });
    }
  }, [testPack]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sistema || !formData.subsistema || !formData.nombre_paquete || !formData.itr_asociado) {
      toast({
        title: "Campos incompletos",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      if (isEditMode && testPack) {
        await updateTestPack(testPack.id, formData);
        toast({
          title: "Test Pack actualizado",
          description: "El Test Pack ha sido actualizado correctamente"
        });
      } else {
        await createTestPack(formData);
        toast({
          title: "Test Pack creado",
          description: "El Test Pack ha sido creado correctamente"
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Test Pack" : "Nuevo Test Pack"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="sistema">Sistema *</Label>
            <Input
              id="sistema"
              name="sistema"
              value={formData.sistema}
              onChange={handleInputChange}
              placeholder="Nombre del sistema"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subsistema">Subsistema *</Label>
            <Input
              id="subsistema"
              name="subsistema"
              value={formData.subsistema}
              onChange={handleInputChange}
              placeholder="Nombre del subsistema"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nombre_paquete">Nombre del Test Pack *</Label>
            <Input
              id="nombre_paquete"
              name="nombre_paquete"
              value={formData.nombre_paquete}
              onChange={handleInputChange}
              placeholder="Nombre identificativo del paquete"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="itr_asociado">ITR Asociado *</Label>
            <Input
              id="itr_asociado"
              name="itr_asociado"
              value={formData.itr_asociado}
              onChange={handleInputChange}
              placeholder="Código o nombre del ITR"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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

export default TestPackFormDialog;
