
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { 
  createProject, 
  createSystem, 
  createSubsystem, 
  createTask, 
  createITR, 
  bulkCreateUsers 
} from "@/services/supabaseService";

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
    // Create template workbook with multiple sheets
    const workbook = XLSX.utils.book_new();
    
    // Projects template
    const projectsData = [
      ["name", "location", "status", "progress"],
      ["North Sea Platform A", "North Sea", "inprogress", 65],
      ["Gulf of Mexico Drilling", "Gulf of Mexico", "delayed", 30]
    ];
    const projectsSheet = XLSX.utils.aoa_to_sheet(projectsData);
    XLSX.utils.book_append_sheet(workbook, projectsSheet, "Projects");
    
    // Systems template
    const systemsData = [
      ["name", "project_name", "completion_rate"],
      ["Pipeline System", "North Sea Platform A", 65],
      ["Power Generation", "Gulf of Mexico Drilling", 40]
    ];
    const systemsSheet = XLSX.utils.aoa_to_sheet(systemsData);
    XLSX.utils.book_append_sheet(workbook, systemsSheet, "Systems");
    
    // Subsystems template
    const subsystemsData = [
      ["name", "system_name", "completion_rate"],
      ["High Pressure Lines", "Pipeline System", 75],
      ["Control Panels", "Power Generation", 40]
    ];
    const subsystemsSheet = XLSX.utils.aoa_to_sheet(subsystemsData);
    XLSX.utils.book_append_sheet(workbook, subsystemsSheet, "Subsystems");
    
    // Tasks template
    const tasksData = [
      ["name", "description", "subsystem_name", "status"],
      ["Pressure Testing", "Verify all pressure lines", "High Pressure Lines", "pending"],
      ["Electrical Certification", "Certify control panels", "Control Panels", "pending"]
    ];
    const tasksSheet = XLSX.utils.aoa_to_sheet(tasksData);
    XLSX.utils.book_append_sheet(workbook, tasksSheet, "Tasks");
    
    // ITRs template
    const itrsData = [
      ["name", "subsystem_name", "status", "progress", "due_date", "assigned_to"],
      ["Pressure Test 1", "High Pressure Lines", "inprogress", 65, "2025-05-15", "john.doe@example.com"],
      ["Electrical Check 1", "Control Panels", "delayed", 30, "2025-04-30", "jane.smith@example.com"]
    ];
    const itrsSheet = XLSX.utils.aoa_to_sheet(itrsData);
    XLSX.utils.book_append_sheet(workbook, itrsSheet, "ITRs");
    
    // Users template
    const usersData = [
      ["email", "full_name", "role"],
      ["john.doe@example.com", "John Doe", "Engineer"],
      ["jane.smith@example.com", "Jane Smith", "Inspector"]
    ];
    const usersSheet = XLSX.utils.aoa_to_sheet(usersData);
    XLSX.utils.book_append_sheet(workbook, usersSheet, "Users");
    
    // Save and download the file
    XLSX.writeFile(workbook, "oilpulse_data_template.xlsx");
    
    toast({
      title: "Plantilla descargada",
      description: "La plantilla para importación de datos se ha descargado correctamente.",
    });
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
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Initialize counters
          const stats: ImportStats = {
            projects: 0,
            systems: 0,
            subsystems: 0,
            tasks: 0,
            itrs: 0,
            users: 0
          };
          
          // Process Projects sheet
          if (workbook.SheetNames.includes('Projects')) {
            const projectsSheet = workbook.Sheets['Projects'];
            const projects = XLSX.utils.sheet_to_json(projectsSheet);
            
            // Skip header row
            if (projects.length > 1) {
              // Create a map of project names to IDs for later reference
              const projectMap = new Map<string, string>();
              
              for (let i = 1; i < projects.length; i++) {
                const project = projects[i] as any;
                if (project.name) {
                  try {
                    const newProject = await createProject({
                      name: project.name,
                      location: project.location || null,
                      status: project.status || 'inprogress',
                      progress: project.progress || 0
                    });
                    projectMap.set(project.name, newProject.id);
                    stats.projects++;
                  } catch (err) {
                    console.error('Error importing project:', project.name, err);
                  }
                }
              }
              
              // Process Systems sheet
              if (workbook.SheetNames.includes('Systems')) {
                const systemsSheet = workbook.Sheets['Systems'];
                const systems = XLSX.utils.sheet_to_json(systemsSheet);
                
                // Create a map of system names to IDs for later reference
                const systemMap = new Map<string, string>();
                
                for (let i = 1; i < systems.length; i++) {
                  const system = systems[i] as any;
                  if (system.name && system.project_name) {
                    const projectId = projectMap.get(system.project_name);
                    if (projectId) {
                      try {
                        const newSystem = await createSystem({
                          name: system.name,
                          project_id: projectId,
                          completion_rate: system.completion_rate || 0
                        });
                        systemMap.set(system.name, newSystem.id);
                        stats.systems++;
                      } catch (err) {
                        console.error('Error importing system:', system.name, err);
                      }
                    }
                  }
                }
                
                // Process Subsystems sheet
                if (workbook.SheetNames.includes('Subsystems')) {
                  const subsystemsSheet = workbook.Sheets['Subsystems'];
                  const subsystems = XLSX.utils.sheet_to_json(subsystemsSheet);
                  
                  // Create a map of subsystem names to IDs for later reference
                  const subsystemMap = new Map<string, string>();
                  
                  for (let i = 1; i < subsystems.length; i++) {
                    const subsystem = subsystems[i] as any;
                    if (subsystem.name && subsystem.system_name) {
                      const systemId = systemMap.get(subsystem.system_name);
                      if (systemId) {
                        try {
                          const newSubsystem = await createSubsystem({
                            name: subsystem.name,
                            system_id: systemId,
                            completion_rate: subsystem.completion_rate || 0
                          });
                          subsystemMap.set(subsystem.name, newSubsystem.id);
                          stats.subsystems++;
                        } catch (err) {
                          console.error('Error importing subsystem:', subsystem.name, err);
                        }
                      }
                    }
                  }
                  
                  // Process Tasks sheet
                  if (workbook.SheetNames.includes('Tasks')) {
                    const tasksSheet = workbook.Sheets['Tasks'];
                    const tasks = XLSX.utils.sheet_to_json(tasksSheet);
                    
                    for (let i = 1; i < tasks.length; i++) {
                      const task = tasks[i] as any;
                      if (task.name && task.subsystem_name) {
                        const subsystemId = subsystemMap.get(task.subsystem_name);
                        if (subsystemId) {
                          try {
                            await createTask({
                              name: task.name,
                              description: task.description || null,
                              subsystem_id: subsystemId,
                              status: task.status || 'pending'
                            });
                            stats.tasks++;
                          } catch (err) {
                            console.error('Error importing task:', task.name, err);
                          }
                        }
                      }
                    }
                  }
                  
                  // Process ITRs sheet
                  if (workbook.SheetNames.includes('ITRs')) {
                    const itrsSheet = workbook.Sheets['ITRs'];
                    const itrs = XLSX.utils.sheet_to_json(itrsSheet);
                    
                    for (let i = 1; i < itrs.length; i++) {
                      const itr = itrs[i] as any;
                      if (itr.name && itr.subsystem_name) {
                        const subsystemId = subsystemMap.get(itr.subsystem_name);
                        if (subsystemId) {
                          try {
                            await createITR({
                              name: itr.name,
                              subsystem_id: subsystemId,
                              status: itr.status || 'inprogress',
                              progress: itr.progress || 0,
                              due_date: itr.due_date || null,
                              assigned_to: itr.assigned_to || null
                            });
                            stats.itrs++;
                          } catch (err) {
                            console.error('Error importing ITR:', itr.name, err);
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          
          // Process Users sheet separately
          if (workbook.SheetNames.includes('Users')) {
            const usersSheet = workbook.Sheets['Users'];
            const users = XLSX.utils.sheet_to_json(usersSheet);
            
            if (users.length > 1) {
              const usersList = [];
              
              for (let i = 1; i < users.length; i++) {
                const user = users[i] as any;
                if (user.email && user.full_name) {
                  usersList.push({
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role || 'user'
                  });
                }
              }
              
              if (usersList.length > 0) {
                const createdUsersCount = await bulkCreateUsers(usersList);
                stats.users = createdUsersCount;
              }
            }
          }
          
          // Set import stats for display
          setImportStats(stats);
          
          // Show success message
          toast({
            title: "Importación completada",
            description: `Se han importado: ${stats.projects} proyectos, ${stats.systems} sistemas, ${stats.subsystems} subsistemas, ${stats.tasks} tareas, ${stats.itrs} ITRs, ${stats.users} usuarios.`,
          });
          
        } catch (err) {
          console.error("Error processing file:", err);
          setError("Error al procesar el archivo. Verifica que tenga el formato correcto.");
        } finally {
          setImporting(false);
        }
      };
      
      reader.onerror = () => {
        setError("Error al leer el archivo. Inténtalo de nuevo.");
        setImporting(false);
      };
      
      reader.readAsArrayBuffer(file);
      
    } catch (err) {
      console.error("Error during import:", err);
      setError("Ocurrió un error durante la importación. Inténtalo de nuevo.");
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
