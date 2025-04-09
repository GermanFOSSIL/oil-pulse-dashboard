import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  getUserProfiles, 
  UserProfile, 
  createUser, 
  updateUserProfile,
  changeUserPassword,
  bulkCreateUsers,
  setRodrigoAsAdmin
} from "@/services/userService";
import { supabase } from "@/integrations/supabase/client";
import { BulkUserData } from "@/services/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, PlusCircle, RefreshCw, AlertTriangle, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import UsersList from "@/components/users/UsersList";
import UserForm from "@/components/users/UserForm";
import BulkUserUpload from "@/components/users/BulkUserUpload";
import PasswordChangeForm from "@/components/users/PasswordChangeForm";
import { useAuth } from "@/contexts/AuthContext";

const Users = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth(); // Get the current user from Auth context
  const [users, setUsers] = useState<Array<any>>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [currentEditUser, setCurrentEditUser] = useState<any | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false);
  const [userIdForPasswordChange, setUserIdForPasswordChange] = useState<string | null>(null);
  
  const [isSettingAdmin, setIsSettingAdmin] = useState(false);
  const [adminSetSuccess, setAdminSetSuccess] = useState(false);
  
  // Fetch all user profiles (not auth users)
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching user profiles");
      // Get all profiles from the public.profiles table with enhanced data
      const profiles = await getUserProfiles();
      
      // Enhanced logging to check what we got
      console.log("Received profiles:", profiles);
      
      // Convert profiles to the expected format with explicit email handling
      const usersList = profiles.map(profile => {
        console.log(`Processing profile ${profile.id} with email:`, profile.email);
        return {
          id: profile.id,
          email: profile.email || 'Email no disponible',
          profile: {
            ...profile
          },
          created_at: profile.created_at || new Date().toISOString()
        };
      });
      
      console.log("Processed user list:", usersList);
      setUsers(usersList);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(`No se pudieron cargar los usuarios: ${err.message}`);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios. Verifica tus permisos de acceso.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle setting Rodrigo as admin
  const handleSetRodrigoAsAdmin = async () => {
    setIsSettingAdmin(true);
    try {
      const success = await setRodrigoAsAdmin();
      if (success) {
        setAdminSetSuccess(true);
        toast({
          title: "¡Éxito!",
          description: "Rodrigo Peredo ha sido configurado como administrador con todos los permisos.",
        });
        // Refresh the user list to show the changes
        fetchUsers();
      } else {
        toast({
          title: "Error",
          description: "No se pudo configurar a Rodrigo Peredo como administrador.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: `No se pudo configurar el administrador: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSettingAdmin(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
    
    // Try to set Rodrigo as admin on first load
    handleSetRodrigoAsAdmin();
  }, []);
  
  const handleCreateUser = async (formData: any) => {
    try {
      // Check if current user has admin permissions
      if (!currentUser) {
        toast({
          title: "Error",
          description: "Debes estar autenticado para crear usuarios",
          variant: "destructive",
        });
        return;
      }
      
      const result = await createUser({
        email: formData.email,
        password: formData.password || generateRandomPassword(),
        full_name: formData.full_name,
        role: formData.role,
        permissions: formData.permissions
      });
      
      if (result.success) {
        toast({
          title: "Usuario creado",
          description: "El usuario se ha creado exitosamente",
        });
        setIsUserFormOpen(false);
        fetchUsers();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: `No se pudo crear el usuario: ${err.message}`,
        variant: "destructive",
      });
    }
  };
  
  const handleUpdateUser = async (formData: any) => {
    if (!currentEditUser) return;
    
    try {
      const updatedProfile = await updateUserProfile(currentEditUser.id, {
        full_name: formData.full_name,
        role: formData.role,
        permissions: formData.permissions
      });
      
      toast({
        title: "Usuario actualizado",
        description: "El usuario se ha actualizado exitosamente",
      });
      setIsUserFormOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: `No se pudo actualizar el usuario: ${err.message}`,
        variant: "destructive",
      });
    }
  };
  
  const handleSubmitUserForm = (formData: any) => {
    if (currentEditUser) {
      handleUpdateUser(formData);
    } else {
      handleCreateUser(formData);
    }
  };
  
  const handleEditUser = (user: any) => {
    console.log("Editing user:", user);
    setCurrentEditUser(user);
    setIsUserFormOpen(true);
  };
  
  const handleResetPassword = (userId: string) => {
    setUserIdForPasswordChange(userId);
    setIsPasswordChangeOpen(true);
  };
  
  const handleChangePassword = async (userId: string, newPassword: string) => {
    try {
      const result = await changeUserPassword({
        userId,
        newPassword
      });
      
      if (result.success) {
        toast({
          title: "Contraseña actualizada",
          description: "La contraseña se ha cambiado exitosamente",
        });
        setIsPasswordChangeOpen(false);
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: `No se pudo cambiar la contraseña: ${err.message}`,
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      // We can't use admin API, so we'll just delete the profile
      // Note: This won't delete the auth user, just the profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Usuario eliminado",
        description: "El perfil de usuario se ha eliminado exitosamente",
      });
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      toast({
        title: "Error",
        description: `No se pudo eliminar el usuario: ${err.message}`,
        variant: "destructive",
      });
    }
  };
  
  const handleBulkUpload = async (users: BulkUserData[]): Promise<number> => {
    try {
      const successCount = await bulkCreateUsers(users);
      toast({
        title: "Usuarios creados",
        description: `Se han creado ${successCount} usuarios exitosamente`,
      });
      fetchUsers();
      return successCount;
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Error en la carga masiva: ${err.message}`,
        variant: "destructive",
      });
      return 0;
    }
  };
  
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };
  
  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
            <p className="text-muted-foreground">
              Gestión de usuarios del sistema
            </p>
          </div>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center pt-6 pb-6">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="font-medium text-lg mb-2">Error de carga</h3>
            <p className="text-muted-foreground mb-4 text-center">
              {error}
            </p>
            <Button variant="default" onClick={fetchUsers} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestión de usuarios del sistema
          </p>
        </div>
        <div className="flex gap-2">
          {!adminSetSuccess && (
            <Button 
              onClick={handleSetRodrigoAsAdmin}
              variant="outline"
              disabled={isSettingAdmin}
              className="flex items-center gap-2"
            >
              {isSettingAdmin ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></span>
                  <span>Configurando admin...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Configurar Admin</span>
                </>
              )}
            </Button>
          )}
          <Button onClick={() => {
            setCurrentEditUser(null);
            setIsUserFormOpen(true);
          }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Listado</TabsTrigger>
          <TabsTrigger value="bulk">Carga Masiva</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex items-center">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={fetchUsers}
              className="ml-2"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <p className="text-muted-foreground">No se encontraron usuarios</p>
                </div>
              ) : (
                <UsersList 
                  users={filteredUsers}
                  onEdit={handleEditUser}
                  onDelete={(userId) => setUserToDelete(userId)}
                  onResetPassword={handleResetPassword}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <BulkUserUpload onUpload={handleBulkUpload} />
        </TabsContent>
      </Tabs>

      {/* User Form Dialog */}
      <Dialog open={isUserFormOpen} onOpenChange={setIsUserFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{currentEditUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
            <DialogDescription>
              {currentEditUser 
                ? "Actualice la información del usuario" 
                : "Complete el formulario para crear un nuevo usuario"}
            </DialogDescription>
          </DialogHeader>
          
          <UserForm 
            user={currentEditUser || undefined}
            onSubmit={handleSubmitUserForm}
          />
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordChangeOpen} onOpenChange={setIsPasswordChangeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Ingrese la nueva contraseña para el usuario
            </DialogDescription>
          </DialogHeader>
          
          {userIdForPasswordChange && (
            <PasswordChangeForm 
              userId={userIdForPasswordChange}
              onSubmit={handleChangePassword}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el usuario y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;
