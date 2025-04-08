
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Download, Upload, RefreshCw, FileDown, DownloadCloud } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { 
  getTestPacks, 
  getTestPackWithTags, 
  getActionLogs, 
  updateTag, 
  generateImportTemplate, 
  exportToExcel,
  getTestPacksStats,
  TestPack,
  Tag,
  AccionLog
} from "@/services/testPackService";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import TestPackImportDialog from "@/components/testpacks/TestPackImportDialog";
import TestPackFormDialog from "@/components/testpacks/TestPackFormDialog";
import TestPackStats from "@/components/testpacks/TestPackStats";
import { DatabaseActivityTimeline } from "@/components/DatabaseActivityTimeline";

const TestPacks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSystem, setSelectedSystem] = useState<string>("");
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [selectedTestPack, setSelectedTestPack] = useState<TestPack | null>(null);
  
  // Get user role from the auth context
  const getUserRole = async () => {
    if (!user) return 'user';
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      return data?.role || 'user';
    } catch (error) {
      console.error("Error fetching user role:", error);
      return 'user';
    }
  };
  
  const [userRole, setUserRole] = useState<string>('user');
  
  useEffect(() => {
    getUserRole().then(role => setUserRole(role));
  }, [user]);

  // Fetch test packs
  const { data: testPacks, isLoading: isLoadingTestPacks, refetch: refetchTestPacks } = useQuery({
    queryKey: ['testPacks'],
    queryFn: getTestPacks,
  });

  // Fetch action logs
  const { data: actionLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['actionLogs'],
    queryFn: getActionLogs,
    enabled: selectedTab === 'activity'
  });

  // Fetch statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['testPacksStats'],
    queryFn: getTestPacksStats,
    enabled: selectedTab === 'dashboard'
  });

  // Mutation for updating a tag
  const updateTagMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Tag> }) => updateTag(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testPacks'] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
      toast({
        title: "TAG actualizado",
        description: "El estado del TAG ha sido actualizado correctamente.",
      });
    },
    onError: (error) => {
      console.error("Error updating tag:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el TAG. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    },
  });

  // Create tag release handler
  const handleTagRelease = (tag: Tag) => {
    if (tag.estado !== 'liberado') {
      updateTagMutation.mutate({ 
        id: tag.id, 
        updates: { 
          estado: 'liberado',
          fecha_liberacion: new Date().toISOString()
        } 
      });
    }
  };

  // Filter test packs
  const filteredTestPacks = testPacks?.filter(testPack => {
    let matchesSearch = true;
    let matchesSystem = true;
    let matchesSubsystem = true;
    let matchesStatus = true;
    
    if (searchTerm) {
      matchesSearch = 
        testPack.nombre_paquete.toLowerCase().includes(searchTerm.toLowerCase()) ||
        testPack.itr_asociado.toLowerCase().includes(searchTerm.toLowerCase());
    }
    
    if (selectedSystem) {
      matchesSystem = testPack.sistema === selectedSystem;
    }
    
    if (selectedSubsystem) {
      matchesSubsystem = testPack.subsistema === selectedSubsystem;
    }
    
    if (selectedStatus) {
      matchesStatus = testPack.estado === selectedStatus;
    }
    
    return matchesSearch && matchesSystem && matchesSubsystem && matchesStatus;
  });

  // Get unique systems and subsystems for filters
  const uniqueSystems = Array.from(new Set(testPacks?.map(tp => tp.sistema) || [])).sort();
  const uniqueSubsystems = Array.from(
    new Set(testPacks?.filter(tp => !selectedSystem || tp.sistema === selectedSystem)
    .map(tp => tp.subsistema) || [])
  ).sort();

  // Download import template
  const handleDownloadTemplate = () => {
    try {
      const excelBuffer = generateImportTemplate();
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'TestPacks_Import_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Plantilla descargada",
        description: "La plantilla para importación ha sido descargada correctamente."
      });
    } catch (error) {
      console.error("Error downloading template:", error);
      toast({
        title: "Error",
        description: "No se pudo descargar la plantilla. Por favor, inténtelo de nuevo.",
        variant: "destructive"
      });
    }
  };

  // Export data to Excel
  const handleExportData = async () => {
    try {
      const excelBuffer = await exportToExcel();
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'TestPacks_Export.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Datos exportados",
        description: "Los datos han sido exportados correctamente a Excel."
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Error",
        description: "No se pudieron exportar los datos. Por favor, inténtelo de nuevo.",
        variant: "destructive"
      });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSystem("");
    setSelectedSubsystem("");
    setSelectedStatus("");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Paquetes e ITRs</h1>
        <div className="flex items-center space-x-2">
          {userRole === 'admin' && (
            <>
              <Button onClick={() => setShowFormDialog(true)} variant="outline" size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Nuevo Test Pack
              </Button>
              <Button onClick={() => setShowImportDialog(true)} variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
              <Button onClick={handleDownloadTemplate} variant="outline" size="sm">
                <FileDown className="h-4 w-4 mr-2" />
                Plantilla
              </Button>
            </>
          )}
          <Button onClick={handleExportData} variant="outline" size="sm">
            <DownloadCloud className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => refetchTestPacks()} variant="ghost" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Lista de Test Packs</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Filtra la lista de Test Packs por sistema, subsistema o estado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Input
                    placeholder="Buscar por nombre o ITR..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Select value={selectedSystem} onValueChange={setSelectedSystem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sistema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los sistemas</SelectItem>
                      {uniqueSystems.map((system) => (
                        <SelectItem key={system} value={system}>
                          {system}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={selectedSubsystem} onValueChange={setSelectedSubsystem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Subsistema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los subsistemas</SelectItem>
                      {uniqueSubsystems.map((subsystem) => (
                        <SelectItem key={subsystem} value={subsystem}>
                          {subsystem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los estados</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="listo">Listo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {isLoadingTestPacks ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTestPacks && filteredTestPacks.length > 0 ? (
                filteredTestPacks.map((testPack) => (
                  <Card key={testPack.id} className="overflow-hidden">
                    <div className="p-4 border-b flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{testPack.nombre_paquete}</h3>
                          <Badge variant={testPack.estado === 'listo' ? 'default' : 'outline'}>
                            {testPack.estado === 'listo' ? 'Listo' : 'Pendiente'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Sistema:</span> {testPack.sistema} | 
                          <span className="font-medium"> Subsistema:</span> {testPack.subsistema} | 
                          <span className="font-medium"> ITR:</span> {testPack.itr_asociado}
                        </div>
                      </div>
                      <div className="w-full md:w-1/3 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progreso</span>
                          <span>{testPack.progress || 0}%</span>
                        </div>
                        <Progress value={testPack.progress || 0} className="h-2" />
                      </div>
                    </div>
                    
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button className="w-full rounded-none" variant="ghost">
                          Ver TAGs
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-[90%] sm:max-w-xl">
                        <SheetHeader>
                          <SheetTitle>{testPack.nombre_paquete}</SheetTitle>
                          <SheetDescription>
                            Sistema: {testPack.sistema} | Subsistema: {testPack.subsistema} | ITR: {testPack.itr_asociado}
                          </SheetDescription>
                        </SheetHeader>
                        <TestPackTags testPackId={testPack.id} userRole={userRole} onTagRelease={handleTagRelease} />
                      </SheetContent>
                    </Sheet>
                  </Card>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No se encontraron Test Packs que coincidan con los filtros.</p>
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="dashboard">
          {isLoadingStats ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <TestPackStats stats={stats} />
          )}
        </TabsContent>
        
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Historial de acciones realizadas sobre los TAGs</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLogs ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-4">Acciones sobre TAGs</h3>
                    {actionLogs && actionLogs.length > 0 ? (
                      <div className="space-y-4">
                        {actionLogs.map((log) => (
                          <div key={log.id} className="border rounded-md p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{log.user_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {log.accion} el TAG: <span className="font-medium">{log.tag_name}</span>
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {new Date(log.fecha).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-6">No hay acciones registradas</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-4">Actividad del Sistema</h3>
                    <DatabaseActivityTimeline />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {showImportDialog && (
        <TestPackImportDialog 
          open={showImportDialog} 
          onOpenChange={setShowImportDialog} 
          onSuccess={() => {
            refetchTestPacks();
            setShowImportDialog(false);
          }}
        />
      )}
      
      {showFormDialog && (
        <TestPackFormDialog
          open={showFormDialog}
          onOpenChange={setShowFormDialog}
          testPack={selectedTestPack}
          onSuccess={() => {
            refetchTestPacks();
            setSelectedTestPack(null);
            setShowFormDialog(false);
          }}
        />
      )}
    </div>
  );
};

// Component to display tags for a specific test pack
const TestPackTags = ({ 
  testPackId, 
  userRole, 
  onTagRelease 
}: { 
  testPackId: string; 
  userRole: string; 
  onTagRelease: (tag: Tag) => void; 
}) => {
  const { data: testPack, isLoading } = useQuery({
    queryKey: ['testPack', testPackId],
    queryFn: () => getTestPackWithTags(testPackId),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-6 mt-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!testPack || !testPack.tags || testPack.tags.length === 0) {
    return (
      <div className="text-center py-6 mt-6">
        <p className="text-muted-foreground">No hay TAGs asociados a este Test Pack.</p>
      </div>
    );
  }

  const columns = [
    {
      header: "TAG",
      accessorKey: "tag_name",
    },
    {
      header: "Estado",
      accessorKey: "estado",
      cell: (tag: Tag) => (
        <Badge variant={tag.estado === 'liberado' ? 'default' : 'outline'}>
          {tag.estado === 'liberado' ? 'Liberado' : 'Pendiente'}
        </Badge>
      ),
    },
    {
      header: "Fecha Liberación",
      accessorKey: "fecha_liberacion",
      cell: (tag: Tag) => (
        <span>{tag.fecha_liberacion ? new Date(tag.fecha_liberacion).toLocaleString() : 'Pendiente'}</span>
      ),
    },
    {
      header: "Liberar",
      accessorKey: "actions",
      cell: (tag: Tag) => (
        <Checkbox
          checked={tag.estado === 'liberado'}
          disabled={tag.estado === 'liberado' || (userRole !== 'admin' && userRole !== 'tecnico')}
          onCheckedChange={() => onTagRelease(tag)}
        />
      ),
    },
  ];

  return (
    <div className="mt-6">
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
      
      <DataTable
        columns={columns}
        data={testPack.tags}
      />
    </div>
  );
};

export default TestPacks;
