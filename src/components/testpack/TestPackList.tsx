
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTestPacks } from "@/hooks/useTestPacks";
import { TestPack } from "@/services/types";
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
import { Edit, MoreHorizontal, RefreshCw, Tags, Trash2 } from "lucide-react";
import TestPackFormModal from "./TestPackFormModal";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface TestPackListProps {
  testPacks: TestPack[];
  loading: boolean;
  onRefresh: () => void;
}

const TestPackList = ({ testPacks, loading, onRefresh }: TestPackListProps) => {
  const navigate = useNavigate();
  const { removeTestPack } = useTestPacks();
  const { toast } = useToast();
  
  const [testPackToEdit, setTestPackToEdit] = useState<TestPack | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [testPackToDelete, setTestPackToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleEdit = (testPack: TestPack, e: React.MouseEvent) => {
    e.stopPropagation();
    setTestPackToEdit(testPack);
    setIsFormModalOpen(true);
  };
  
  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (!testPackToDelete) return;
    
    setIsDeleting(true);
    try {
      console.log("Iniciando eliminación del Test Pack:", testPackToDelete);
      const success = await removeTestPack(testPackToDelete);
      console.log("Resultado de la eliminación:", success);
      
      if (success) {
        toast({
          title: "Éxito",
          description: "Test Pack eliminado correctamente",
        });
        setTestPackToDelete(null);
        onRefresh();
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el Test Pack",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error en handleDelete:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el Test Pack",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleViewDetails = (testPackId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      navigate(`/test-packs/${testPackId}`);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'listo':
        return <Badge variant="default" className="bg-green-600">Listo</Badge>;
      case 'pendiente':
        return <Badge variant="outline">Pendiente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: es });
    } catch (e) {
      return "Fecha inválida";
    }
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            
            {testPacks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Tags className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">No hay Test Packs</h3>
                <p className="text-muted-foreground mb-4">No se encontraron Test Packs en la base de datos.</p>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={onRefresh} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refrescar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>ITR Asociado</TableHead>
                      <TableHead>Sistema</TableHead>
                      <TableHead>Subsistema</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Creación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testPacks.map((testPack) => (
                      <TableRow key={testPack.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell 
                          className="font-medium"
                          onClick={(e) => handleViewDetails(testPack.id, e)}
                        >
                          {testPack.nombre_paquete}
                        </TableCell>
                        <TableCell onClick={(e) => handleViewDetails(testPack.id, e)}>
                          {testPack.itr_asociado}
                        </TableCell>
                        <TableCell onClick={(e) => handleViewDetails(testPack.id, e)}>
                          {testPack.sistema}
                        </TableCell>
                        <TableCell onClick={(e) => handleViewDetails(testPack.id, e)}>
                          {testPack.subsistema}
                        </TableCell>
                        <TableCell onClick={(e) => handleViewDetails(testPack.id, e)}>
                          {getStatusBadge(testPack.estado)}
                        </TableCell>
                        <TableCell onClick={(e) => handleViewDetails(testPack.id, e)}>
                          {formatDate(testPack.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Acciones</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(testPack.id, e);
                              }}>
                                <Tags className="h-4 w-4 mr-2" />
                                Ver TAGs
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(testPack, e);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTestPackToDelete(testPack.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {testPackToEdit && (
        <TestPackFormModal 
          isOpen={isFormModalOpen} 
          onClose={() => {
            setIsFormModalOpen(false);
            setTestPackToEdit(null);
          }} 
          onSuccess={() => {
            setIsFormModalOpen(false);
            setTestPackToEdit(null);
            onRefresh();
          }}
          testPack={testPackToEdit}
        />
      )}
      
      <AlertDialog 
        open={!!testPackToDelete} 
        onOpenChange={(open) => {
          if (!open && !isDeleting) setTestPackToDelete(null);
        }}
      >
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el Test Pack y todos sus TAGs asociados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TestPackList;
