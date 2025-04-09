
import React from "react";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Key } from "lucide-react";
import { UserProfile } from "@/services/userService";

interface UsersListProps {
  users: UserProfile[];
  loading: boolean;
  onEdit: (user: UserProfile) => void;
  onChangePassword: (user: UserProfile) => void;
  onDelete: (user: UserProfile) => void;
}

const UsersList = ({ users, loading, onEdit, onChangePassword, onDelete }: UsersListProps) => {
  const columns = [
    {
      header: "Nombre",
      accessorKey: "full_name" as keyof UserProfile,
      cell: (info: any) => <span>{info.row.original.full_name || 'Sin nombre'}</span>
    },
    {
      header: "ID",
      accessorKey: "id" as keyof UserProfile,
      cell: (info: any) => <span className="text-xs text-muted-foreground">{info.row.original.id.substring(0, 8)}...</span>
    },
    {
      header: "Rol",
      accessorKey: "role" as keyof UserProfile,
      cell: (info: any) => {
        const role = info.row.original.role;
        return (
          <Badge variant={role === "admin" ? "default" : role === "tecnico" ? "outline" : "secondary"}>
            {role === "admin" ? "Administrador" : 
             role === "tecnico" ? "Técnico" : "Usuario"}
          </Badge>
        );
      }
    },
    {
      header: "Permisos",
      accessorKey: "permissions" as keyof UserProfile,
      cell: (info: any) => {
        const user = info.row.original;
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
      cell: (info: any) => {
        const date = new Date(info.row.original.created_at || '');
        return <span>{date.toLocaleDateString('es-ES')}</span>;
      }
    },
    {
      header: "Acciones",
      accessorKey: "id" as keyof UserProfile,
      cell: (info: any) => (
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onChangePassword(info.row.original)}
            title="Cambiar contraseña"
          >
            <Key className="h-4 w-4" />
          </Button>
        </div>
      ),
    }
  ];

  return (
    <DataTable
      data={users}
      columns={columns}
      onEdit={onEdit}
      onDelete={onDelete}
      loading={loading}
    />
  );
};

export default UsersList;
