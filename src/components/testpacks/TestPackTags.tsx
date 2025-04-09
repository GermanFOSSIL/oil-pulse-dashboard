import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTestPackWithTags, updateTag, Tag, TestPack, createTag, deleteTag } from "@/services/testPackService";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag as TagIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

interface TestPackTagsProps {
  testPackId: string;
  userRole: string;
  onTagRelease: (tagId: string) => void;
}

const TestPackTags = ({ 
  testPackId, 
  userRole, 
  onTagRelease 
}: TestPackTagsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTagName, setNewTagName] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  const { data: testPack, isLoading, refetch } = useQuery({
    queryKey: ['testPack', testPackId],
    queryFn: () => getTestPackWithTags(testPackId),
  });

  const createTagMutation = useMutation({
    mutationFn: (tagName: string) => {
      return createTag({
        tag_name: tagName,
        test_pack_id: testPackId,
        estado: 'pendiente',
        fecha_liberacion: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testPack', testPackId] });
      setNewTagName("");
      setIsAddingTag(false);
      toast({
        title: "TAG creado",
        description: "El TAG ha sido creado exitosamente."
      });
      refetch();
    },
    onError: (error) => {
      console.error("Error al crear TAG:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el TAG. Por favor, inténtelo de nuevo.",
        variant: "destructive"
      });
    }
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ tagId, newStatus }: { tagId: string; newStatus: 'pendiente' | 'liberado' }) => {
      const updates: Partial<Tag> = {
        estado: newStatus,
        fecha_liberacion: newStatus === 'liberado' ? new Date().toISOString() : null
      };
      return updateTag(tagId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testPack', testPackId] });
      toast({
        title: "TAG actualizado",
        description: "El estado del TAG ha sido actualizado exitosamente."
      });
      refetch();
    },
    onError: (error) => {
      console.error("Error al actualizar TAG:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del TAG. Por favor, inténtelo de nuevo.",
        variant: "destructive"
      });
    }
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: string) => {
      console.log("Deleting tag ID:", tagId);
      return deleteTag(tagId);
    },
    onSuccess: () => {
      console.log("Tag deleted successfully, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ['testPack', testPackId] });
      queryClient.invalidateQueries({ queryKey: ['testPacks'] });
      
      toast({
        title: "TAG eliminado",
        description: "El TAG ha sido eliminado exitosamente."
      });
      
      refetch();
    },
    onError: (error) => {
      console.error("Error al eliminar TAG:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el TAG. Por favor, inténtelo de nuevo.",
        variant: "destructive"
      });
    }
  });

  const handleAddTag = () => {
    if (!newTagName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del TAG no puede estar vacío.",
        variant: "destructive"
      });
      return;
    }

    createTagMutation.mutate(newTagName);
  };

  const handleTagStatusToggle = (tag: Tag) => {
    const newStatus = tag.estado === 'liberado' ? 'pendiente' : 'liberado';
    updateTagMutation.mutate({ tagId: tag.id, newStatus });
  };

  const handleDeleteClick = (tagId: string) => {
    console.log("Preparing to delete tag ID:", tagId);
    setTagToDelete(tagId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (tagToDelete) {
      console.log("Confirming deletion of tag ID:", tagToDelete);
      deleteTagMutation.mutate(tagToDelete);
      setDeleteDialogOpen(false);
      setTagToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6 mt-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!testPack || !testPack.tags || testPack.tags.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">TAGs del Test Pack</CardTitle>
          {(userRole === 'admin' || userRole === 'tecnico') && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAddingTag(true)}
              className="flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              Agregar TAG
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isAddingTag ? (
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Nombre del TAG"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddTag} disabled={createTagMutation.isPending}>
                {createTagMutation.isPending ? "Creando..." : "Guardar"}
              </Button>
              <Button variant="outline" onClick={() => setIsAddingTag(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No hay TAGs asociados a este Test Pack.</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">TAGs del Test Pack</CardTitle>
        {(userRole === 'admin' || userRole === 'tecnico') && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsAddingTag(!isAddingTag)}
            className="flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            Agregar TAG
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isAddingTag && (
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Nombre del TAG"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddTag} disabled={createTagMutation.isPending}>
              {createTagMutation.isPending ? "Creando..." : "Guardar"}
            </Button>
            <Button variant="outline" onClick={() => setIsAddingTag(false)}>
              Cancelar
            </Button>
          </div>
        )}
        
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-medium">Progreso: </span>
              <span className="text-sm">{testPack.progress || 0}%</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {testPack.tags.filter(tag => tag.estado === 'liberado').length} de {testPack.tags.length} TAGs liberados
            </div>
          </div>
          <Progress value={testPack.progress || 0} className="h-2 mt-1" />
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>TAG</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Liberación</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testPack.tags.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{tag.tag_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={tag.estado === 'liberado' ? 'default' : 'outline'}>
                    {tag.estado === 'liberado' ? 'Liberado' : 'Pendiente'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span>{tag.fecha_liberacion ? new Date(tag.fecha_liberacion).toLocaleString() : 'Pendiente'}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {(userRole === 'admin' || userRole === 'tecnico') ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleTagStatusToggle(tag)}
                          disabled={updateTagMutation.isPending}
                        >
                          {tag.estado === 'liberado' ? 'Marcar Pendiente' : 'Marcar Liberado'}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white"
                          onClick={() => handleDeleteClick(tag.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Checkbox
                        checked={tag.estado === 'liberado'}
                        disabled={true}
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el TAG seleccionado.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default TestPackTags;
