
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getUsers, deleteUser, createUser, updateUser, changeUserPassword } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";
import UserForm from "@/components/users/UserForm";
import UsersList from "@/components/users/UsersList";
import PasswordChangeForm from "@/components/users/PasswordChangeForm";
import BulkUserUpload from "@/components/users/BulkUserUpload";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (formData) => {
    setIsSubmitting(true);
    try {
      const result = await createUser(formData);
      
      // Fix the user creation part by handling the createUser response format correctly:
      if (result.user) {
        toast({
          title: "Usuario creado",
          description: "El usuario se ha creado exitosamente",
        });
        setIsUserFormOpen(false);
        
        // Optimistically add the new user to the list
        const newUser = {
          id: result.user.id,
          email: formData.email,
          profile: {
            id: result.user.id,
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
        toast({
          title: "Error",
          description: "No se pudo crear el usuario",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el usuario",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (formData) => {
    setIsSubmitting(true);
    try {
      await updateUser(selectedUser.id, formData);
      toast({
        title: "Usuario actualizado",
        description: "El usuario se ha actualizado exitosamente",
      });
      setIsUserFormOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el usuario",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
      toast({
        title: "Usuario eliminado",
        description: "El usuario se ha eliminado exitosamente",
      });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    }
  };

  const handleOpenUserForm = (user = null) => {
    setSelectedUser(user);
    setIsUserFormOpen(true);
  };

  const handleOpenPasswordModal = (user) => {
    setSelectedUser(user);
    setIsPasswordModalOpen(true);
  };

  const handleFormSubmit = (values) => {
    if (selectedUser) {
      handleUpdateUser(values);
    } else {
      handleCreateUser(values);
    }
  };

  const handleChangePassword = async (userId, password) => {
    setIsSubmitting(true);
    try {
      await changeUserPassword(userId, password);
      toast({
        title: "Contraseña actualizada",
        description: "La contraseña se ha actualizado exitosamente",
      });
      setIsPasswordModalOpen(false);
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar la contraseña",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkUpload = async (users) => {
    try {
      // Implement bulk user upload
      let successCount = 0;
      
      for (const userData of users) {
        try {
          await createUser(userData);
          successCount++;
        } catch (error) {
          console.error(`Error creating user ${userData.email}:`, error);
        }
      }
      
      fetchUsers();
      return successCount;
    } catch (error) {
      console.error("Error in bulk upload:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios y sus permisos
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => handleOpenUserForm()}
            className="whitespace-nowrap"
          >
            Agregar Usuario
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsBulkUploadOpen(true)}
            className="whitespace-nowrap"
          >
            Importar Usuarios
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersList
            users={users}
            isLoading={loading}
            onEdit={handleOpenUserForm}
            onDelete={handleDeleteUser}
            onResetPassword={handleOpenPasswordModal}
          />
        </CardContent>
      </Card>

      <Dialog open={isUserFormOpen} onOpenChange={(open) => !isSubmitting && setIsUserFormOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? "Editar Usuario" : "Crear Usuario"}
            </DialogTitle>
          </DialogHeader>
          <UserForm
            user={selectedUser}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
          </DialogHeader>
          <PasswordChangeForm 
            userId={selectedUser?.id} 
            onSubmit={handleChangePassword}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Importar Usuarios</DialogTitle>
          </DialogHeader>
          <BulkUserUpload 
            onUpload={handleBulkUpload} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
