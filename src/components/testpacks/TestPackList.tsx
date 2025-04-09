import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TestPack } from "@/services/testPackService";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchIcon, FilterIcon, X, Edit, Trash2, AlertTriangle } from "lucide-react";
import TestPackTags from "./TestPackTags";
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
import { useToast } from "@/hooks/use-toast";

interface TestPackListProps {
  testPacks: TestPack[] | undefined;
  isLoading: boolean;
  onTagRelease: (tagId: string) => void;
  userRole: string;
  onClearFilters: () => void;
  onEdit: (testPack: TestPack) => void;
  onDelete: (id: string) => Promise<boolean>;
}

const TestPackList = ({ 
  testPacks, 
  isLoading,
  onTagRelease,
  userRole,
  onClearFilters,
  onEdit,
  onDelete
}: TestPackListProps) => {
  const { toast } = useToast();
  const [expandedTestPack, setExpandedTestPack] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    search: "",
    sistema: "",
    subsistema: "",
    estado: ""
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testPackToDelete, setTestPackToDelete] = useState<TestPack | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Get unique list of systems
  const systems = testPacks 
    ? [...new Set(testPacks.map(tp => tp.sistema))]
    : [];

  // Get unique list of subsystems for the selected system
  const subsystems = testPacks 
    ? [...new Set(testPacks
        .filter(tp => !filter.sistema || tp.sistema === filter.sistema)
        .map(tp => tp.subsistema))]
    : [];

  // Apply filters
  const filteredTestPacks = testPacks
    ? testPacks.filter(tp => {
        const matchesSearch = 
          tp.nombre_paquete.toLowerCase().includes(filter.search.toLowerCase()) ||
          (tp.itr_asociado && tp.itr_asociado.toLowerCase().includes(filter.search.toLowerCase())) ||
          (tp.itr_name && tp.itr_name.toLowerCase().includes(filter.search.toLowerCase()));
        
        const matchesSistema = !filter.sistema || filter.sistema === "all" || tp.sistema === filter.sistema;
        const matchesSubsistema = !filter.subsistema || filter.subsistema === "all" || tp.subsistema === filter.subsistema;
        const matchesEstado = !filter.estado || filter.estado === "all" || tp.estado === filter.estado;
        
        return matchesSearch && matchesSistema && matchesSubsistema && matchesEstado;
      })
    : [];

  const handleClearFilters = () => {
    setFilter({
      search: "",
      sistema: "",
      subsistema: "",
      estado: ""
    });
    onClearFilters();
  };

  const toggleExpand = (id: string) => {
    setExpandedTestPack(expandedTestPack === id ? null : id);
  };

  const handleDeleteClick = (testPack: TestPack) => {
    console.log("Opening delete confirmation for test pack:", testPack.nombre_paquete);
    setTestPackToDelete(testPack);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!testPackToDelete) {
      console.error("No test pack selected for deletion");
      return;
    }
    
    try {
      console.log(`Confirming deletion of test pack: ${testPackToDelete.nombre_paquete} (${testPackToDelete.id})`);
      setIsDeleting(true);
      setDeleteError(null);
      
      const success = await onDelete(testPackToDelete.id);
      
      if (success) {
        console.log("Delete operation completed successfully");
        setDeleteDialogOpen(false);
        setTestPackToDelete(null);
        
        toast({
          title: "Test Pack eliminado",
          description: `${testPackToDelete.nombre_paquete} ha sido eliminado correctamente.`,
        });
      } else {
        console.error("Delete operation failed");
        setDeleteError("No se pudo eliminar el Test Pack. Por favor, inténtelo de nuevo.");
      }
    } catch (error) {
      console.error('Error al eliminar el Test Pack:', error);
      setDeleteError("Ha ocurrido un error inesperado. Por favor, inténtelo de nuevo más tarde.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!testPacks || testPacks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No se encontraron Test Packs</CardTitle>
          <CardDescription>No hay Test Packs para mostrar. ¿Desea crear uno nuevo?</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o ITR"
                className="pl-8"
                value={filter.search}
                onChange={e => setFilter({...filter, search: e.target.value})}
              />
            </div>
            
            <Select
              value={filter.sistema}
              onValueChange={value => setFilter({...filter, sistema: value, subsistema: ""})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sistema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los sistemas</SelectItem>
                {systems.map(system => (
                  <SelectItem key={system} value={system}>{system}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={filter.subsistema}
              onValueChange={value => setFilter({...filter, subsistema: value})}
              disabled={!filter.sistema || filter.sistema === "all"}
            >
              <SelectTrigger>
                <SelectValue placeholder={filter.sistema && filter.sistema !== "all" ? "Subsistema" : "Primero seleccione un sistema"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los subsistemas</SelectItem>
                {subsystems.map(subsystem => (
                  <SelectItem key={subsystem} value={subsystem}>{subsystem}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={filter.estado}
              onValueChange={value => setFilter({...filter, estado: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="listo">Listo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {(filter.search || filter.sistema || filter.subsistema || filter.estado) && (
            <div className="flex justify-end mt-4">
              <Button variant="outline" size="sm" onClick={handleClearFilters} className="flex items-center">
                <X className="mr-1 h-4 w-4" />
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div>
        <p className="mb-2 text-muted-foreground text-sm">{filteredTestPacks.length} Test Packs encontrados</p>
        
        <div className="space-y-4">
          {filteredTestPacks.map(testPack => (
            <Card key={testPack.id} className={expandedTestPack === testPack.id ? "ring-2 ring-primary" : ""}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{testPack.nombre_paquete}</CardTitle>
                    <CardDescription>
                      ITR: {testPack.itr_name || testPack.itr_asociado} | Sistema: {testPack.sistema} | Subsistema: {testPack.subsistema}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={testPack.estado === 'listo' ? 'default' : 'outline'}>
                      {testPack.estado === 'listo' ? 'Listo' : 'Pendiente'}
                    </Badge>
                    {userRole === 'admin' && (
                      <div className="flex space-x-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onEdit(testPack)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white"
                          onClick={() => handleDeleteClick(testPack)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">Progreso:</span>
                    <span className="text-sm font-medium">{testPack.progress || 0}%</span>
                  </div>
                  <Progress value={testPack.progress || 0} className="h-2" />
                </div>
                
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => toggleExpand(testPack.id)}
                >
                  {expandedTestPack === testPack.id ? "Ocultar TAGs" : "Ver TAGs"}
                </Button>
                
                {expandedTestPack === testPack.id && (
                  <div className="mt-4">
                    <TestPackTags
                      testPackId={testPack.id}
                      userRole={userRole}
                      onTagRelease={onTagRelease}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el Test Pack "{testPackToDelete?.nombre_paquete}" y todos sus TAGs asociados.
              <br /><br />
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {deleteError && (
            <div className="bg-destructive/10 p-3 rounded-md flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <span className="text-destructive text-sm">{deleteError}</span>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  Eliminando...
                </>
              ) : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TestPackList;
