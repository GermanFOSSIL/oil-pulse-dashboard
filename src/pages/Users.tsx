
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getUserProfiles,
  deleteUser,
  changeUserPassword,
  AVAILABLE_PERMISSIONS
} from "@/services/userService";
import { UserProfile, PasswordChangeData } from "@/services/types";
import UsersList from "@/components/users/UsersList";
import UserForm from "@/components/users/UserForm";
import BulkUserUpload from "@/components/users/BulkUserUpload";
import PasswordChangeForm from "@/components/users/PasswordChangeForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Users = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUserProfiles();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsUserFormOpen(true);
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setIsUserFormOpen(true);
  };

  const handleChangePassword = (userId: string) => {
    setSelectedUserId(userId);
    setIsPasswordFormOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await deleteUser(userId);
      await fetchUsers();
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = async (data: PasswordChangeData) => {
    try {
      await changeUserPassword(data);
      setIsPasswordFormOpen(false);
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      });
    }
  };

  const handleUserSaved = () => {
    fetchUsers();
    setIsUserFormOpen(false);
  };

  const handleBulkUploadComplete = (results: { created: number; errors: any[] }) => {
    fetchUsers();
    setIsBulkUploadOpen(false);
    
    toast({
      title: "Bulk Upload Completed",
      description: `Created ${results.created} users. Encountered ${results.errors.length} errors.`,
      variant: results.errors.length > 0 ? "destructive" : "default",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddUser} className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsBulkUploadOpen(true)}
            className="flex items-center gap-1"
          >
            <Upload className="h-4 w-4" />
            Bulk Upload
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="admin">Administrators</TabsTrigger>
          <TabsTrigger value="user">Regular Users</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <UsersList
            users={users}
            loading={loading}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onChangePassword={handleChangePassword}
          />
        </TabsContent>
        
        <TabsContent value="admin" className="mt-4">
          <UsersList
            users={users.filter(user => user.role === 'admin')}
            loading={loading}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onChangePassword={handleChangePassword}
          />
        </TabsContent>
        
        <TabsContent value="user" className="mt-4">
          <UsersList
            users={users.filter(user => user.role === 'user')}
            loading={loading}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onChangePassword={handleChangePassword}
          />
        </TabsContent>
      </Tabs>

      {/* User Form Modal */}
      <Dialog open={isUserFormOpen} onOpenChange={setIsUserFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? "Edit User" : "Add New User"}
            </DialogTitle>
          </DialogHeader>
          <UserForm
            user={selectedUser}
            availablePermissions={AVAILABLE_PERMISSIONS}
            onUserSaved={handleUserSaved}
            onCancel={() => setIsUserFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Password Change Modal */}
      <Dialog open={isPasswordFormOpen} onOpenChange={setIsPasswordFormOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <PasswordChangeForm
            userId={selectedUserId || ""}
            onPasswordChange={handlePasswordChange}
            onCancel={() => setIsPasswordFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Modal */}
      <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Bulk Upload Users</DialogTitle>
          </DialogHeader>
          <BulkUserUpload
            onUploadComplete={handleBulkUploadComplete}
            onCancel={() => setIsBulkUploadOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
