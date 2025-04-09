
import { useState } from "react";
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BulkUserData } from "@/services/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download } from "lucide-react";

interface BulkUserUploadProps {
  onUpload: (users: BulkUserData[]) => Promise<number>;
}

const BulkUserUpload = ({ onUpload }: BulkUserUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const downloadTemplate = () => {
    const template = [
      {
        email: 'usuario1@ejemplo.com',
        full_name: 'Nombre Completo',
        password: 'contraseña123',
        role: 'admin | tecnico | user'
      },
      {
        email: 'usuario2@ejemplo.com',
        full_name: 'Otro Usuario',
        password: '',
        role: 'user'
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Usuarios");
    
    // Crear y descargar archivo
    XLSX.writeFile(wb, "plantilla_usuarios.xlsx");
  };
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<BulkUserData>(worksheet);
      
      if (data.length === 0) {
        setError("El archivo no contiene datos");
        return;
      }
      
      const successCount = await onUpload(data);
      setSuccess(`Se crearon ${successCount} usuarios correctamente`);
    } catch (err: any) {
      setError(`Error al procesar el archivo: ${err.message}`);
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Carga Masiva de Usuarios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Button 
            variant="outline" 
            onClick={downloadTemplate} 
            disabled={uploading}
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar Plantilla
          </Button>
          
          <div className="relative">
            <input
              type="file"
              id="file-upload"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".xlsx"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button className="w-full" disabled={uploading}>
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Procesando..." : "Subir Archivo"}
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        <div className="text-sm text-muted-foreground">
          <p>Para realizar una carga masiva de usuarios:</p>
          <ol className="list-decimal pl-5 space-y-1 mt-2">
            <li>Descargue la plantilla haciendo clic en "Descargar Plantilla"</li>
            <li>Complete los datos de usuarios en la plantilla Excel</li>
            <li>Guarde el archivo y súbalo haciendo clic en "Subir Archivo"</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkUserUpload;
