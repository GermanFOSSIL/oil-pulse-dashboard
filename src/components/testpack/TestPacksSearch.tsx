
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TestPacksSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const TestPacksSearch = ({ searchTerm, onSearchChange }: TestPacksSearchProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <TabsList>
        <TabsTrigger value="list">Listado</TabsTrigger>
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="activity">Actividad</TabsTrigger>
      </TabsList>
      
      <div className="flex w-full md:w-auto items-center space-x-2">
        <div className="relative flex-1 md:w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar test packs..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TestPacksSearch;
