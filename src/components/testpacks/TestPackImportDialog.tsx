
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/FileUpload";
import { importFromExcel } from "@/services/testPackService";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface TestPackImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TestPackImportDialog = ({
  open,
  onOpenChange,
  onSuccess
}: TestPackImportDialogProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count: number } | null>(null);

  const handleFileUpload = (files: File[]) => {
    if (files.length > 0) {
      setUploadedFile(files[0]);
    }
  };

  const handleImport = async () => {
    if (!uploadedFile) {
      toast({
        title: "Error",
        description: "Por favor, seleccione un archivo para importar.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const buffer = await uploadedFile.arrayBuffer();
      const importResult = await importFromExcel(buffer);
      
      setResult(importResult);
      
      if (importResult.success) {
        toast({
          title: "Importación exitosa",
          description: `Se importaron ${importResult.count} test packs correctamente.`,
        });
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
        }, 2000);
      } else {
        toast({
          title: "Error de importación",
          description: "No se pudieron importar los datos. Por favor, revise el formato del archivo.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error importing file:", error);
      setResult({
        success: false,
        count: 0
      });
      toast({
        title: "Error de importación",
        description: "Ocurrió un error al procesar el archivo. Por favor, inténtelo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setUploadedFile(null);
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Test Packs</DialogTitle>
          <DialogDescription>
            Suba un archivo Excel con la lista de test packs a importar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!result && (
            <>
              <FileUpload
                value={uploadedFile ? [uploadedFile] : []}
                onValueChange={handleFileUpload}
                disabled={isProcessing}
                maxFiles={1}
                acceptedFileTypes={[
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  "application/vnd.ms-excel"
                ]}
              />
              
              {uploadedFile && (
                <div className="text-sm">
                  Archivo seleccionado: <span className="font-medium">{uploadedFile.name}</span>
                </div>
              )}
            </>
          )}
          
          {result && (
            <div className={`p-4 border rounded-md ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                )}
                <div>
                  <h4 className="font-medium">
                    {result.success ? 'Importación completada' : 'Error de importación'}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {result.success 
                      ? `Se importaron ${result.count} test packs correctamente.`
                      : 'No se pudieron importar los datos. Por favor, revise el formato del archivo.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          {!result ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={!uploadedFile || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                    Procesando...
                  </>
                ) : 'Importar'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={resetForm}>
                Subir otro archivo
              </Button>
              <Button onClick={() => {
                if (result.success) {
                  onSuccess();
                }
                onOpenChange(false);
              }}>
                {result.success ? 'Cerrar' : 'Intentar de nuevo'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TestPackImportDialog;
