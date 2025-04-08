
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserProfiles, updateUserProfile, Profile } from "@/services/userService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AVAILABLE_PERMISSIONS } from "@/services/userService";

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: Profile;
}

const UserFormModal = ({ open, onClose, onSuccess, user }: UserFormModalProps) => {
  const isEditMode = !!user;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    role: user?.role || "user",
    avatar_url: user?.avatar_url || "",
    permissions: user?.permissions || []
  });
  
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
    
    setLoading(true);
    
    try {
      if (isEditMode && user) {
        await updateUserProfile(user.id, formData);
        toast({
          title: "Usuario actualizado",
          description: "El usuario ha sido actualizado correctamente"
        });
      } else {
        toast({
          title: "Error",
          description: "La creación de usuarios está disponible mediante el proceso de registro",
          variant: "destructive"
        });
        return;
      }
      
      onSuccess();
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

const Users = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | undefined>(undefined);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    
    try {
      const profiles = await getUserProfiles();
      console.log("Perfiles obtenidos:", profiles);
      setUsers(profiles);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: `No se pudieron cargar los usuarios: ${error.message || "Error desconocido"}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const columns = [
    {
      header: "Nombre",
      accessorKey: "full_name" as keyof Profile,
      cell: (user: Profile) => <span>{user.full_name || 'Sin nombre'}</span>
    },
    {
      header: "ID",
      accessorKey: "id" as keyof Profile,
      cell: (user: Profile) => <span className="text-xs text-muted-foreground">{user.id.substring(0, 8)}...</span>
    },
    {
      header: "Rol",
      accessorKey: "role" as keyof Profile,
      cell: (user: Profile) => (
        <Badge variant={user.role === "admin" ? "default" : user.role === "tecnico" ? "outline" : "secondary"}>
          {user.role === "admin" ? "Administrador" : 
           user.role === "tecnico" ? "Técnico" : "Usuario"}
        </Badge>
      ),
    },
    {
      header: "Permisos",
      accessorKey: "permissions" as keyof Profile,
      cell: (user: Profile) => {
        const permissionsCount = user.permissions?.length || 0;
        return (
          <span className="text-xs text-muted-foreground">
            {user.role === "admin" ? "Acceso completo" : 
             permissionsCount > 0 ? `${permissionsCount} ${permissionsCount === 1 ? 'sección' : 'secciones'}` : 
             "Sin permisos"}
          </span>
        );
      }
    },
    {
      header: "Estado",
      accessorKey: "id" as keyof Profile,
      cell: () => (
        <Badge 
          variant="outline"
          className="border-green-500 text-green-500"
        >
          Activo
        </Badge>
      ),
    },
    {
      header: "Fecha Creación",
      accessorKey: "created_at" as keyof Profile,
      cell: (user: Profile) => {
        const date = new Date(user.created_at);
        return <span>{date.toLocaleDateString('es-ES')}</span>;
      }
    },
  ];

  const handleEditUser = (user: Profile) => {
    console.log("Editando usuario:", user);
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleDeleteUser = async (user: Profile) => {
    // Actualmente no implementamos eliminación verdadera de usuarios por seguridad
    toast({
      title: "Funcionalidad limitada",
      description: "La eliminación de usuarios se implementará en una versión futura",
    });
  };

  const handleNewUser = () => {
    setSelectedUser(undefined);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedUser(undefined);
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    setSelectedUser(undefined);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios y permisos del sistema
          </p>
        </div>
        <Button onClick={handleNewUser}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {users.length === 0 && !loading ? (
        <Card>
          <CardHeader>
            <CardTitle>No hay usuarios</CardTitle>
            <CardDescription>
              No se encontraron usuarios en la base de datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Puede añadir usuarios utilizando el botón "Nuevo Usuario" o importar datos desde la página de configuración.</p>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          data={users}
          columns={columns}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          loading={loading}
        />
      )}

      {showModal && (
        <UserFormModal
          open={showModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          user={selectedUser}
        />
      )}
    </div>
  );
};

export default Users;
