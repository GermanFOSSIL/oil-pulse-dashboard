
import { Button } from "@/components/ui/button";
import { PlusCircle, FileSpreadsheet } from "lucide-react";

interface TestPacksHeaderProps {
  onCreateNew: () => void;
  onBatchUpload: () => void;
}

const TestPacksHeader = ({ onCreateNew, onBatchUpload }: TestPacksHeaderProps) => {
  return (
    <div className="flex flex-col lg:flex-row justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Test Packs</h1>
        <p className="text-muted-foreground">
          Gestión y seguimiento de Test Packs y TAGs
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button 
          variant="outline" 
          className="h-10"
          onClick={onBatchUpload}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Carga Masiva
        </Button>
        <Button 
          className="h-10"
          onClick={onCreateNew}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Nuevo Test Pack
        </Button>
      </div>
    </div>
  );
};

export default TestPacksHeader;
