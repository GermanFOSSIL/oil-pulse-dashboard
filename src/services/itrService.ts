
import { getITRs, getSubsystems, getSystemsByProjectId, ITR, Subsystem, System } from "@/services/supabaseService";
import { ITRWithDetails } from "@/types/itr-types";
import { createITR } from "@/services/itrDataService";
import { supabase } from "@/integrations/supabase/client";
import { getTestPacksByITR } from "@/services/testPackService";

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
      
      // Get test packs status for each ITR
      const enrichedITRsPromises = itrsData
        .filter(itr => {
          return filteredSubsystems.some(sub => sub.id === itr.subsystem_id);
        })
        .map(async (itr) => {
          const relatedSubsystem = subsystemsData.find(sub => sub.id === itr.subsystem_id);
          const relatedSystem = systemsData.find(sys => sys.id === relatedSubsystem?.system_id);
          
          // Check if this ITR has associated test packs and their status
          const testPacks = await getTestPacksByITR(itr.name);
          const allTestPacksComplete = testPacks.length > 0 && testPacks.every(tp => tp.estado === 'listo');
          
          // If all test packs are complete, update ITR status to complete
          if (allTestPacksComplete && itr.status !== 'complete') {
            try {
              await supabase
                .from('itrs')
                .update({
                  status: 'complete',
                  progress: 100,
                  updated_at: new Date().toISOString()
                })
                .eq('id', itr.id);
              
              itr.status = 'complete';
              itr.progress = 100;
            } catch (err) {
              console.error(`Error updating ITR ${itr.id} status:`, err);
            }
          }
          
          return {
            ...itr,
            subsystemName: relatedSubsystem?.name || 'Subsistema Desconocido',
            systemName: relatedSystem?.name || 'Sistema Desconocido',
            projectName: selectedProjectId ? 'Proyecto actual' : 'Desconocido'
          };
        });
      
      const enrichedITRs = await Promise.all(enrichedITRsPromises);
      console.log(`Enriched ITRs for this project: ${enrichedITRs.length}`);
      return enrichedITRs;
    } else {
      const itrsData = await getITRs();
      console.log(`Total ITRs in the database: ${itrsData.length}`);
      
      // Get test packs status for each ITR
      const enrichedITRsPromises = itrsData.map(async (itr) => {
        const relatedSubsystem = subsystemsData.find(sub => sub.id === itr.subsystem_id);
        
        // Check if this ITR has associated test packs and their status
        const testPacks = await getTestPacksByITR(itr.name);
        const allTestPacksComplete = testPacks.length > 0 && testPacks.every(tp => tp.estado === 'listo');
        
        // If all test packs are complete, update ITR status to complete
        if (allTestPacksComplete && itr.status !== 'complete') {
          try {
            await supabase
              .from('itrs')
              .update({
                status: 'complete',
                progress: 100,
                updated_at: new Date().toISOString()
              })
              .eq('id', itr.id);
            
            itr.status = 'complete';
            itr.progress = 100;
          } catch (err) {
            console.error(`Error updating ITR ${itr.id} status:`, err);
          }
        }
        
        return {
          ...itr,
          subsystemName: relatedSubsystem?.name || 'Subsistema Desconocido',
          systemName: 'No filtrado por proyecto'
        };
      });
      
      const enrichedITRs = await Promise.all(enrichedITRsPromises);
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

// Update ITR status based on test packs status
export const updateITRStatusBasedOnTestPacks = async (itrName: string): Promise<boolean> => {
  try {
    console.log(`Updating ITR status for: ${itrName}`);
    
    // Get the ITR
    const { data: itrData, error: itrError } = await supabase
      .from('itrs')
      .select('id, status, progress')
      .eq('name', itrName)
      .single();
      
    if (itrError || !itrData) {
      console.error(`Error fetching ITR with name ${itrName}:`, itrError);
      return false;
    }
    
    // Get all test packs for this ITR
    const testPacks = await getTestPacksByITR(itrName);
    
    // Check if there are any test packs and if they are all complete
    const allTestPacksComplete = testPacks.length > 0 && testPacks.every(tp => tp.estado === 'listo');
    
    // If all test packs are complete and the ITR is not already complete, update its status
    if (allTestPacksComplete && itrData.status !== 'complete') {
      const { error: updateError } = await supabase
        .from('itrs')
        .update({
          status: 'complete',
          progress: 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', itrData.id);
        
      if (updateError) {
        console.error(`Error updating ITR ${itrData.id} status:`, updateError);
        return false;
      }
      
      console.log(`ITR ${itrName} status updated to 'complete'`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error in updateITRStatusBasedOnTestPacks for ${itrName}:`, error);
    return false;
  }
};
