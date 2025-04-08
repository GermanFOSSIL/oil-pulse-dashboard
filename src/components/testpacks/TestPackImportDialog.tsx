
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, File, FileText, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { importFromExcel } from "@/services/testPackService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TestPackImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TestPackImportDialog = ({ open, onOpenChange, onSuccess }: TestPackImportDialogProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0] || null;
    if (droppedFile && droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Solo se permiten archivos Excel (.xlsx)');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleImport = async () => {
    if (!file) {
      setError('Por favor seleccione un archivo');
      return;
    }

    try {
      setIsUploading(true);
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const result = e.target?.result;
          if (result && typeof result !== 'string') {
            const arrayBuffer = result as ArrayBuffer;
            const importResult = await importFromExcel(arrayBuffer);
            
            toast({
              title: "Importación exitosa",
              description: `Se importaron ${importResult.testPacks} Test Packs y ${importResult.tags} TAGs.`,
            });
            
            onSuccess();
            onOpenChange(false);
          }
        } catch (error) {
          console.error("Error processing Excel data:", error);
          setError('Error al procesar el archivo Excel. Asegúrese de que el formato sea correcto.');
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.onerror = () => {
        setError('Error al leer el archivo');
        setIsUploading(false);
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Import error:", error);
      setError('Error durante la importación');
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Test Packs</DialogTitle>
          <DialogDescription>
            Suba un archivo Excel con la información de Test Packs y TAGs para importarlos al sistema.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div
          className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx"
            onChange={handleFileChange}
          />
          
          {file ? (
            <div className="space-y-2">
              <FileText className="h-10 w-10 mx-auto text-primary" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
              <div>
                <p>Haga clic o arrastre un archivo</p>
                <p className="text-xs text-muted-foreground">
                  Solo se permiten archivos Excel (.xlsx)
                </p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || isUploading}
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Importando...
              </>
            ) : (
              <>
                <File className="h-4 w-4 mr-2" />
                Importar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TestPackImportDialog;
