
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { importFromExcel } from "@/services/testPackService";
import { Upload, FileUp } from "lucide-react";

interface TestPackImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TestPackImportDialog = ({ open, onOpenChange, onSuccess }: TestPackImportDialogProps) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: "No hay archivo seleccionado",
        description: "Por favor seleccione un archivo Excel para importar",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const fileBuffer = await selectedFile.arrayBuffer();
      const result = await importFromExcel(fileBuffer);
      
      toast({
        title: "Importación exitosa",
        description: `Se importaron ${result.testPacks} Test Packs y ${result.tags} TAGs`
      });
      
      onSuccess();
    } catch (error: any) {
      console.error("Error importing file:", error);
      toast({
        title: "Error",
        description: `No se pudo importar el archivo: ${error.message || "Error desconocido"}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Test Packs</DialogTitle>
          <DialogDescription>
            Seleccione un archivo Excel con los datos de los Test Packs a importar.
            Asegúrese de que el archivo tenga el formato correcto.
          </DialogDescription>
        </DialogHeader>
        
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            isDragging ? 'border-primary bg-primary/10' : 'border-input'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <Upload className="h-12 w-12 text-muted-foreground" />
            
            <div className="space-y-2">
              <h3 className="font-medium">Arrastre un archivo aquí o haga clic para seleccionar</h3>
              <p className="text-sm text-muted-foreground">
                Soporte para archivos Excel (.xlsx)
              </p>
            </div>
            
            <div className="flex justify-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button type="button" variant="outline">
                  <FileUp className="h-4 w-4 mr-2" />
                  Seleccionar archivo
                </Button>
              </label>
            </div>
          </div>
        </div>
        
        {selectedFile && (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium">Archivo seleccionado:</p>
            <p className="text-sm">{selectedFile.name}</p>
          </div>
        )}
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={!selectedFile || loading}>
            {loading ? "Importando..." : "Importar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TestPackImportDialog;
