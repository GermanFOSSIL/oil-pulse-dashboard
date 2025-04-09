
import { Button } from "@/components/ui/button";
import { FileDown, FileText } from "lucide-react";

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
  );
};

export default TestPacksExportButtons;
