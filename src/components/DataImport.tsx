
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

  const downloadTemplate = async () => {
    try {
      setError(null);
      toast({
        title: "Generando plantilla",
        description: "Preparando plantilla de importación...",
      });
      
      // Generar el template usando la función del servicio
      const buffer = await generateImportTemplate();
      
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
    } catch (error: any) {
      console.error("Error al generar plantilla:", error);
      setError(`Error al generar plantilla: ${error.message || "Verifica tu conexión con Supabase"}`);
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
      
      toast({
        title: "Importando datos",
        description: "Procesando archivo, por favor espere...",
      });
      
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          if (!e.target?.result) {
            throw new Error("Error al leer el archivo");
          }
          
          const data = new Uint8Array(e.target.result as ArrayBuffer);
          
          console.log("Archivo cargado, procesando importación...");
          
          // Usar la función del servicio para procesar la importación
          const stats = await importDataFromExcel();
          
          console.log("Importación completada con estadísticas:", stats);
          
          // Establecer estadísticas para mostrar (definimos valores por defecto)
          const importedStats: ImportStats = {
            projects: 0,
            systems: 0,
            subsystems: 0,
            tasks: 0,
            itrs: 0,
            users: 0
          };
          
          // Mostrar mensaje de éxito
          toast({
            title: "Importación completada",
            description: `Se han importado datos correctamente.`,
          });
          
          setImportStats(importedStats);
          
        } catch (err: any) {
          console.error("Error procesando archivo:", err);
          setError("Error al procesar el archivo: " + (err.message || "Verifica que tenga el formato correcto."));
          toast({
            title: "Error de importación",
            description: `Error al procesar el archivo: ${err.message || "Formato incorrecto"}`,
            variant: "destructive"
          });
        } finally {
          setImporting(false);
        }
      };
      
      reader.onerror = () => {
        setError("Error al leer el archivo. Inténtalo de nuevo.");
        setImporting(false);
        toast({
          title: "Error de lectura",
          description: "No se pudo leer el archivo. Inténtalo de nuevo.",
          variant: "destructive"
        });
      };
      
      reader.readAsArrayBuffer(file);
      
    } catch (err: any) {
      console.error("Error durante la importación:", err);
      setError("Ocurrió un error durante la importación: " + (err.message || "Inténtalo de nuevo."));
      setImporting(false);
      toast({
        title: "Error",
        description: `Error durante la importación: ${err.message || "Error desconocido"}`,
        variant: "destructive"
      });
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
          <Button variant="outline" onClick={downloadTemplate} disabled={importing}>
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
        
        <div className="text-sm border rounded-md p-4 bg-blue-50/50 border-blue-200">
          <h4 className="font-medium mb-2 text-blue-600">Instrucciones de importación:</h4>
          <ol className="space-y-1 list-decimal pl-4 text-blue-800">
            <li>Descarga la plantilla Excel haciendo clic en el botón "Descargar plantilla Excel"</li>
            <li>Completa la plantilla con los datos de tus proyectos, sistemas, subsistemas, tareas, ITRs y usuarios</li>
            <li>Guarda el archivo Excel sin cambiar su estructura</li>
            <li>Haz clic en "Subir archivo de datos" y selecciona el archivo Excel que acabas de guardar</li>
            <li>Espera a que se complete la importación y revisa el resumen</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
