
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AVAILABLE_PERMISSIONS, UserProfile, createUser, updateUserProfile } from "@/services/userService";
import { UserCreateData } from "@/services/types";

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: UserProfile;
}

const UserFormModal = ({ open, onClose, onSuccess, user }: UserFormModalProps) => {
  const isEditMode = !!user;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    role: user?.role || "user",
    avatar_url: user?.avatar_url || "",
    permissions: user?.permissions || [],
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        role: user.role || "user",
        avatar_url: user.avatar_url || "",
        permissions: user.permissions || [],
        email: "",
        password: "",
        confirmPassword: ""
      });
    }
  }, [user]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    // When the role changes, set default permissions
    if (name === 'role') {
      let defaultPermissions: string[] = ['dashboard'];
      
      if (value === 'admin') {
        defaultPermissions = [...AVAILABLE_PERMISSIONS];
      } else if (value === 'tecnico') {
        defaultPermissions = ['dashboard', 'reports', 'itrs'];
      } else if (value === 'user') {
        defaultPermissions = ['dashboard', 'reports'];
      }
      
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        permissions: defaultPermissions
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData(prev => {
      const currentPermissions = prev.permissions || [];
      
      if (checked) {
        return { ...prev, permissions: [...currentPermissions, permission] };
      } else {
        return { ...prev, permissions: currentPermissions.filter(p => p !== permission) };
      }
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name) {
      toast({
        title: "Nombre requerido",
        description: "Por favor ingrese un nombre para el usuario",
        variant: "destructive"
      });
      return;
    }
    
    // For creating a new user, check email and password
    if (!isEditMode) {
      if (!formData.email) {
        toast({
          title: "Email requerido",
          description: "Por favor ingrese un email para el usuario",
          variant: "destructive"
        });
        return;
      }

      if (!formData.password) {
        toast({
          title: "Contraseña requerida",
          description: "Por favor ingrese una contraseña para el usuario",
          variant: "destructive"
        });
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Las contraseñas no coinciden",
          description: "La contraseña y la confirmación deben ser iguales",
          variant: "destructive"
        });
        return;
      }
    }
    
    setLoading(true);
    
    try {
      if (isEditMode && user) {
        console.log("Updating user:", user.id, formData);
        await updateUserProfile(user.id, {
          full_name: formData.full_name,
          avatar_url: formData.avatar_url,
          role: formData.role,
          permissions: formData.permissions
        });
        toast({
          title: "Usuario actualizado",
          description: "El usuario ha sido actualizado correctamente"
        });
        onSuccess();
      } else {
        // Create a new user
        const userData: UserCreateData = {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role,
          permissions: formData.permissions
        };

        console.log("Creating new user:", userData.email, userData.full_name);
        const result = await createUser(userData);
        
        if (result.success) {
          toast({
            title: "Usuario creado",
            description: "El usuario ha sido creado correctamente"
          });
          onSuccess();
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      console.error("Error al guardar usuario:", error);
      toast({
        title: "Error",
        description: `No se pudo guardar el usuario: ${error.message || "Error desconocido"}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Usuario" : "Nuevo Usuario"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre Completo *</Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              placeholder="Ingrese nombre completo"
              required
            />
          </div>
          
          {!isEditMode && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="usuario@ejemplo.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Ingrese contraseña"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirme contraseña"
                  required
                />
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleSelectChange("role", value)}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="user">Usuario</SelectItem>
                <SelectItem value="tecnico">Técnico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="avatar_url">URL de Avatar</Label>
            <Input
              id="avatar_url"
              name="avatar_url"
              value={formData.avatar_url}
              onChange={handleInputChange}
              placeholder="https://ejemplo.com/avatar.jpg"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Permisos de acceso</Label>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {AVAILABLE_PERMISSIONS.map((permission) => (
                <div key={permission} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`permission-${permission}`}
                    checked={(formData.permissions || []).includes(permission)}
                    onCheckedChange={(checked) => 
                      handlePermissionChange(permission, checked as boolean)
                    }
                    disabled={formData.role === 'admin'} // Admins always have all permissions
                  />
                  <Label htmlFor={`permission-${permission}`} className="capitalize">
                    {permission}
                  </Label>
                </div>
              ))}
            </div>
            {formData.role === 'admin' && (
              <p className="text-xs text-muted-foreground mt-2">
                Los administradores tienen acceso a todas las secciones.
              </p>
            )}
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

export default UserFormModal;
