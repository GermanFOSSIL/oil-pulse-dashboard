import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Plus, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserProfiles, updateUserProfile, AVAILABLE_PERMISSIONS, UserProfile, createUser } from "@/services/userService";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UserCreateData } from "@/services/types";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface PasswordChangeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: UserProfile;
}

interface PasswordChangeData {
  userId: string;
  newPassword: string;
}

const changeUserPassword = async (data: PasswordChangeData): Promise<{ success: boolean; message: string }> => {
  try {
    return { 
      success: false, 
      message: "La funcionalidad de cambio de contraseña requiere permisos de administrador en Supabase" 
    };
  } catch (error: any) {
    console.error("Error changing password:", error);
    return { 
      success: false, 
      message: `Error al cambiar la contraseña: ${error.message || "Error desconocido"}` 
    };
  }
};

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
  const { isAdmin } = useAuth();
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    role: user?.role || "user",
    avatar_url: user?.avatar_url || "",
    permissions: user?.permissions || [],
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
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
        const userData: UserCreateData = {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role,
          permissions: formData.permissions
        };

        const result = await createUser(userData);
        
        if (result.success) {
          toast({
            title: "Usuario creado",
            description: result.message
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
        
        {!isAdmin && !isEditMode && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Permisos insuficientes</AlertTitle>
            <AlertDescription>
              La creación de nuevos usuarios requiere permisos de administrador en Supabase.
              Los usuarios creados necesitarán verificar su correo electrónico.
            </AlertDescription>
          </Alert>
        )}
        
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
                    disabled={formData.role === 'admin'}
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

const PasswordChangeModal = ({ open, onClose, onSuccess, user }: PasswordChangeModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast({
        title: "Contraseña requerida",
        description: "Por favor ingrese una contraseña",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Las contraseñas no coinciden",
        description: "La contraseña y la confirmación deben ser iguales",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const data: PasswordChangeData = {
        userId: user.id,
        newPassword: password
      };

      const result = await changeUserPassword(data);

      if (result.success) {
        toast({
          title: "Contraseña actualizada",
          description: "La contraseña ha sido actualizada correctamente"
        });
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Error al cambiar contraseña:", error);
      toast({
        title: "Error",
        description: `No se pudo cambiar la contraseña: ${error.message || "Error desconocido"}`,
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
            Cambiar contraseña para {user.full_name || 'usuario'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nueva contraseña *</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese la nueva contraseña"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirmar contraseña *</Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme la contraseña"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Cambiar contraseña"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Users = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | undefined>(undefined);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

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
      accessorKey: "full_name" as keyof UserProfile,
      cell: (user: UserProfile) => <span>{user.full_name || 'Sin nombre'}</span>
    },
    {
      header: "ID",
      accessorKey: "id" as keyof UserProfile,
      cell: (user: UserProfile) => <span className="text-xs text-muted-foreground">{user.id.substring(0, 8)}...</span>
    },
    {
      header: "Rol",
      accessorKey: "role" as keyof UserProfile,
      cell: (user: UserProfile) => (
        <Badge variant={user.role === "admin" ? "default" : user.role === "tecnico" ? "outline" : "secondary"}>
          {user.role === "admin" ? "Administrador" : 
           user.role === "tecnico" ? "Técnico" : "Usuario"}
        </Badge>
      ),
    },
    {
      header: "Permisos",
      accessorKey: "permissions" as keyof UserProfile,
      cell: (user: UserProfile) => {
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
      accessorKey: "id" as keyof UserProfile,
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
      accessorKey: "created_at" as keyof UserProfile,
      cell: (user: UserProfile) => {
        const date = new Date(user.created_at || '');
        return <span>{date.toLocaleDateString('es-ES')}</span>;
      }
    },
    {
      header: "Acciones",
      accessorKey: "id" as keyof UserProfile,
      cell: (user: UserProfile) => (
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleChangePassword(user)}
            title="Cambiar contraseña"
            disabled={!isAdmin}
          >
            <Key className="h-4 w-4" />
          </Button>
        </div>
      ),
    }
  ];

  const handleEditUser = (user: UserProfile) => {
    console.log("Editando usuario:", user);
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleChangePassword = (user: UserProfile) => {
    if (!isAdmin) {
      toast({
        title: "Permisos insuficientes",
        description: "Necesita permisos de administrador para cambiar contraseñas",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedUser(user);
    setShowPasswordModal(true);
  };

  const handleDeleteUser = async (user: UserProfile) => {
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

  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    setSelectedUser(undefined);
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    setSelectedUser(undefined);
    fetchUsers();
  };

  const handlePasswordChangeSuccess = () => {
    setShowPasswordModal(false);
    setSelectedUser(undefined);
    toast({
      title: "Contraseña actualizada",
      description: "La contraseña ha sido cambiada exitosamente"
    });
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

      {!isAdmin && (
        <Alert variant="destructive" className="bg-amber-50 border-amber-200 mb-4">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Permisos insuficientes</AlertTitle>
          <AlertDescription className="text-amber-700">
            Algunas funciones de administración de usuarios están limitadas porque su cuenta no tiene permisos de administrador en Supabase.
          </AlertDescription>
        </Alert>
      )}

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

      {showPasswordModal && selectedUser && (
        <PasswordChangeModal
          open={showPasswordModal}
          onClose={handlePasswordModalClose}
          onSuccess={handlePasswordChangeSuccess}
          user={selectedUser}
        />
      )}
    </div>
  );
};

export default Users;
