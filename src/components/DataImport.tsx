
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { generateImportTemplate, importDataFromExcel } from "@/services/supabaseService";

interface ImportStats {
  projects: number;
  systems: number;
  subsystems: number;
  tasks: number;
  itrs: number;
  users: number;
}

export function DataImport() {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const downloadTemplate = () => {
    try {
      // Generar el template usando la función del servicio
      const buffer = generateImportTemplate();
      
      // Convertir a Blob
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Crear URL y descargar
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "oilpulse_plantilla_importacion.xlsx";
      document.body.appendChild(a);
      a.click();
      
      // Limpieza
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Plantilla descargada",
        description: "La plantilla para importación de datos se ha descargado correctamente.",
      });
    } catch (error) {
      console.error("Error al generar plantilla:", error);
      toast({
        title: "Error",
        description: "No se pudo generar la plantilla de importación",
        variant: "destructive"
      });
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setError(null);
      setImportStats(null);
      
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          
          // Usar la función del servicio para procesar la importación
          const stats = await importDataFromExcel(data);
          
          // Establecer estadísticas para mostrar
          setImportStats(stats);
          
          // Mostrar mensaje de éxito
          toast({
            title: "Importación completada",
            description: `Se han importado: ${stats.projects} proyectos, ${stats.systems} sistemas, ${stats.subsystems} subsistemas, ${stats.tasks} tareas, ${stats.itrs} ITRs, ${stats.users} usuarios.`,
          });
          
        } catch (err: any) {
          console.error("Error procesando archivo:", err);
          setError("Error al procesar el archivo: " + (err.message || "Verifica que tenga el formato correcto."));
        } finally {
          setImporting(false);
        }
      };
      
      reader.onerror = () => {
        setError("Error al leer el archivo. Inténtalo de nuevo.");
        setImporting(false);
      };
      
      reader.readAsArrayBuffer(file);
      
    } catch (err: any) {
      console.error("Error durante la importación:", err);
      setError("Ocurrió un error durante la importación: " + (err.message || "Inténtalo de nuevo."));
      setImporting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Importación de datos</CardTitle>
        <CardDescription>
          Descarga la plantilla, complétala con tus datos y súbela para poblar la aplicación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Descargar plantilla Excel
          </Button>
          
          <div className="relative">
            <input
              type="file"
              id="file-upload"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".xlsx"
              onChange={handleFileImport}
              disabled={importing}
            />
            <Button className="w-full" disabled={importing}>
              <Upload className="mr-2 h-4 w-4" />
              {importing ? "Importando..." : "Subir archivo de datos"}
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {importStats && (
          <div className="text-sm border rounded-md p-4 bg-muted/50">
            <h4 className="font-medium mb-2">Resumen de importación:</h4>
            <ul className="space-y-1">
              <li>Proyectos: {importStats.projects}</li>
              <li>Sistemas: {importStats.systems}</li>
              <li>Subsistemas: {importStats.subsystems}</li>
              <li>Tareas: {importStats.tasks}</li>
              <li>ITRs: {importStats.itrs}</li>
              <li>Usuarios: {importStats.users}</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
