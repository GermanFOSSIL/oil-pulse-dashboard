
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTestPacks } from "@/hooks/useTestPacks";
import { FileSpreadsheet, Upload, AlertCircle, CheckCircle2, X } from "lucide-react";
import * as XLSX from 'xlsx';
import { TestPack, Tag } from "@/services/types";

interface BatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type FileStatus = 'idle' | 'processing' | 'success' | 'error';

const BatchUploadModal = ({ isOpen, onClose, onSuccess }: BatchUploadModalProps) => {
  const { bulkCreateData } = useTestPacks();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [fileStatus, setFileStatus] = useState<FileStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    testPacks: number;
    tags: number;
  } | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileStatus('processing');
      
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const binaryString = evt.target?.result;
          const workbook = XLSX.read(binaryString, { type: 'binary' });
          
          // Validate workbook structure
          if (!workbook.SheetNames.includes('Test Packs') || !workbook.SheetNames.includes('TAGs')) {
            throw new Error("El formato del archivo es incorrecto. Debe contener hojas 'Test Packs' y 'TAGs'.");
          }
          
          // Get test packs sheet
          const testPacksSheet = workbook.Sheets['Test Packs'];
          const testPacksData = XLSX.utils.sheet_to_json(testPacksSheet);
          
          // Get tags sheet
          const tagsSheet = workbook.Sheets['TAGs'];
          const tagsData = XLSX.utils.sheet_to_json(tagsSheet);
          
          if (testPacksData.length === 0) {
            throw new Error("No se encontraron datos de Test Packs en el archivo.");
          }
          
          // Set preview
          setImportPreview({
            testPacks: testPacksData.length,
            tags: tagsData.length
          });
          
          setFileStatus('success');
        } catch (error) {
          console.error("Error processing Excel file:", error);
          setErrorMessage(error instanceof Error ? error.message : "Error al procesar el archivo Excel.");
          setFileStatus('error');
        }
      };
      
      reader.onerror = () => {
        setErrorMessage("Error al leer el archivo.");
        setFileStatus('error');
      };
      
      reader.readAsBinaryString(selectedFile);
    }
  };
  
  const resetFileInput = () => {
    setFile(null);
    setFileStatus('idle');
    setErrorMessage('');
    setImportPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const processFile = async () => {
    if (!file) return;
    
    setIsLoading(true);
    try {
      const reader = new FileReader();
      
      reader.onload = async (evt) => {
        try {
          const binaryString = evt.target?.result;
          const workbook = XLSX.read(binaryString, { type: 'binary' });
          
          // Get test packs sheet
          const testPacksSheet = workbook.Sheets['Test Packs'];
          const testPacksRawData = XLSX.utils.sheet_to_json(testPacksSheet);
          
          // Get tags sheet
          const tagsSheet = workbook.Sheets['TAGs'];
          const tagsRawData = XLSX.utils.sheet_to_json(tagsSheet);
          
          // Process and validate test packs data
          const testPacksData: Omit<TestPack, "id" | "created_at" | "updated_at">[] = testPacksRawData.map((row: any) => ({
            nombre_paquete: row.nombre_paquete || `Test Pack ${Math.random().toString(36).substring(2, 7)}`,
            itr_asociado: row.itr_asociado || '',
            sistema: row.sistema || '',
            subsistema: row.subsistema || '',
            estado: 'pendiente' as const // Explicitly type as 'pendiente'
          })).filter((tp: any) => tp.itr_asociado && tp.sistema && tp.subsistema);
          
          // Process tags data with index to its related test pack
          const tagsData = tagsRawData.map((row: any) => {
            // Find the index of the test pack this tag belongs to
            const testPackIndex = testPacksData.findIndex((tp: any, index: number) => {
              const testPackIdInFile = row.test_pack_id;
              // If it's a number, treat it as an index (for example, 1, 2, 3...)
              if (typeof testPackIdInFile === 'number') {
                return index === testPackIdInFile - 1; // Adjust for 0-based indexing
              }
              // If it's a string, match by nombre_paquete
              return tp.nombre_paquete === testPackIdInFile;
            });
            
            if (testPackIndex === -1) {
              console.warn(`No se encontró Test Pack para TAG ${row.tag_name}`);
              return null;
            }
            
            return {
              testPackIndex: testPackIndex,
              tagData: {
                tag_name: row.tag_name || `TAG ${Math.random().toString(36).substring(2, 7)}`,
                estado: 'pendiente' as const,
                fecha_liberacion: null
              }
            };
          }).filter(Boolean);
          
          // Create test packs and tags in database
          const result = await bulkCreateData(testPacksData, tagsData);
          
          if (result) {
            onSuccess();
          }
        } catch (error) {
          console.error("Error processing Excel data:", error);
          setErrorMessage(error instanceof Error ? error.message : "Error al procesar los datos del archivo Excel.");
          setFileStatus('error');
        } finally {
          setIsLoading(false);
        }
      };
      
      reader.onerror = () => {
        setErrorMessage("Error al leer el archivo.");
        setFileStatus('error');
        setIsLoading(false);
      };
      
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error("Error in batch upload:", error);
      setErrorMessage(error instanceof Error ? error.message : "Error en la carga masiva.");
      setFileStatus('error');
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    resetFileInput();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Carga Masiva de Test Packs y TAGs</DialogTitle>
          <DialogDescription>
            Seleccione un archivo Excel que contenga los datos a importar.
            El archivo debe tener hojas llamadas "Test Packs" y "TAGs".
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <FileSpreadsheet className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium text-lg mb-2">Seleccione un archivo Excel</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Formato requerido: Hojas "Test Packs" y "TAGs"
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleFileChange}
              disabled={isLoading}
            />
            
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || fileStatus === 'processing'}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {file ? 'Cambiar archivo' : 'Seleccionar archivo'}
            </Button>
          </div>
          
          {file && fileStatus === 'success' && (
            <Alert className="bg-muted">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="flex items-center gap-2">
                {file.name}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={resetFileInput}
                  title="Eliminar archivo"
                >
                  <X className="h-3 w-3" />
                </Button>
              </AlertTitle>
              <AlertDescription>
                {importPreview && (
                  <div className="text-sm mt-1">
                    <p>Test Packs: <strong>{importPreview.testPacks}</strong></p>
                    <p>TAGs: <strong>{importPreview.tags}</strong></p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {fileStatus === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button 
            type="button" 
            disabled={isLoading || fileStatus !== 'success'}
            onClick={processFile}
          >
            {isLoading ? "Importando..." : "Importar datos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchUploadModal;
