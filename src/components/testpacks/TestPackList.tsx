
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TestPack } from "@/services/testPackService";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchIcon, FilterIcon, X } from "lucide-react";
import TestPackTags from "./TestPackTags";

interface TestPackListProps {
  testPacks: TestPack[] | undefined;
  isLoading: boolean;
  onTagRelease: (tagId: string) => void;
  userRole: string;
  onClearFilters: () => void;
}

const TestPackList = ({ 
  testPacks, 
  isLoading,

  onTagRelease,
  userRole,
  onClearFilters
}: TestPackListProps) => {
  const [expandedTestPack, setExpandedTestPack] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    search: "",
    sistema: "",
    subsistema: "",
    estado: ""
  });

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
          tp.itr_asociado.toLowerCase().includes(filter.search.toLowerCase());
        
        const matchesSistema = !filter.sistema || tp.sistema === filter.sistema;
        const matchesSubsistema = !filter.subsistema || tp.subsistema === filter.subsistema;
        const matchesEstado = !filter.estado || tp.estado === filter.estado;
        
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
                <SelectItem value="">Todos los sistemas</SelectItem>
                {systems.map(system => (
                  <SelectItem key={system} value={system}>{system}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={filter.subsistema}
              onValueChange={value => setFilter({...filter, subsistema: value})}
              disabled={!filter.sistema}
            >
              <SelectTrigger>
                <SelectValue placeholder={filter.sistema ? "Subsistema" : "Primero seleccione un sistema"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los subsistemas</SelectItem>
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
                <SelectItem value="">Todos los estados</SelectItem>
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
                      ITR: {testPack.itr_asociado} | Sistema: {testPack.sistema} | Subsistema: {testPack.subsistema}
                    </CardDescription>
                  </div>
                  <Badge variant={testPack.estado === 'listo' ? 'default' : 'outline'}>
                    {testPack.estado === 'listo' ? 'Listo' : 'Pendiente'}
                  </Badge>
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
    </div>
  );
};

export default TestPackList;
