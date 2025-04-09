
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchIcon, X } from "lucide-react";

interface TestPackFilter {
  search: string;
  sistema: string;
  subsistema: string;
  estado: string;
}

interface TestPackFiltersProps {
  filter: TestPackFilter;
  systems: string[];
  subsystems: string[];
  onFilterChange: (filter: TestPackFilter) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const TestPackFilters = ({
  filter,
  systems,
  subsystems,
  onFilterChange,
  onClearFilters,
  hasActiveFilters
}: TestPackFiltersProps) => {
  return (
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
              onChange={e => onFilterChange({...filter, search: e.target.value})}
            />
          </div>
          
          <Select
            value={filter.sistema}
            onValueChange={value => onFilterChange({...filter, sistema: value, subsistema: ""})}
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
            onValueChange={value => onFilterChange({...filter, subsistema: value})}
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
            onValueChange={value => onFilterChange({...filter, estado: value})}
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
        
        {hasActiveFilters && (
          <div className="flex justify-end mt-4">
            <Button variant="outline" size="sm" onClick={onClearFilters} className="flex items-center">
              <X className="mr-1 h-4 w-4" />
              Limpiar filtros
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
