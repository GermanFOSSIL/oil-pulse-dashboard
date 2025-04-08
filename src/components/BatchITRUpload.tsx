
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUp, Database, Upload, Check, Copy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table";
import { getProjectsHierarchy } from "@/services/systemService";
import { bulkCreateTasks } from "@/services/taskService";
import { fetchAllITRsWithSystemInfo, cloneITRsToSubsystems } from "@/services/itrService";
import { ITRWithSystem } from "@/services/types";

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
  
  // ITR cloning
  const [existingITRs, setExistingITRs] = useState<ITRWithSystem[]>([]);
  const [filteredITRs, setFilteredITRs] = useState<ITRWithSystem[]>([]);
  const [itrSearchTerm, setItrSearchTerm] = useState("");
  const [itrFilterProjectId, setItrFilterProjectId] = useState<string | null>(null);
  const [itrFilterSystemId, setItrFilterSystemId] = useState<string | null>(null);
  const [selectAllITRs, setSelectAllITRs] = useState(false);
  const [selectedITRsCount, setSelectedITRsCount] = useState(0);
  const [cloningLoading, setCloningLoading] = useState(false);
  
  // Fetch projects hierarchy and existing ITRs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch projects hierarchy
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
        
        // Fetch existing ITRs
        const itrs = await fetchAllITRsWithSystemInfo();
        setExistingITRs(itrs);
        setFilteredITRs(itrs);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los proyectos, subsistemas o ITRs",
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
  
  // Filter ITRs when search or selections change
  useEffect(() => {
    let filtered = [...existingITRs];
    
    // Filter by search term
    if (itrSearchTerm) {
      filtered = filtered.filter(itr => 
        itr.name.toLowerCase().includes(itrSearchTerm.toLowerCase()) ||
        itr.subsystemName.toLowerCase().includes(itrSearchTerm.toLowerCase()) ||
        itr.systemName.toLowerCase().includes(itrSearchTerm.toLowerCase()) ||
        (itr.projectName && itr.projectName.toLowerCase().includes(itrSearchTerm.toLowerCase()))
      );
    }
    
    // Filter by project
    if (itrFilterProjectId) {
      filtered = filtered.filter(itr => {
        // Check if the ITR's subsystem belongs to a system that belongs to the selected project
        const subsystemInProject = subsystems.find(s => s.id === itr.subsystem_id && 
          projectsData.find(p => p.id === itrFilterProjectId)?.systems.some(sys => 
            sys.subsystems.some(sub => sub.id === itr.subsystem_id)
          )
        );
        return subsystemInProject !== undefined;
      });
    }
    
    // Filter by system
    if (itrFilterSystemId) {
      filtered = filtered.filter(itr => {
        // Check if the ITR's subsystem belongs to the selected system
        const subsystemInSystem = subsystems.find(s => s.id === itr.subsystem_id && 
          projectsData.flatMap(p => p.systems).find(sys => sys.id === itrFilterSystemId)?.subsystems.some(sub => 
            sub.id === itr.subsystem_id
          )
        );
        return subsystemInSystem !== undefined;
      });
    }
    
    setFilteredITRs(filtered);
  }, [itrSearchTerm, existingITRs, itrFilterProjectId, itrFilterSystemId, projectsData, subsystems]);
  
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
  
  // Toggle selection of all visible ITRs
  useEffect(() => {
    const updatedITRs = existingITRs.map(itr => {
      if (filteredITRs.some(fi => fi.id === itr.id)) {
        return { ...itr, selected: selectAllITRs };
      }
      return itr;
    });
    
    setExistingITRs(updatedITRs);
    
    // Update selected count
    const selectedCount = updatedITRs.filter(itr => itr.selected).length;
    setSelectedITRsCount(selectedCount);
  }, [selectAllITRs, filteredITRs]);
  
  // Update selected ITRs count when individual selections change
  useEffect(() => {
    const selectedCount = existingITRs.filter(itr => itr.selected).length;
    setSelectedITRsCount(selectedCount);
  }, [existingITRs]);
  
  const toggleSubsystemSelection = (id: string) => {
    const updatedSubsystems = subsystems.map(s =>
      s.id === id ? { ...s, selected: !s.selected } : s
    );
    setSubsystems(updatedSubsystems);
  };
  
  const toggleITRSelection = (id: string) => {
    const updatedITRs = existingITRs.map(itr =>
      itr.id === id ? { ...itr, selected: !itr.selected } : itr
    );
    setExistingITRs(updatedITRs);
  };
  
  const getSelectedSubsystems = () => {
    return subsystems.filter(s => s.selected);
  };
  
  const getSelectedITRs = () => {
    return existingITRs.filter(itr => itr.selected);
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
  
  const handleCloneSubmit = async () => {
    const selectedITRs = getSelectedITRs();
    const selectedSubs = getSelectedSubsystems();
    
    if (selectedITRs.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un ITR para clonar",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedSubs.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un subsistema destino",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setCloningLoading(true);
      
      const subsystemIds = selectedSubs.map(sub => sub.id);
      const result = await cloneITRsToSubsystems(selectedITRs, subsystemIds);
      
      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        });
        
        // Reset selections
        setExistingITRs(existingITRs.map(itr => ({ ...itr, selected: false })));
        setSubsystems(subsystems.map(s => ({ ...s, selected: false })));
        setSelectAll(false);
        setSelectAllITRs(false);
        
        // Refresh ITR list 
        const refreshedITRs = await fetchAllITRsWithSystemInfo();
        setExistingITRs(refreshedITRs);
        setFilteredITRs(refreshedITRs);
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error cloning ITRs:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al clonar los ITRs",
        variant: "destructive"
      });
    } finally {
      setCloningLoading(false);
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
          Cree, asigne y clone ITRs a múltiples subsistemas de forma simultánea
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="clone" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual">Entrada Manual</TabsTrigger>
            <TabsTrigger value="csv">Carga desde CSV</TabsTrigger>
            <TabsTrigger value="clone">Clonar ITRs Existentes</TabsTrigger>
          </TabsList>
          
          <div className="space-y-6 mt-6">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <Label htmlFor="search">Buscar subsistemas destino</Label>
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
                    setSelectedProjectId(value === "" ? null : value);
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
                  onValueChange={(value) => setSelectedSystemId(value === "" ? null : value)}
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
          
            <TabsContent value="manual">
              <form onSubmit={handleManualSubmit} className="space-y-4">
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
              <div className="space-y-4">
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
            
            <TabsContent value="clone">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="itrSearch">Buscar ITRs para clonar</Label>
                    <Input
                      id="itrSearch"
                      placeholder="Buscar por nombre, subsistema, sistema o proyecto..."
                      value={itrSearchTerm}
                      onChange={(e) => setItrSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="w-full sm:w-1/4">
                    <Label htmlFor="itrProject">Filtrar por Proyecto</Label>
                    <Select 
                      value={itrFilterProjectId || ""}
                      onValueChange={(value) => {
                        setItrFilterProjectId(value === "" ? null : value);
                        setItrFilterSystemId(null);
                      }}
                    >
                      <SelectTrigger id="itrProject">
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
                    <Label htmlFor="itrSystem">Filtrar por Sistema</Label>
                    <Select 
                      value={itrFilterSystemId || ""}
                      onValueChange={(value) => setItrFilterSystemId(value === "" ? null : value)}
                      disabled={!itrFilterProjectId}
                    >
                      <SelectTrigger id="itrSystem">
                        <SelectValue placeholder="Todos los sistemas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos los sistemas</SelectItem>
                        {itrFilterProjectId && 
                          projectsData
                            .find(p => p.id === itrFilterProjectId)
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
                        id="selectAllITRs" 
                        checked={selectAllITRs}
                        onCheckedChange={(checked) => setSelectAllITRs(!!checked)}
                      />
                      <Label htmlFor="selectAllITRs" className="font-medium">
                        Seleccionar todos los ITRs ({filteredITRs.length})
                      </Label>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedITRsCount} seleccionados
                    </div>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto">
                    {loading ? (
                      <div className="p-4 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                        <p className="mt-2 text-muted-foreground">Cargando ITRs...</p>
                      </div>
                    ) : filteredITRs.length > 0 ? (
                      <table className="w-full">
                        <thead className="sticky top-0 bg-background border-b">
                          <tr>
                            <th className="w-10 p-2">Sel.</th>
                            <th className="p-2 text-left">Nombre ITR</th>
                            <th className="p-2 text-left">Estado</th>
                            <th className="p-2 text-left">Subsistema Actual</th>
                            <th className="p-2 text-left">Sistema</th>
                            <th className="p-2 text-left">Proyecto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredITRs.map((itr) => {
                            const isSelected = itr.selected || false;
                            return (
                              <tr key={itr.id} className="hover:bg-muted/50">
                                <td className="p-2 text-center">
                                  <Checkbox 
                                    checked={isSelected}
                                    onCheckedChange={() => toggleITRSelection(itr.id)}
                                  />
                                </td>
                                <td className="p-2">{itr.name}</td>
                                <td className="p-2">
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                                    itr.status === 'complete' ? 'bg-green-100 text-green-800' : 
                                    itr.status === 'delayed' ? 'bg-red-100 text-red-800' : 
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {itr.status === 'complete' ? 'Completado' : 
                                     itr.status === 'delayed' ? 'Retrasado' : 
                                     itr.status === 'inprogress' ? 'En Progreso' : 'Pendiente'}
                                  </span>
                                </td>
                                <td className="p-2">{itr.subsystemName}</td>
                                <td className="p-2">{itr.systemName}</td>
                                <td className="p-2">{itr.projectName}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No se encontraron ITRs con los filtros actuales
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  onClick={handleCloneSubmit}
                  className="w-full"
                  disabled={cloningLoading || selectedITRsCount === 0 || getSelectedSubsystems().length === 0}
                >
                  {cloningLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Clonando...
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Clonar {selectedITRsCount} ITRs a {getSelectedSubsystems().length} Subsistemas Seleccionados
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BatchITRUpload;
