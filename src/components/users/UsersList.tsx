
import { memo, useMemo } from "react";
import { User } from "@supabase/supabase-js";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2, MoreHorizontal, KeyRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfile {
  id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  role?: string;
  permissions?: string[];
  created_at: string;
  updated_at: string;
}

interface UsersListProps {
  users: Array<User & { profile?: UserProfile }>;
  onEdit: (user: User & { profile?: UserProfile }) => void;
  onDelete: (userId: string) => void;
  onResetPassword: (userId: string) => void;
  isLoading?: boolean;
}

const UsersList = memo(({ users, onEdit, onDelete, onResetPassword, isLoading = false }: UsersListProps) => {
  // Memoize these functions to prevent unnecessary re-renders
  const getRoleBadge = useMemo(() => (role?: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>;
      case 'tecnico':
        return <Badge variant="default">Técnico</Badge>;
      default:
        return <Badge variant="secondary">Usuario</Badge>;
    }
  }, []);

  const getInitials = useMemo(() => (name?: string): string => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }, []);

  // Create a loading skeleton for the table
  if (isLoading) {
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
          {Array(5).fill(0).map((_, index) => (
            <TableRow key={`skeleton-${index}`}>
              <TableCell className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell><Skeleton className="h-4 w-48" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-8 w-8 rounded-sm ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  // If no users and not loading, show empty state
  if (users.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No hay usuarios disponibles</p>
      </div>
    );
  }

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
          // Get email from profile first, then from user object as fallback
          const email = user.profile?.email || user.email || 'Email no disponible';
          const name = user.profile?.full_name || '-';
          const avatarUrl = user.profile?.avatar_url;
          
          return (
            <TableRow key={user.id}>
              <TableCell className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
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
                    <DropdownMenuItem 
                      onClick={() => {
                        onEdit(user);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        onResetPassword(user.id);
                      }}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      Cambiar contraseña
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => {
                        onDelete(user.id);
                      }}
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
