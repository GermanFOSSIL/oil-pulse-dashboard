
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTestPacks } from "@/hooks/useTestPacks";
import { Tag } from "@/services/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Check, Edit, MoreHorizontal, Trash2, X } from "lucide-react";
import TagFormModal from "./TagFormModal";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TagListProps {
  tags: Tag[];
  testPackId: string;
  onRefresh: () => void;
}

const TagList = ({ tags, testPackId, onRefresh }: TagListProps) => {
  const { user } = useAuth();
  const { releaseTag, changeTagStatus, removeTag } = useTestPacks();
  
  const [tagToEdit, setTagToEdit] = useState<Tag | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  
  const handleEdit = (tag: Tag) => {
    setTagToEdit(tag);
    setIsFormModalOpen(true);
  };
  
  const handleDelete = async () => {
    if (tagToDelete) {
      await removeTag(tagToDelete);
      setTagToDelete(null);
      onRefresh();
    }
  };
  
  const handleReleaseTag = async (tagId: string) => {
    await releaseTag(tagId);
    onRefresh();
  };
  
  const handleChangeStatus = async (tagId: string, newStatus: 'pendiente' | 'liberado') => {
    await changeTagStatus(tagId, newStatus);
    onRefresh();
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'liberado':
        return <Badge variant="default" className="bg-green-600">Liberado</Badge>;
      case 'pendiente':
        return <Badge variant="outline">Pendiente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No disponible";
    try {
      return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: es });
    } catch (e) {
      return "Fecha inválida";
    }
  };

  return (
    <>
      {tags.length === 0 ? (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground">No hay TAGs en este Test Pack.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Utilice el botón "Nuevo TAG" para añadir TAGs a este Test Pack.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Liberación</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium">
                    {tag.tag_name}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(tag.estado)}
                  </TableCell>
                  <TableCell>
                    {formatDate(tag.fecha_liberacion)}
                  </TableCell>
                  <TableCell>
                    {formatDate(tag.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {tag.estado === 'pendiente' && (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 text-green-600"
                          title="Marcar como liberado"
                          onClick={() => handleReleaseTag(tag.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Acciones</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(tag)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {tag.estado === 'pendiente' ? (
                            <DropdownMenuItem onClick={() => handleChangeStatus(tag.id, 'liberado')}>
                              <Check className="h-4 w-4 mr-2 text-green-600" />
                              Marcar como liberado
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleChangeStatus(tag.id, 'pendiente')}>
                              <X className="h-4 w-4 mr-2 text-amber-600" />
                              Marcar como pendiente
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => setTagToDelete(tag.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {tagToEdit && (
        <TagFormModal 
          isOpen={isFormModalOpen} 
          onClose={() => {
            setIsFormModalOpen(false);
            setTagToEdit(null);
          }} 
          onSuccess={() => {
            setIsFormModalOpen(false);
            setTagToEdit(null);
            onRefresh();
          }}
          testPackId={testPackId}
          tag={tagToEdit}
        />
      )}
      
      <AlertDialog open={!!tagToDelete} onOpenChange={(open) => !open && setTagToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el TAG. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TagList;
