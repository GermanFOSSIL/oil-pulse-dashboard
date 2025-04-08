
import { getITRs, getSubsystems, getSystemsByProjectId, ITR, Subsystem, System } from "@/services/supabaseService";
import { ITRWithDetails } from "@/types/itr-types";
import { createITR } from "@/services/itrDataService";
import { supabase } from "@/integrations/supabase/client";
import { ITRWithSystem } from "@/services/types";

export const fetchITRsWithDetails = async (selectedProjectId: string | null): Promise<ITRWithDetails[]> => {
  try {
    console.log(`Fetching ITRs with details for project: ${selectedProjectId || 'todos'}`);
    
    const subsystemsData = await getSubsystems();
    console.log(`Total subsystems in the database: ${subsystemsData.length}`);
    
    if (selectedProjectId) {
      const systemsData = await getSystemsByProjectId(selectedProjectId);
      console.log(`Systems for project ${selectedProjectId}: ${systemsData.length}`);
      
      const systemIds = systemsData.map(system => system.id);
      const filteredSubsystems = subsystemsData.filter(
        subsystem => systemIds.includes(subsystem.system_id)
      );
      console.log(`Filtered subsystems for this project: ${filteredSubsystems.length}`);
      
      const itrsData = await getITRs();
      console.log(`Total ITRs in the database: ${itrsData.length}`);
      
      const enrichedITRs = itrsData
        .filter(itr => {
          return filteredSubsystems.some(sub => sub.id === itr.subsystem_id);
        })
        .map(itr => {
          const relatedSubsystem = subsystemsData.find(sub => sub.id === itr.subsystem_id);
          const relatedSystem = systemsData.find(sys => sys.id === relatedSubsystem?.system_id);
          
          return {
            ...itr,
            subsystemName: relatedSubsystem?.name || 'Subsistema Desconocido',
            systemName: relatedSystem?.name || 'Sistema Desconocido',
            projectName: selectedProjectId ? 'Proyecto actual' : 'Desconocido'
          };
        });
      
      console.log(`Enriched ITRs for this project: ${enrichedITRs.length}`);
      return enrichedITRs;
    } else {
      const itrsData = await getITRs();
      console.log(`Total ITRs in the database: ${itrsData.length}`);
      
      const enrichedITRs = itrsData.map(itr => {
        const relatedSubsystem = subsystemsData.find(sub => sub.id === itr.subsystem_id);
        
        return {
          ...itr,
          subsystemName: relatedSubsystem?.name || 'Subsistema Desconocido',
          systemName: 'No filtrado por proyecto'
        };
      });
      
      console.log(`Enriched ITRs (all projects): ${enrichedITRs.length}`);
      return enrichedITRs;
    }
  } catch (error) {
    console.error("Error fetching ITRs with details:", error);
    throw error;
  }
};

export const createTestITRs = async (): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    console.log("Iniciando creación de ITRs de prueba...");
    
    // Obtener subsistemas disponibles
    const subsystems = await getSubsystems();
    console.log(`Subsistemas encontrados: ${subsystems.length}`);
    
    if (subsystems.length === 0) {
      console.error("No hay subsistemas disponibles para crear ITRs de prueba");
      return { success: false, message: "No hay subsistemas disponibles" };
    }
    
    // Usar el primer subsistema para las pruebas
    const subsystemId = subsystems[0].id;
    console.log(`Usando subsistema con ID: ${subsystemId}`);
    
    // Verificar que el subsistema existe realmente en la base de datos
    const { data: subsystemCheck, error: subsystemError } = await supabase
      .from('subsystems')
      .select('id, name')
      .eq('id', subsystemId)
      .single();
      
    if (subsystemError || !subsystemCheck) {
      console.error("Error al verificar el subsistema:", subsystemError);
      return { success: false, message: "Error al verificar el subsistema" };
    }
    
    console.log(`Subsistema confirmado: ${subsystemCheck.name}`);
    
    // Crear 4 ITRs de prueba
    const itrPromises = [];
    const createdITRs = [];
    
    for (let i = 1; i <= 4; i++) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 14); // Fecha fin 14 días después
      
      const status = i % 3 === 0 
        ? "delayed" as const 
        : i % 2 === 0 
          ? "complete" as const 
          : "inprogress" as const;
      
      const itrData = {
        name: `ITR Test ${i}`,
        subsystem_id: subsystemId,
        status: status,
        progress: i * 25, // 25, 50, 75, 100
        assigned_to: `Técnico ${i}`,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        quantity: i  // Agregar la cantidad basada en el índice
      };
      
      console.log(`Creando ITR ${i}:`, itrData);
      
      try {
        const newITR = await createITR(itrData);
        console.log(`ITR ${i} creado con éxito:`, newITR);
        createdITRs.push(newITR);
      } catch (err) {
        console.error(`Error al crear ITR ${i}:`, err);
      }
    }
    
    console.log(`Se crearon ${createdITRs.length} ITRs de prueba correctamente`);
    
    // Verificar que los ITRs se crearon correctamente
    const { data: verifyITRs, error: verifyError } = await supabase
      .from('itrs')
      .select('*')
      .eq('subsystem_id', subsystemId)
      .order('created_at', { ascending: false })
      .limit(4);
      
    if (verifyError) {
      console.error("Error al verificar ITRs creados:", verifyError);
    } else {
      console.log(`Verificación: Se encontraron ${verifyITRs.length} ITRs recientes para el subsistema`);
    }
    
    return { 
      success: true, 
      message: `${createdITRs.length} ITRs de prueba creados correctamente`, 
      data: createdITRs 
    };
  } catch (error) {
    console.error("Error al crear ITRs de prueba:", error);
    return { 
      success: false, 
      message: `Error al crear ITRs de prueba: ${error instanceof Error ? error.message : error}`, 
    };
  }
};

