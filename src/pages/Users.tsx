
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  email: string;
  last_sign_in_at: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    role: string | null;
  }
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    
    try {
      // Fetch all users from Supabase Auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        throw authError;
      }
      
      if (!authUsers) {
        setUsers([]);
        return;
      }
      
      // Get profiles for all users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
        
      if (profilesError) {
        throw profilesError;
      }
      
      // Map profiles to users
      const profilesMap = new Map();
      profiles?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });
      
      // Transform users to include profile info
      const transformedUsers = authUsers.users.map(user => ({
        id: user.id,
        email: user.email || 'No Email',
        last_sign_in_at: user.last_sign_in_at,
        created_at: user.created_at,
        profile: {
          full_name: profilesMap.get(user.id)?.full_name || null,
          role: profilesMap.get(user.id)?.role || 'user'
        }
      }));
      
      setUsers(transformedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
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
      header: "Name",
      accessorKey: "profile.full_name" as const,
      cell: (user: User) => <span>{user.profile?.full_name || 'No Name'}</span>
    },
    {
      header: "Email",
      accessorKey: "email" as const,
    },
    {
      header: "Role",
      accessorKey: "profile.role" as const,
      cell: (user: User) => (
        <Badge variant={user.profile?.role === "admin" ? "default" : "secondary"}>
          {user.profile?.role || 'user'}
        </Badge>
      ),
    },
    {
      header: "Status",
      accessorKey: "status" as const,
      cell: (user: User) => (
        <Badge 
          variant="outline"
          className="border-green-500 text-green-500"
        >
          Active
        </Badge>
      ),
    },
    {
      header: "Last Active",
      accessorKey: "last_sign_in_at" as const,
      cell: (user: User) => <span>{user.last_sign_in_at || 'Never'}</span>
    },
  ];

  const handleEditUser = (user: User) => {
    console.log("Edit user:", user);
    // Will be implemented in a future update
    toast({
      title: "Funcionalidad no implementada",
      description: "La edición de usuarios se implementará próximamente",
    });
  };

  const handleDeleteUser = (user: User) => {
    // Will be implemented in a future update
    toast({
      title: "Funcionalidad no implementada",
      description: "La eliminación de usuarios se implementará próximamente",
    });
  };

  const handleNewUser = () => {
    // Will be implemented in a future update
    toast({
      title: "Funcionalidad no implementada",
      description: "La creación de usuarios se implementará próximamente",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage system users and permissions
          </p>
        </div>
        <Button onClick={handleNewUser}>
          <Plus className="h-4 w-4 mr-2" />
          New User
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
            <p>Puede importar datos utilizando la función de importación en la página de configuración.</p>
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
    </div>
  );
};

export default Users;
