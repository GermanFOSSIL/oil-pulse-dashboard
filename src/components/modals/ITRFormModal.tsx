
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { 
  ITR, 
  Subsystem, 
  createITR, 
  updateITR,
  getSystemsByProjectId,
  getSubsystemsBySystemId,
  System,
  Project,
  getProjects,
  getUserProfiles,
  Profile
} from "@/services/supabaseService";

interface ITRFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itr?: ITR;
  initialProjectId?: string | null;
}

export const ITRFormModal = ({ 
  open, 
  onClose, 
  onSuccess,
  itr,
  initialProjectId
}: ITRFormModalProps) => {
  const isEditMode = !!itr;
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [subsystems, setSubsystems] = useState<Subsystem[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: itr?.name || "",
    project_id: initialProjectId || "",
    system_id: "",
    subsystem_id: itr?.subsystem_id || "",
    status: itr?.status || "inprogress",
    progress: itr?.progress || 0,
    due_date: itr?.due_date ? new Date(itr.due_date).toISOString().split('T')[0] : "",
    assigned_to: itr?.assigned_to || ""
  });
  
  useEffect(() => {
    const loadInitialData = async () => {
      setFormLoading(true);
      setError(null);
      try {
        console.log("Loading initial data for ITR form");
        // Cargar proyectos
        const projectsData = await getProjects();
        console.log("Projects loaded:", projectsData);
        setProjects(projectsData);
        
        // Cargar perfiles de usuario para asignación
        const profilesData = await getUserProfiles();
        console.log("User profiles loaded:", profilesData);
        setProfiles(profilesData);
        
        // Si hay un proyecto seleccionado o un ITR con proyecto, cargar sus sistemas
        if (formData.project_id) {
          console.log("Loading systems for project ID:", formData.project_id);
          const systemsData = await getSystemsByProjectId(formData.project_id);
          console.log("Systems loaded:", systemsData);
          setSystems(systemsData);
          
          // Si estamos editando un ITR existente
          if (isEditMode && itr) {
            console.log("Edit mode, loading subsystem data for ITR:", itr);
            // Necesitamos encontrar el sistema al que pertenece el subsistema del ITR
            let foundSubsystemSystem = false;
            
            for (const system of systemsData) {
              const subsystemsForSystem = await getSubsystemsBySystemId(system.id);
              const matchingSubsystem = subsystemsForSystem.find(sub => sub.id === itr.subsystem_id);
              
              if (matchingSubsystem) {
                console.log("Found matching subsystem in system:", system.id);
                // Actualizamos el sistema seleccionado
                setFormData(prev => ({ 
                  ...prev, 
                  system_id: system.id
                }));
                
                // Cargamos los subsistemas para este sistema
                setSubsystems(subsystemsForSystem);
                foundSubsystemSystem = true;
                break;
              }
            }
            
            if (!foundSubsystemSystem) {
              console.log("Could not find system for subsystem:", itr.subsystem_id);
              // Si no encontramos el sistema, cargar solo el subsistema actual
              const subsystemData = await getSubsystemById(itr.subsystem_id);
              if (subsystemData) {
                const systemData = await getSystemById(subsystemData.system_id);
                if (systemData) {
                  setSystems([systemData]);
                  setFormData(prev => ({ 
                    ...prev, 
                    system_id: systemData.id
                  }));
                  
                  const subsystemsForSystem = await getSubsystemsBySystemId(systemData.id);
                  setSubsystems(subsystemsForSystem);
                }
              }
            }
          }
        }
      } catch (error: any) {
        console.error("Error al cargar datos iniciales:", error);
        setError(`Error al cargar datos: ${error.message || "Ocurrió un problema al conectar con la base de datos"}`);
      } finally {
        setFormLoading(false);
      }
    };
    
    loadInitialData();
  }, [itr, initialProjectId]);
  
  useEffect(() => {
    // Cuando cambia el sistema seleccionado, cargar sus subsistemas
    const loadSubsystems = async () => {
      if (formData.system_id) {
        try {
          console.log("Loading subsystems for system ID:", formData.system_id);
          const subsystemsData = await getSubsystemsBySystemId(formData.system_id);
          console.log("Subsystems loaded:", subsystemsData);
          setSubsystems(subsystemsData);
        } catch (error: any) {
          console.error("Error al cargar subsistemas:", error);
          setError(`Error al cargar subsistemas: ${error.message}`);
        }
      } else {
        setSubsystems([]);
      }
    };
    
    loadSubsystems();
  }, [formData.system_id]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    if (name === "project_id") {
      console.log("Project changed to:", value);
      // Al cambiar el proyecto, reiniciamos sistema y subsistema
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        system_id: "",
        subsystem_id: ""
      }));
    } else if (name === "system_id") {
      console.log("System changed to:", value);
      // Al cambiar el sistema, reiniciamos subsistema
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        subsystem_id: ""
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.name || !formData.subsystem_id) {
      setError("Por favor complete todos los campos obligatorios");
      return;
    }
    
    if (!formData.project_id) {
      setError("Debe seleccionar un proyecto");
      return;
    }
    
    setLoading(true);
    
    try {
      const itrData = {
        ...formData,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null
      };
      
      // Eliminamos project_id y system_id ya que no son parte del modelo ITR en la base de datos
      const { project_id, system_id, ...submitData } = itrData;
      
      console.log("Guardando ITR con datos:", submitData);
      
      if (isEditMode && itr) {
        await updateITR(itr.id, submitData);
        toast({
          title: "ITR actualizado",
          description: "El ITR ha sido actualizado correctamente"
        });
      } else {
        await createITR(submitData);
        toast({
          title: "ITR creado",
          description: "El ITR ha sido creado correctamente"
        });
      }
      
      onSuccess();
    } catch (error: any) {
      console.error("Error al guardar ITR:", error);
      setError(`Error al guardar ITR: ${error.message || "Hubo un problema al guardar los datos"}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (formLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar ITR" : "Nuevo ITR"}
          </DialogTitle>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="my-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
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
            <Label htmlFor="project_id">Proyecto *</Label>
            <Select
              value={formData.project_id}
              onValueChange={(value) => handleSelectChange("project_id", value)}
              disabled={!!initialProjectId}
            >
              <SelectTrigger id="project_id">
                <SelectValue placeholder="Seleccionar proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects.length === 0 ? (
                  <SelectItem value="no-projects">No hay proyectos disponibles</SelectItem>
                ) : (
                  projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="system_id">Sistema *</Label>
            <Select
              value={formData.system_id}
              onValueChange={(value) => handleSelectChange("system_id", value)}
              disabled={!formData.project_id}
            >
              <SelectTrigger id="system_id">
                <SelectValue placeholder={formData.project_id ? "Seleccionar sistema" : "Primero seleccione un proyecto"} />
              </SelectTrigger>
              <SelectContent>
                {systems.length === 0 ? (
                  <SelectItem value="no-systems">No hay sistemas disponibles para este proyecto</SelectItem>
                ) : (
                  systems.map(system => (
                    <SelectItem key={system.id} value={system.id}>
                      {system.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subsystem_id">Subsistema *</Label>
            <Select
              value={formData.subsystem_id}
              onValueChange={(value) => handleSelectChange("subsystem_id", value)}
              disabled={!formData.system_id}
            >
              <SelectTrigger id="subsystem_id">
                <SelectValue placeholder={formData.system_id ? "Seleccionar subsistema" : "Primero seleccione un sistema"} />
              </SelectTrigger>
              <SelectContent>
                {subsystems.length === 0 ? (
                  <SelectItem value="no-subsystems">No hay subsistemas disponibles para este sistema</SelectItem>
                ) : (
                  subsystems.map(subsystem => (
                    <SelectItem key={subsystem.id} value={subsystem.id}>
                      {subsystem.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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
                <SelectItem value="inprogress">En Progreso</SelectItem>
                <SelectItem value="complete">Completado</SelectItem>
                <SelectItem value="delayed">Retrasado</SelectItem>
              </SelectContent>
            </Select>
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
            <Label htmlFor="due_date">Fecha Límite</Label>
            <Input
              id="due_date"
              name="due_date"
              type="date"
              value={formData.due_date}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="assigned_to">Asignado a</Label>
            <Select
              value={formData.assigned_to || "unassigned"}
              onValueChange={(value) => handleSelectChange("assigned_to", value === "unassigned" ? "" : value)}
            >
              <SelectTrigger id="assigned_to">
                <SelectValue placeholder="Seleccionar responsable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Sin asignar</SelectItem>
                {profiles.map(profile => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.full_name || profile.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

// Add missing functions import to fix the "getSubsystemById is not defined" error
const getSubsystemById = async (id: string): Promise<Subsystem | null> => {
  const { data, error } = await supabase
    .from('subsystems')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching subsystem with id ${id}:`, error);
    throw error;
  }

  return data as unknown as Subsystem;
};

const getSystemById = async (id: string): Promise<System | null> => {
  const { data, error } = await supabase
    .from('systems')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching system with id ${id}:`, error);
    throw error;
  }

  return data as unknown as System;
};
