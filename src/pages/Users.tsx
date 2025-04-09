
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserProfiles, UserProfile } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";
import UserFormModal from "@/components/users/UserFormModal";
import PasswordChangeModal from "@/components/users/PasswordChangeModal";
import UsersList from "@/components/users/UsersList";

const Users = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | undefined>(undefined);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    
    try {
      console.log("Fetching user profiles");
      const profiles = await getUserProfiles();
      console.log("Profiles fetched:", profiles);
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
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const handleEditUser = (user: UserProfile) => {
    console.log("Editing user:", user);
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleChangePassword = (user: UserProfile) => {
    console.log("Change password for user:", user);
    setSelectedUser(user);
    setShowPasswordModal(true);
  };

  const handleDeleteUser = async (user: UserProfile) => {
    // Actualmente no implementamos eliminación verdadera de usuarios por seguridad
    toast({
      title: "Funcionalidad limitada",
      description: "La eliminación de usuarios se implementará en una versión futura",
    });
  };

  const handleNewUser = () => {
    console.log("Creating new user");
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
        <UsersList 
          users={users}
          loading={loading}
          onEdit={handleEditUser}
          onChangePassword={handleChangePassword}
          onDelete={handleDeleteUser}
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
