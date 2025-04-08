
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TestPack } from "@/services/testPackService";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSystem, setSelectedSystem] = useState<string>("");
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  if (!testPacks) {
    return null;
  }

  const uniqueSystems = Array.from(new Set(testPacks.map(tp => tp.sistema) || [])).sort();
  const uniqueSubsystems = Array.from(
    new Set(testPacks.filter(tp => !selectedSystem || tp.sistema === selectedSystem)
    .map(tp => tp.subsistema) || [])
  ).sort();

  const filteredTestPacks = testPacks.filter(testPack => {
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

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSystem("");
    setSelectedSubsystem("");
    setSelectedStatus("");
    onClearFilters();
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="p-4 space-y-4">
          <h3 className="text-lg font-medium">Filtros</h3>
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
                  <SelectItem value="all">Todos los sistemas</SelectItem>
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
                  <SelectItem value="all">Todos los subsistemas</SelectItem>
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
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="listo">Listo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
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
                    <TestPackTags 
                      testPackId={testPack.id} 
                      userRole={userRole} 
                      onTagRelease={onTagRelease} 
                    />
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
    </div>
  );
};

export default TestPackList;