// New function to fetch all ITRs with system and project info
export const fetchAllITRsWithSystemInfo = async (): Promise<ITRWithSystem[]> => {
  try {
    console.log("Fetching all ITRs with system information");
    
    // Fetch all required data
    const { data: itrs, error: itrsError } = await supabase
      .from('itrs')
      .select('*');
      
    if (itrsError) {
      throw itrsError;
    }
    
    const { data: subsystems, error: subsystemsError } = await supabase
      .from('subsystems')
      .select('*, systems(*, projects(*))');
      
    if (subsystemsError) {
      throw subsystemsError;
    }
    
    // Enrich ITRs with system and project information
    const enrichedITRs = itrs.map(itr => {
      const relatedSubsystem = subsystems.find(sub => sub.id === itr.subsystem_id);
      
      return {
        ...itr,
        subsystemName: relatedSubsystem?.name || 'Subsistema Desconocido',
        systemName: relatedSubsystem?.systems?.name || 'Sistema Desconocido',
        projectName: relatedSubsystem?.systems?.projects?.name || 'Proyecto Desconocido',
        selected: false
      } as ITRWithSystem;
    });
    
    console.log(`Fetched ${enrichedITRs.length} ITRs with system info`);
    return enrichedITRs;
  } catch (error) {
    console.error("Error fetching ITRs with system info:", error);
    throw error;
  }
};

// Function to clone selected ITRs to target subsystems
export const cloneITRsToSubsystems = async (
  selectedITRs: ITRWithSystem[],
  targetSubsystemIds: string[]
): Promise<{ success: boolean; count: number; message: string }> => {
  try {
    if (!selectedITRs.length || !targetSubsystemIds.length) {
      return { 
        success: false, 
        count: 0, 
        message: "No se seleccionaron ITRs o subsistemas destino" 
      };
    }
    
    console.log(`Clonando ${selectedITRs.length} ITRs a ${targetSubsystemIds.length} subsistemas`);
    
    const clonePromises = [];
    
    // For each ITR and each target subsystem, create a clone
    for (const itr of selectedITRs) {
      for (const subsystemId of targetSubsystemIds) {
        // Skip if we're trying to clone to the same subsystem
        if (itr.subsystem_id === subsystemId) {
          console.log(`Saltando clonación del ITR ${itr.id} al mismo subsistema ${subsystemId}`);
          continue;
        }
        
        // Prepare data for the new ITR
        const newITRData = {
          name: itr.name,
          subsystem_id: subsystemId,
          status: itr.status,
          progress: itr.progress,
          start_date: itr.start_date,
          end_date: itr.end_date,
          assigned_to: itr.assigned_to,
          quantity: itr.quantity
        };
        
        // Create the cloned ITR
        clonePromises.push(createITR(newITRData));
      }
    }
    
    const results = await Promise.allSettled(clonePromises);
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    return {
      success: succeeded > 0,
      count: succeeded,
      message: `Se clonaron ${succeeded} ITRs con éxito${failed > 0 ? `, ${failed} fallaron` : ''}`
    };
  } catch (error) {
    console.error("Error cloning ITRs:", error);
    return {
      success: false,
      count: 0,
      message: `Error al clonar ITRs: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
