
// This file re-exports all service functions from their respective modules
// to maintain backward compatibility with existing code

// Import and re-export from userService
import { 
  AVAILABLE_PERMISSIONS, 
  getUserPermissions, 
  getUserProfiles, 
  bulkCreateUsers,
  UserProfile,
  updateUserProfile,
  createUser
} from './userService';

export { 
  AVAILABLE_PERMISSIONS, 
  getUserPermissions, 
  updateUserProfile, 
  bulkCreateUsers,
  getUserProfiles,
  createUser
};
export type { UserProfile };

// Export types separately to avoid ambiguity
export type { Project, System, Subsystem, ITR } from './types';
export type { 
  BulkUserData, 
  ReportType, 
  UserUpdateData, 
  UserCreateData, 
  PasswordChangeData,
  TestPack,
  Tag,
  AccionesLog,
  TestPackStats,
  TagStats,
  StatsData,
  DbActivityLog,
  Profile,
  Task
} from './types';

// Re-export other services
export * from './projectService';
export * from './systemService';
export * from './subsystemService';
export * from './itrDataService';
export * from './taskService';
export * from './reportService';
export * from './dashboardService';

// Import necessary Supabase client
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

// Functions required by other parts of the app but not included in refactored files
export const generateImportTemplate = async () => {
  try {
    console.log("Iniciando la generación de la plantilla de importación");
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
    console.log("Plantilla generada correctamente");
    return wbout;
  } catch (error) {
    console.error("Error generating import template:", error);
    throw error; // Lanzar el error para manejarlo en el componente
  }
};

