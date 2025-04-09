
import { memo } from "react";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/services/userService";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Edit, Trash2, MoreHorizontal, KeyRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UsersListProps {
  users: Array<User & { profile?: UserProfile }>;
  onEdit: (user: User & { profile?: UserProfile }) => void;
  onDelete: (userId: string) => void;
  onResetPassword: (userId: string) => void;
}

const UsersList = memo(({ users, onEdit, onDelete, onResetPassword }: UsersListProps) => {
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>;
      case 'tecnico':
        return <Badge variant="default">Técnico</Badge>;
      default:
        return <Badge variant="secondary">Usuario</Badge>;
    }
  };

  const getInitials = (name?: string): string => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Usuario</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Fecha Creación</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(user => {
          // Try to get email from multiple sources, using fallbacks
          const email = user.email || user.profile?.email || 'Email no disponible';
          const name = user.profile?.full_name || '-';
          
          return (
            <TableRow key={user.id}>
              <TableCell className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getInitials(name)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{name}</span>
              </TableCell>
              <TableCell>{email}</TableCell>
              <TableCell>{getRoleBadge(user.profile?.role)}</TableCell>
              <TableCell>
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Opciones</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(user)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onResetPassword(user.id)}>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Cambiar contraseña
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(user.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
});

UsersList.displayName = "UsersList";

export default UsersList;
