
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUp, Database, Upload, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table";
import { getProjectsHierarchy } from "@/services/systemService";
import { bulkCreateTasks } from "@/services/taskService";

type ProjectHierarchy = {
  id: string;
  name: string;
  systems: {
    id: string;
    name: string;
    subsystems: {
      id: string;
      name: string;
    }[];
  }[];
};

type SelectedSubsystem = {
  id: string;
  name: string;
  systemName: string;
  projectName: string;
  selected: boolean;
};

type ITRData = {
  name: string;
  description: string | null;
  status: string;
};

const BatchITRUpload = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("manual");
  const [loading, setLoading] = useState(false);
  const [projectsData, setProjectsData] = useState<ProjectHierarchy[]>([]);
  const [subsystems, setSubsystems] = useState<SelectedSubsystem[]>([]);
  const [filteredSubsystems, setFilteredSubsystems] = useState<SelectedSubsystem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  
  // ITR data for manual entry
  const [itrName, setItrName] = useState("");
  const [itrDescription, setItrDescription] = useState("");
  const [itrStatus, setItrStatus] = useState("pending");
  
  // File upload
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  
  // Fetch projects hierarchy
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getProjectsHierarchy();
        setProjectsData(data);
        
        // Extract all subsystems and flatten into a single array
        const allSubsystems: SelectedSubsystem[] = [];
        data.forEach(project => {
          project.systems.forEach(system => {
            system.subsystems.forEach(subsystem => {
              allSubsystems.push({
                id: subsystem.id,
                name: subsystem.name,
                systemName: system.name,
                projectName: project.name,
                selected: false
              });
            });
          });
        });
        
        setSubsystems(allSubsystems);
        setFilteredSubsystems(allSubsystems);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los proyectos y subsistemas",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  // Filter subsystems when search or selections change
  useEffect(() => {
    let filtered = [...subsystems];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.systemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.projectName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by project
    if (selectedProjectId) {
      const project = projectsData.find(p => p.id === selectedProjectId);
      if (project) {
        const systemIds = project.systems.map(s => s.id);
        filtered = filtered.filter(s => {
          const systemInProject = projectsData
            .find(p => p.id === selectedProjectId)
            ?.systems.some(sys => {
              return sys.subsystems.some(sub => sub.id === s.id);
            });
          return systemInProject;
        });
      }
    }
    
    // Filter by system
    if (selectedSystemId) {
      filtered = filtered.filter(s => {
        const matchingSystem = projectsData
          .flatMap(p => p.systems)
          .find(sys => sys.id === selectedSystemId);
          
        return matchingSystem?.subsystems.some(sub => sub.id === s.id);
      });
    }
    
    setFilteredSubsystems(filtered);
  }, [searchTerm, subsystems, selectedProjectId, selectedSystemId, projectsData]);
  
  // Toggle selection of all visible subsystems
  useEffect(() => {
    if (selectAll) {
      const updatedSubsystems = subsystems.map(s => {
        if (filteredSubsystems.some(fs => fs.id === s.id)) {
          return { ...s, selected: true };
        }
        return s;
      });
      setSubsystems(updatedSubsystems);
    } else {
      const updatedSubsystems = subsystems.map(s => {
        if (filteredSubsystems.some(fs => fs.id === s.id)) {
          return { ...s, selected: false };
        }
        return s;
      });
      setSubsystems(updatedSubsystems);
    }
  }, [selectAll]);
  
  const toggleSubsystemSelection = (id: string) => {
    const updatedSubsystems = subsystems.map(s =>
      s.id === id ? { ...s, selected: !s.selected } : s
    );
    setSubsystems(updatedSubsystems);
  };
  
  const getSelectedSubsystems = () => {
    return subsystems.filter(s => s.selected);
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
      
      // Simple CSV parsing
      const lines = content.split("\n");
      const headers = lines[0].split(",").map(h => h.trim());
      
      const parsedRows = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(",").map(v => v.trim());
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        
        parsedRows.push(row);
      }
      
      setParsedData(parsedRows);
      toast({
        title: "Archivo cargado",
        description: `Se cargaron ${parsedRows.length} registros desde el archivo CSV`,
      });
    };
    
    reader.readAsText(file);
  };
  
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedSubs = getSelectedSubsystems();
    if (selectedSubs.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un subsistema",
        variant: "destructive"
      });
      return;
    }
    
    if (!itrName) {
      toast({
        title: "Error", 
        description: "El nombre del ITR es obligatorio",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const tasks = selectedSubs.map(sub => ({
        name: itrName,
        description: itrDescription || null,
        status: itrStatus,
        subsystem_id: sub.id
      }));
      
      const result = await bulkCreateTasks(tasks);
      
      toast({
        title: "Éxito",
        description: `Se crearon ${result.length} ITRs correctamente`,
      });
      
      // Reset form
      setItrName("");
      setItrDescription("");
      setItrStatus("pending");
      // Unselect all subsystems
      setSubsystems(subsystems.map(s => ({ ...s, selected: false })));
      setSelectAll(false);
      
    } catch (error) {
      console.error("Error creating ITRs:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al crear los ITRs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCSVSubmit = async () => {
    if (parsedData.length === 0) {
      toast({
        title: "Error",
        description: "No hay datos para procesar",
        variant: "destructive"
      });
      return;
    }
    
    const selectedSubs = getSelectedSubsystems();
    if (selectedSubs.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un subsistema",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Create a task for each combination of CSV row and selected subsystem
      const allTasks = [];
      
      for (const row of parsedData) {
        if (!row.name) {
          console.warn("Fila sin nombre, se omitirá:", row);
          continue;
        }
        
        for (const sub of selectedSubs) {
          allTasks.push({
            name: row.name,
            description: row.description || null,
            status: row.status || "pending",
            subsystem_id: sub.id
          });
        }
      }
      
      if (allTasks.length === 0) {
        toast({
          title: "Error",
          description: "No se generaron tareas válidas para crear",
          variant: "destructive"
        });
        return;
      }
      
      const result = await bulkCreateTasks(allTasks);
      
      toast({
        title: "Éxito",
        description: `Se crearon ${result.length} ITRs correctamente`,
      });
      
      // Reset
      setCsvContent(null);
      setParsedData([]);
      // Unselect all subsystems
      setSubsystems(subsystems.map(s => ({ ...s, selected: false })));
      setSelectAll(false);
      
    } catch (error) {
      console.error("Error creating ITRs from CSV:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al crear los ITRs desde el archivo CSV",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Database className="mr-2 h-5 w-5" />
          Carga Masiva de ITRs
        </CardTitle>
        <CardDescription>
          Cree y asigne ITRs a múltiples subsistemas de forma simultánea
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar subsistemas</Label>
              <Input
                id="search"
                placeholder="Nombre del subsistema, sistema o proyecto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-1/4">
              <Label htmlFor="project">Proyecto</Label>
              <Select 
                value={selectedProjectId || ""}
                onValueChange={(value) => {
                  setSelectedProjectId(value || null);
                  setSelectedSystemId(null);
                }}
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="Todos los proyectos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los proyectos</SelectItem>
                  {projectsData.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-1/4">
              <Label htmlFor="system">Sistema</Label>
              <Select 
                value={selectedSystemId || ""}
                onValueChange={(value) => setSelectedSystemId(value || null)}
                disabled={!selectedProjectId}
              >
                <SelectTrigger id="system">
                  <SelectValue placeholder="Todos los sistemas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los sistemas</SelectItem>
                  {selectedProjectId && 
                    projectsData
                      .find(p => p.id === selectedProjectId)
                      ?.systems.map((system) => (
                        <SelectItem key={system.id} value={system.id}>
                          {system.name}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <div className="bg-muted p-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="selectAll" 
                  checked={selectAll}
                  onCheckedChange={(checked) => setSelectAll(!!checked)}
                />
                <Label htmlFor="selectAll" className="font-medium">
                  Seleccionar todos los subsistemas ({filteredSubsystems.length})
                </Label>
              </div>
              <div className="text-sm text-muted-foreground">
                {getSelectedSubsystems().length} seleccionados
              </div>
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                  <p className="mt-2 text-muted-foreground">Cargando subsistemas...</p>
                </div>
              ) : filteredSubsystems.length > 0 ? (
                <table className="w-full">
                  <thead className="sticky top-0 bg-background border-b">
                    <tr>
                      <th className="w-10 p-2">Sel.</th>
                      <th className="p-2 text-left">Subsistema</th>
                      <th className="p-2 text-left">Sistema</th>
                      <th className="p-2 text-left">Proyecto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredSubsystems.map((subsystem) => {
                      const isSelected = subsystems.find(s => s.id === subsystem.id)?.selected || false;
                      return (
                        <tr key={subsystem.id} className="hover:bg-muted/50">
                          <td className="p-2 text-center">
                            <Checkbox 
                              checked={isSelected}
                              onCheckedChange={() => toggleSubsystemSelection(subsystem.id)}
                            />
                          </td>
                          <td className="p-2">{subsystem.name}</td>
                          <td className="p-2">{subsystem.systemName}</td>
                          <td className="p-2">{subsystem.projectName}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No se encontraron subsistemas con los filtros actuales
                </div>
              )}
            </div>
          </div>
          
          <Tabs defaultValue="manual" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Entrada Manual</TabsTrigger>
              <TabsTrigger value="csv">Carga desde CSV</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual">
              <form onSubmit={handleManualSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="itrName">Nombre del ITR</Label>
                  <Input
                    id="itrName"
                    value={itrName}
                    onChange={(e) => setItrName(e.target.value)}
                    placeholder="Escribe el nombre del ITR"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="itrDescription">Descripción (opcional)</Label>
                  <Textarea
                    id="itrDescription"
                    value={itrDescription}
                    onChange={(e) => setItrDescription(e.target.value)}
                    placeholder="Escribe una descripción para el ITR"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="itrStatus">Estado</Label>
                  <Select value={itrStatus} onValueChange={setItrStatus}>
                    <SelectTrigger id="itrStatus">
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="inprogress">En Progreso</SelectItem>
                      <SelectItem value="complete">Completado</SelectItem>
                      <SelectItem value="delayed">Retrasado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || getSelectedSubsystems().length === 0}
                >
                  {loading ? "Procesando..." : "Crear ITRs en Subsistemas Seleccionados"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="csv">
              <div className="space-y-4 pt-4">
                <div className="border-2 border-dashed border-muted rounded-md p-6 text-center">
                  <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <h3 className="text-sm font-medium mb-1">Subir archivo CSV</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    El archivo CSV debe tener las columnas: name, description, status
                  </p>
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Label htmlFor="csvFile" className="cursor-pointer">
                    <Button variant="outline" type="button">
                      <Upload className="h-4 w-4 mr-2" />
                      Seleccionar Archivo
                    </Button>
                  </Label>
                </div>
                
                {parsedData.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">
                      {parsedData.length} registros cargados
                    </h3>
                    <div className="border rounded-md overflow-hidden max-h-60">
                      <DataTable
                        columns={[
                          { header: "Nombre", accessorKey: "name" },
                          { header: "Descripción", accessorKey: "description" },
                          { header: "Estado", accessorKey: "status" }
                        ]}
                        data={parsedData}
                      />
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={handleCSVSubmit} 
                  className="w-full"
                  disabled={loading || parsedData.length === 0 || getSelectedSubsystems().length === 0}
                >
                  {loading ? "Procesando..." : "Crear ITRs desde CSV en Subsistemas Seleccionados"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default BatchITRUpload;
