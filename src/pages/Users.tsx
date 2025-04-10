
import { useState, useEffect, useCallback, useMemo } from "react";
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
  const { user: currentUser } = useAuth(); 
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
  
  // Track loading states for operations
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Setup realtime subscription for profile changes
  useEffect(() => {
    const profiles = supabase
      .channel('public:profiles')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles' 
      }, (payload) => {
        // Handle profile changes without refetching all users
        if (payload.eventType === 'UPDATE') {
          setUsers(prevUsers => prevUsers.map(user => 
            user.id === payload.new.id 
              ? { ...user, profile: { ...user.profile, ...payload.new } } 
              : user
          ));
        } else if (payload.eventType === 'INSERT') {
          // Handle new user - append to list if not already present
          fetchUsers();
        } else if (payload.eventType === 'DELETE') {
          setUsers(prevUsers => prevUsers.filter(user => user.id !== payload.old.id));
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(profiles);
    };
  }, []);
  
  // Fetch all user profiles (not auth users)
  const fetchUsers = useCallback(async () => {
    // Don't fetch if we're already loading
    if (loading && users.length > 0) return;
    
    setLoading(true);
    setError(null);
    try {
      // Get all profiles from the public.profiles table with enhanced data
      const profiles = await getUserProfiles();
      
      // Convert profiles to the expected format with explicit email handling
      const usersList = profiles.map(profile => {
        return {
          id: profile.id,
          email: profile.email || 'Email no disponible',
          profile: {
            ...profile
          },
          created_at: profile.created_at || new Date().toISOString()
        };
      });
      
      setUsers(usersList);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(`No se pudieron cargar los usuarios: ${err.message}`);
      
      // Only show toast if there are no users loaded yet
      if (users.length === 0) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios. Verifica tus permisos de acceso.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast, users.length, loading]);
  
  // Handle setting Rodrigo as admin
  const handleSetRodrigoAsAdmin = useCallback(async () => {
    // Prevent multiple clicks
    if (isSettingAdmin) return;
    
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
          title: "Aviso",
          description: "No se pudo configurar a Rodrigo Peredo como administrador o ya está configurado.",
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
  }, [fetchUsers, toast, isSettingAdmin]);
  
  useEffect(() => {
    fetchUsers();
    
    // Only try to set Rodrigo as admin on first load if not already done
    if (!adminSetSuccess) {
      handleSetRodrigoAsAdmin();
    }
  }, [fetchUsers, handleSetRodrigoAsAdmin, adminSetSuccess]);
  
  const handleCreateUser = useCallback(async (formData: any) => {
    // Prevent duplicate submissions
    if (isSubmitting) return;
    
    setIsSubmitting(true);
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
        
        // Optimistically add the new user to the list
        if (result.userId) {
          const newUser = {
            id: result.userId,
            email: formData.email,
            profile: {
              id: result.userId,
              full_name: formData.full_name,
              role: formData.role,
              permissions: formData.permissions,
              email: formData.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            created_at: new Date().toISOString()
          };
          
          setUsers(prev => [...prev, newUser]);
        } else {
          // Fallback to fetching if we couldn't create a proper optimistic update
          fetchUsers();
        }
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
    } finally {
      setIsSubmitting(false);
    }
  }, [currentUser, fetchUsers, toast, isSubmitting]);
  
  const handleUpdateUser = useCallback(async (formData: any) => {
    if (!currentEditUser || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await updateUserProfile(currentEditUser.id, {
        full_name: formData.full_name,
        role: formData.role,
        permissions: formData.permissions,
        email: formData.email // Store email in profile
      });
      
      // Optimistically update the user in the list
      setUsers(prev => prev.map(user => {
        if (user.id === currentEditUser.id) {
          return {
            ...user,
            email: formData.email,
            profile: {
              ...user.profile,
              full_name: formData.full_name,
              role: formData.role,
              permissions: formData.permissions,
              email: formData.email,
              updated_at: new Date().toISOString()
            }
          };
        }
        return user;
      }));
      
      toast({
        title: "Usuario actualizado",
        description: "El usuario se ha actualizado exitosamente",
      });
      setIsUserFormOpen(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: `No se pudo actualizar el usuario: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [currentEditUser, toast, isSubmitting]);
  
  const handleSubmitUserForm = useCallback((formData: any) => {
    if (currentEditUser) {
      handleUpdateUser(formData);
    } else {
      handleCreateUser(formData);
    }
  }, [currentEditUser, handleCreateUser, handleUpdateUser]);
  
  const handleEditUser = useCallback((user: any) => {
    setCurrentEditUser(user);
    setIsUserFormOpen(true);
  }, []);
  
  const handleResetPassword = useCallback((userId: string) => {
    setUserIdForPasswordChange(userId);
    setIsPasswordChangeOpen(true);
  }, []);
  
  const handleChangePassword = useCallback(async (userId: string, newPassword: string) => {
    if (isChangingPassword) return;
    
    setIsChangingPassword(true);
    try {
      const result = await changeUserPassword({
        userId,
        newPassword
      });
      
      toast({
        title: result.success ? "Operación Exitosa" : "Aviso",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      
      if (result.success) {
        setIsPasswordChangeOpen(false);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: `No se pudo procesar la solicitud: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  }, [toast, isChangingPassword]);
  
  const handleDeleteUser = useCallback(async () => {
    if (!userToDelete || isDeleting) return;
    
    setIsDeleting(true);
    try {
      // Delete the profile from database
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete);
      
      if (error) {
        throw error;
      }
      
      // Optimistically remove user from list
      setUsers(prev => prev.filter(user => user.id !== userToDelete));
      
      toast({
        title: "Usuario eliminado",
        description: "El perfil de usuario se ha eliminado exitosamente",
      });
      setUserToDelete(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: `No se pudo eliminar el usuario: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [toast, userToDelete, isDeleting]);
  
  const handleBulkUpload = useCallback(async (users: BulkUserData[]): Promise<number> => {
    try {
      const successCount = await bulkCreateUsers(users);
      toast({
        title: "Usuarios creados",
        description: `Se han creado ${successCount} usuarios exitosamente`,
      });
      
      // Fetch updated users list
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
  }, [fetchUsers, toast]);
  
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };
  
  // Filter users based on search term - using memoization for performance
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    
    const lowerSearch = searchTerm.toLowerCase();
    return users.filter(user => 
      user.email?.toLowerCase().includes(lowerSearch) || 
      user.profile?.full_name?.toLowerCase().includes(lowerSearch)
    );
  }, [users, searchTerm]);
  
  if (error && users.length === 0) {
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
            <Button 
              variant="default" 
              onClick={fetchUsers} 
              className="gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin h-4 w-4 rounded-full border-2 border-current border-t-transparent"></span>
                  Cargando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Reintentar
                </>
              )}
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
          <Button 
            onClick={() => {
              setCurrentEditUser(null);
              setIsUserFormOpen(true);
            }}
            disabled={loading}
          >
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
              onClick={() => fetchUsers()}
              className="ml-2"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <UsersList 
                users={filteredUsers}
                onEdit={handleEditUser}
                onDelete={(userId) => setUserToDelete(userId)}
                onResetPassword={handleResetPassword}
                isLoading={loading && users.length === 0}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <BulkUserUpload onUpload={handleBulkUpload} />
        </TabsContent>
      </Tabs>

      {/* User Form Dialog */}
      <Dialog 
        open={isUserFormOpen} 
        onOpenChange={(open) => {
          // Only allow closing dialog if not submitting
          if (!isSubmitting) setIsUserFormOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
          // Prevent closing when submitting
          if (isSubmitting) e.preventDefault();
        }}>
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
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog 
        open={isPasswordChangeOpen} 
        onOpenChange={(open) => {
          // Only allow closing if not processing
          if (!isChangingPassword) setIsPasswordChangeOpen(open);
        }}
      >
        <DialogContent 
          className="sm:max-w-md"
          onInteractOutside={(e) => {
            // Prevent closing when processing
            if (isChangingPassword) e.preventDefault();
          }}
        >
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
              isSubmitting={isChangingPassword}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!userToDelete} 
        onOpenChange={(open) => {
          // Only allow closing if not deleting
          if (!isDeleting && !open) setUserToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el usuario y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;
