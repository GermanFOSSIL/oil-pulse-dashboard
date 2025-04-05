
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActive: string;
}

const mockUsers: User[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@oilpulse.com",
    role: "Admin",
    status: "Active",
    lastActive: "2025-04-05",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@oilpulse.com",
    role: "Manager",
    status: "Active",
    lastActive: "2025-04-04",
  },
  {
    id: 3,
    name: "Michael Brown",
    email: "michael.brown@oilpulse.com",
    role: "Inspector",
    status: "Active",
    lastActive: "2025-04-03",
  },
  {
    id: 4,
    name: "Sarah Johnson",
    email: "sarah.johnson@oilpulse.com",
    role: "Engineer",
    status: "Inactive",
    lastActive: "2025-03-15",
  },
  {
    id: 5,
    name: "David Wilson",
    email: "david.wilson@oilpulse.com",
    role: "Inspector",
    status: "Active",
    lastActive: "2025-04-05",
  },
  {
    id: 6,
    name: "Anna Lee",
    email: "anna.lee@oilpulse.com",
    role: "Manager",
    status: "Active",
    lastActive: "2025-04-02",
  },
];

const Users = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);

  const columns = [
    {
      header: "Name",
      accessorKey: "name" as const,
    },
    {
      header: "Email",
      accessorKey: "email" as const,
    },
    {
      header: "Role",
      accessorKey: "role" as const,
      cell: (user: User) => (
        <Badge variant={user.role === "Admin" ? "default" : "secondary"}>
          {user.role}
        </Badge>
      ),
    },
    {
      header: "Status",
      accessorKey: "status" as const,
      cell: (user: User) => (
        <Badge 
          variant={user.status === "Active" ? "outline" : "secondary"}
          className={user.status === "Active" ? "border-green-500 text-green-500" : ""}
        >
          {user.status}
        </Badge>
      ),
    },
    {
      header: "Last Active",
      accessorKey: "lastActive" as const,
    },
  ];

  const handleEditUser = (user: User) => {
    console.log("Edit user:", user);
  };

  const handleDeleteUser = (user: User) => {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      setUsers(users.filter((u) => u.id !== user.id));
    }
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
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New User
        </Button>
      </div>

      <DataTable
        data={users}
        columns={columns}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
      />
    </div>
  );
};

export default Users;