export const importDataFromExcel = async (data: ArrayBuffer) => {
  try {
    console.log("Iniciando importación de datos desde Excel");
    if (!data) {
      console.log("No data provided for import");
      return {
        projects: 0,
        systems: 0,
        subsystems: 0,
        tasks: 0,
        itrs: 0,
        users: 0
      };
    }
    
    const wb = XLSX.read(data, { type: 'array' });
    console.log("Hojas disponibles:", wb.SheetNames);
    
    // Process Projects
    let projectsCount = 0;
    if (wb.SheetNames.includes('Proyectos')) {
      const projectsSheet = wb.Sheets['Proyectos'];
      const projectsData = XLSX.utils.sheet_to_json(projectsSheet);
      console.log(`Datos de proyectos encontrados: ${projectsData.length}`);
      
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
            
          if (!error) {
            projectsCount++;
            console.log(`Proyecto ${project.name} insertado correctamente`);
          } else {
            console.error(`Error al insertar proyecto ${project.name}:`, error);
          }
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
    let systemNameMap = new Map(); // Map to keep track of system names and their IDs
    
    if (wb.SheetNames.includes('Sistemas') && latestProjects?.length) {
      const systemsSheet = wb.Sheets['Sistemas'];
      const systemsData = XLSX.utils.sheet_to_json(systemsSheet);
      console.log(`Datos de sistemas encontrados: ${systemsData.length}`);
      
      for (const row of systemsData) {
        const system = row as any;
        if (system.name) {
          // Use the first project's ID if project_id is not specified
          const projectId = system.project_id && system.project_id !== 'ID_PROYECTO' 
            ? system.project_id 
            : latestProjects[0].id;
          
          // Check if this system name already exists for this project
          const systemKey = `${system.name}-${projectId}`;
          if (!systemNameMap.has(systemKey)) {
            const { data: systemData, error } = await supabase
              .from('systems')
              .insert({
                name: system.name,
                project_id: projectId,
                completion_rate: system.completion_rate || 0,
                start_date: system.start_date || null,
                end_date: system.end_date || null
              })
              .select();
              
            if (!error && systemData && systemData.length > 0) {
              systemsCount++;
              systemNameMap.set(systemKey, systemData[0].id); // Store the ID for this system name
              console.log(`Sistema ${system.name} insertado correctamente`);
            } else {
              console.error(`Error al insertar sistema ${system.name}:`, error);
            }
          } else {
            console.log(`Sistema ${system.name} ya existe, no se duplicará`);
          }
        }
      }
    }
    
    // Get all systems to use their IDs
    const { data: allSystems } = await supabase
      .from('systems')
      .select('*');
    
    // Create a map of system names to IDs
    const systemsMap = new Map();
    allSystems?.forEach(system => {
      systemsMap.set(system.name, system.id);
    });
    
    // Process Subsystems
    let subsystemsCount = 0;
    let subsystemNameMap = new Map(); // Map to keep track of subsystem names and their IDs
    
    if (wb.SheetNames.includes('Subsistemas') && allSystems?.length) {
      const subsystemsSheet = wb.Sheets['Subsistemas'];
      const subsystemsData = XLSX.utils.sheet_to_json(subsystemsSheet);
      console.log(`Datos de subsistemas encontrados: ${subsystemsData.length}`);
      
      for (const row of subsystemsData) {
        const subsystem = row as any;
        if (subsystem.name) {
          // Find the system ID
          let systemId;
          
          if (subsystem.system_id && subsystem.system_id !== 'ID_SISTEMA' && !subsystem.system_name) {
            // Direct system ID provided
            systemId = subsystem.system_id;
          } else if (subsystem.system_name && systemsMap.has(subsystem.system_name)) {
            // System name provided
            systemId = systemsMap.get(subsystem.system_name);
          } else {
            // Use first system as fallback
            systemId = allSystems[0].id;
          }
          
          // Check if this subsystem name already exists for this system
          const subsystemKey = `${subsystem.name}-${systemId}`;
          if (!subsystemNameMap.has(subsystemKey)) {
            const { data: subsystemData, error } = await supabase
              .from('subsystems')
              .insert({
                name: subsystem.name,
                system_id: systemId,
                completion_rate: subsystem.completion_rate || 0,
                start_date: subsystem.start_date || null,
                end_date: subsystem.end_date || null
              })
              .select();
              
            if (!error && subsystemData && subsystemData.length > 0) {
              subsystemsCount++;
              subsystemNameMap.set(subsystemKey, subsystemData[0].id); // Store the ID for this subsystem
              console.log(`Subsistema ${subsystem.name} insertado correctamente`);
            } else {
              console.error(`Error al insertar subsistema ${subsystem.name}:`, error);
            }
          } else {
            console.log(`Subsistema ${subsystem.name} ya existe para el sistema especificado, no se duplicará`);
          }
        }
      }
    }
    
    // Get all subsystems to use their IDs
    const { data: allSubsystems } = await supabase
      .from('subsystems')
      .select('*');
    
    // Create a map of subsystem names to IDs
    const subsystemsMap = new Map();
    allSubsystems?.forEach(subsystem => {
      subsystemsMap.set(subsystem.name, subsystem.id);
    });
    
    // Process ITRs
    let itrsCount = 0;
    
    if (wb.SheetNames.includes('ITRs') && allSubsystems?.length) {
      const itrsSheet = wb.Sheets['ITRs'];
      const itrsData = XLSX.utils.sheet_to_json(itrsSheet);
      console.log(`Datos de ITRs encontrados: ${itrsData.length}`);
      
      for (const row of itrsData) {
        const itr = row as any;
        if (itr.name) {
          // Find the subsystem ID
          let subsystemId;
          
          if (itr.subsystem_id && itr.subsystem_id !== 'ID_SUBSISTEMA' && !itr.subsystem_name) {
            // Direct subsystem ID provided
            subsystemId = itr.subsystem_id;
          } else if (itr.subsystem_name && subsystemsMap.has(itr.subsystem_name)) {
            // Subsystem name provided
            subsystemId = subsystemsMap.get(itr.subsystem_name);
          } else {
            // Use first subsystem as fallback
            subsystemId = allSubsystems[0].id;
          }
            
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
            
          if (!error) {
            itrsCount++;
            console.log(`ITR ${itr.name} insertado correctamente`);
          } else {
            console.error(`Error al insertar ITR ${itr.name}:`, error);
          }
        }
      }
    }
    
    const result = {
      projects: projectsCount,
      systems: systemsCount,
      subsystems: subsystemsCount,
      tasks: 0, // Tasks are not imported in this version
      itrs: itrsCount,
      users: 0  // Users are not imported in this version
    };
    
    console.log("Importación completada:", result);
    return result;
  } catch (error) {
    console.error("Error importing data from Excel:", error);
    throw error; // Lanzar error para manejo en componente
  }
};

// Temporary function for creating user profile
export const createUserProfile = async () => {
  console.log("Function not implemented: createUserProfile");
  return { id: 'temp-id', full_name: 'Nuevo Usuario', role: 'user' };
};
