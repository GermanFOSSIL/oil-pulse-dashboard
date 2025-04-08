
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { ITR, Subsystem, System, Project } from "@/services/types";

interface ImportStats {
  projects: number;
  systems: number;
  subsystems: number;
  itrs: number;
  users: number;
}

export function DataImport() {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateImportTemplate = () => {
    // Create workbook with sheets for projects, systems, subsystems, and ITRs
    const wb = XLSX.utils.book_new();
    
    // Projects sheet
    const projectsData = [
      ["name", "location", "status", "progress", "start_date", "end_date"],
      ["Proyecto Ejemplo", "Ubicación ejemplo", "inprogress", 50, "2023-01-01", "2023-12-31"]
    ];
    const projectsWs = XLSX.utils.aoa_to_sheet(projectsData);
    XLSX.utils.book_append_sheet(wb, projectsWs, "Proyectos");
    
    // Systems sheet
    const systemsData = [
      ["name", "project_id", "completion_rate", "start_date", "end_date"],
      ["Sistema Ejemplo", "ID_PROYECTO", 40, "2023-01-15", "2023-11-30"]
    ];
    const systemsWs = XLSX.utils.aoa_to_sheet(systemsData);
    XLSX.utils.book_append_sheet(wb, systemsWs, "Sistemas");
    
    // Subsystems sheet
    const subsystemsData = [
      ["name", "system_id", "completion_rate", "start_date", "end_date"],
      ["Subsistema Ejemplo", "ID_SISTEMA", 30, "2023-02-01", "2023-10-31"]
    ];
    const subsystemsWs = XLSX.utils.aoa_to_sheet(subsystemsData);
    XLSX.utils.book_append_sheet(wb, subsystemsWs, "Subsistemas");
    
    // ITRs sheet
    const itrsData = [
      ["name", "subsystem_id", "status", "progress", "assigned_to", "start_date", "end_date"],
      ["ITR Ejemplo", "ID_SUBSISTEMA", "inprogress", 25, "Técnico ejemplo", "2023-03-01", "2023-09-30"]
    ];
    const itrsWs = XLSX.utils.aoa_to_sheet(itrsData);
    XLSX.utils.book_append_sheet(wb, itrsWs, "ITRs");
    
    // Generate buffer
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return wbout;
  };

  const downloadTemplate = async () => {
    try {
      setError(null);
      toast({
        title: "Generando plantilla",
        description: "Preparando plantilla de importación...",
      });
      
      // Generar el template
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

  const importDataFromExcel = async (data: ArrayBuffer): Promise<ImportStats> => {
    try {
      const wb = XLSX.read(data, { type: 'array' });
      
      // Process Projects
      let projectsCount = 0;
      if (wb.SheetNames.includes('Proyectos')) {
        const projectsSheet = wb.Sheets['Proyectos'];
        const projectsData = XLSX.utils.sheet_to_json(projectsSheet);
        
        for (const row of projectsData) {
          const project = row as any;
          if (project.name) {
            const { error } = await supabase
              .from('projects')
              .insert({
                name: project.name,
                location: project.location || null,
                status: project.status || 'inprogress',
                progress: project.progress || 0,
                start_date: project.start_date || null,
                end_date: project.end_date || null
              });
              
            if (!error) projectsCount++;
          }
        }
      }
      
      // Get the latest projects to use their IDs
      const { data: latestProjects } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(projectsCount || 1);
      
      // Process Systems
      let systemsCount = 0;
      if (wb.SheetNames.includes('Sistemas') && latestProjects?.length) {
        const systemsSheet = wb.Sheets['Sistemas'];
        const systemsData = XLSX.utils.sheet_to_json(systemsSheet);
        
        for (const row of systemsData) {
          const system = row as any;
          if (system.name) {
            // Use the first project's ID if project_id is not specified
            const projectId = system.project_id && system.project_id !== 'ID_PROYECTO' 
              ? system.project_id 
              : latestProjects[0].id;
              
            const { error } = await supabase
              .from('systems')
              .insert({
                name: system.name,
                project_id: projectId,
                completion_rate: system.completion_rate || 0,
                start_date: system.start_date || null,
                end_date: system.end_date || null
              });
              
            if (!error) systemsCount++;
          }
        }
      }
      
      // Get the latest systems to use their IDs
      const { data: latestSystems } = await supabase
        .from('systems')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(systemsCount || 1);
      
      // Process Subsystems
      let subsystemsCount = 0;
      if (wb.SheetNames.includes('Subsistemas') && latestSystems?.length) {
        const subsystemsSheet = wb.Sheets['Subsistemas'];
        const subsystemsData = XLSX.utils.sheet_to_json(subsystemsSheet);
        
        for (const row of subsystemsData) {
          const subsystem = row as any;
          if (subsystem.name) {
            // Use the first system's ID if system_id is not specified
            const systemId = subsystem.system_id && subsystem.system_id !== 'ID_SISTEMA' 
              ? subsystem.system_id 
              : latestSystems[0].id;
              
            const { error } = await supabase
              .from('subsystems')
              .insert({
                name: subsystem.name,
                system_id: systemId,
                completion_rate: subsystem.completion_rate || 0,
                start_date: subsystem.start_date || null,
                end_date: subsystem.end_date || null
              });
              
            if (!error) subsystemsCount++;
          }
        }
      }
      
      // Get the latest subsystems to use their IDs
      const { data: latestSubsystems } = await supabase
        .from('subsystems')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(subsystemsCount || 1);
      
      // Process ITRs
      let itrsCount = 0;
      if (wb.SheetNames.includes('ITRs') && latestSubsystems?.length) {
        const itrsSheet = wb.Sheets['ITRs'];
        const itrsData = XLSX.utils.sheet_to_json(itrsSheet);
        
        for (const row of itrsData) {
          const itr = row as any;
          if (itr.name) {
            // Use the first subsystem's ID if subsystem_id is not specified
            const subsystemId = itr.subsystem_id && itr.subsystem_id !== 'ID_SUBSISTEMA' 
              ? itr.subsystem_id 
              : latestSubsystems[0].id;
              
            const { error } = await supabase
              .from('itrs')
              .insert({
                name: itr.name,
                subsystem_id: subsystemId,
                status: itr.status || 'inprogress',
                progress: itr.progress || 0,
                assigned_to: itr.assigned_to || null,
                start_date: itr.start_date || null,
                end_date: itr.end_date || null
              });
              
            if (!error) itrsCount++;
          }
        }
      }
      
      return {
        projects: projectsCount,
        systems: systemsCount,
        subsystems: subsystemsCount,
        itrs: itrsCount,
        users: 0  // Users are not imported in this version
      };
    } catch (error) {
      console.error("Error procesando el archivo Excel:", error);
      throw error;
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
          
          const data = e.target.result as ArrayBuffer;
          
          console.log("Archivo cargado, procesando importación...");
          
          // Procesar la importación
          const stats = await importDataFromExcel(data);
          
          console.log("Importación completada con estadísticas:", stats);
          
          // Mostrar mensaje de éxito
          toast({
            title: "Importación completada",
            description: `Se han importado datos correctamente.`,
          });
          
          setImportStats(stats);
          
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
