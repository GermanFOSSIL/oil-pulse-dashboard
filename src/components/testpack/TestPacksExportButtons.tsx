
import { Button } from "@/components/ui/button";
import { 
  FileDown, 
  FileText, 
  Download,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TestPacksExportButtonsProps {
  isExporting: boolean;
  isLoading: boolean;
  hasData: boolean;
  onExportExcel: () => void;
  onExportPDF: () => void;
}

const TestPacksExportButtons = ({
  isExporting,
  isLoading,
  hasData,
  onExportExcel,
  onExportPDF
}: TestPacksExportButtonsProps) => {
  return (
    <div className="flex justify-end space-x-2 mb-4">
      <div className="hidden md:flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onExportExcel}
          disabled={isExporting || isLoading || !hasData}
          className="gap-2"
        >
          <FileDown className="h-4 w-4" />
          Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExportPDF}
          disabled={isExporting || isLoading || !hasData}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          PDF
        </Button>
      </div>
      
      {/* For mobile */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isExporting || isLoading || !hasData}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExportExcel}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportar a Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Exportar a PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TestPacksExportButtons;
