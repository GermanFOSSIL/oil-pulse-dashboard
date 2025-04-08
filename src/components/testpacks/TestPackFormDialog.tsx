
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  createTestPack, 
  updateTestPack, 
  TestPack,
  getAvailableSystems,
  getAvailableSubsystems,
  getAvailableITRs
} from "@/services/testPackService";

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

  const [systems, setSystems] = useState<{id: string, name: string}[]>([]);
  const [subsystems, setSubsystems] = useState<{id: string, name: string}[]>([]);
  const [itrs, setItrs] = useState<{id: string, name: string, quantity: number}[]>([]);
  
  const [selectedSystemId, setSelectedSystemId] = useState<string>('');
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string>('');
  const [selectedItrId, setSelectedItrId] = useState<string>('');
  const [selectedItrQuantity, setSelectedItrQuantity] = useState<number>(0);
  const [loadingSystems, setLoadingSystems] = useState(false);
  const [loadingSubsystems, setLoadingSubsystems] = useState(false);
  const [loadingItrs, setLoadingItrs] = useState(false);
  
  // Fetch available systems
  useEffect(() => {
    const fetchSystems = async () => {
      setLoadingSystems(true);
      try {
        const data = await getAvailableSystems();
        setSystems(data);
      } catch (error) {
        console.error("Error fetching systems:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los sistemas disponibles",
          variant: "destructive"
        });
      } finally {
        setLoadingSystems(false);
      }
    };
    
    if (open) {
      fetchSystems();
    }
  }, [open, toast]);
  
  // Fetch subsystems when a system is selected
  useEffect(() => {
    const fetchSubsystems = async () => {
      if (!selectedSystemId) return;
      
      setLoadingSubsystems(true);
      try {
        const data = await getAvailableSubsystems(selectedSystemId);
        setSubsystems(data);
      } catch (error) {
        console.error("Error fetching subsystems:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los subsistemas disponibles",
          variant: "destructive"
        });
      } finally {
        setLoadingSubsystems(false);
      }
    };
    
    fetchSubsystems();
  }, [selectedSystemId, toast]);
  
  // Fetch ITRs when a subsystem is selected
  useEffect(() => {
    const fetchITRs = async () => {
      if (!selectedSubsystemId) return;
      
      setLoadingItrs(true);
      try {
        const data = await getAvailableITRs(selectedSubsystemId);
        setItrs(data);
      } catch (error) {
        console.error("Error fetching ITRs:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los ITRs disponibles",
          variant: "destructive"
        });
      } finally {
        setLoadingItrs(false);
      }
    };
    
    fetchITRs();
  }, [selectedSubsystemId, toast]);
  
  // Handle system selection
  const handleSystemChange = (value: string) => {
    const selectedSystem = systems.find(s => s.id === value);
    if (selectedSystem) {
      setSelectedSystemId(value);
      setFormData(prev => ({ ...prev, sistema: selectedSystem.name }));
      setSelectedSubsystemId('');
      setSelectedItrId('');
      setFormData(prev => ({ ...prev, subsistema: '', itr_asociado: '' }));
    }
  };
  
  // Handle subsystem selection
  const handleSubsystemChange = (value: string) => {
    const selectedSubsystem = subsystems.find(s => s.id === value);
    if (selectedSubsystem) {
      setSelectedSubsystemId(value);
      setFormData(prev => ({ ...prev, subsistema: selectedSubsystem.name }));
      setSelectedItrId('');
      setFormData(prev => ({ ...prev, itr_asociado: '' }));
    }
  };
  
  // Handle ITR selection
  const handleItrChange = (value: string) => {
    const selectedItr = itrs.find(i => i.id === value);
    if (selectedItr) {
      setSelectedItrId(value);
      setSelectedItrQuantity(selectedItr.quantity || 0);
      setFormData(prev => ({ ...prev, itr_asociado: selectedItr.name }));
    }
  };
  
  // Load existing test pack data for edit mode
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
        // Create test pack with tags
        await createTestPack(formData, selectedItrQuantity);
        toast({
          title: "Test Pack creado",
          description: `El Test Pack ha sido creado correctamente con ${selectedItrQuantity} TAGs`
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
          <DialogDescription>
            Complete la información del Test Pack. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="sistema">Sistema *</Label>
            {isEditMode ? (
              <Input
                id="sistema"
                name="sistema"
                value={formData.sistema}
                onChange={handleInputChange}
                placeholder="Nombre del sistema"
                required
              />
            ) : (
              <Select onValueChange={handleSystemChange} value={selectedSystemId}>
                <SelectTrigger className="w-full" disabled={loadingSystems}>
                  <SelectValue placeholder="Seleccione un sistema" />
                </SelectTrigger>
                <SelectContent>
                  {systems.map((system) => (
                    <SelectItem key={system.id} value={system.id}>
                      {system.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subsistema">Subsistema *</Label>
            {isEditMode ? (
              <Input
                id="subsistema"
                name="subsistema"
                value={formData.subsistema}
                onChange={handleInputChange}
                placeholder="Nombre del subsistema"
                required
              />
            ) : (
              <Select onValueChange={handleSubsystemChange} value={selectedSubsystemId} disabled={!selectedSystemId || loadingSubsystems}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione un subsistema" />
                </SelectTrigger>
                <SelectContent>
                  {subsystems.map((subsystem) => (
                    <SelectItem key={subsystem.id} value={subsystem.id}>
                      {subsystem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="itr_asociado">ITR Asociado *</Label>
            {isEditMode ? (
              <Input
                id="itr_asociado"
                name="itr_asociado"
                value={formData.itr_asociado}
                onChange={handleInputChange}
                placeholder="Código o nombre del ITR"
                required
              />
            ) : (
              <Select onValueChange={handleItrChange} value={selectedItrId} disabled={!selectedSubsystemId || loadingItrs}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione un ITR" />
                </SelectTrigger>
                <SelectContent>
                  {itrs.map((itr) => (
                    <SelectItem key={itr.id} value={itr.id}>
                      {itr.name} ({itr.quantity} TAGs)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
