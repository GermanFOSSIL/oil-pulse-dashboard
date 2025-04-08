
import { createITR, getSubsystems } from "@/services/supabaseService";
import { supabase } from "@/integrations/supabase/client";

export const createTestITRs = async () => {
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
    
    for (let i = 1; i <= 4; i++) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 14); // Fecha fin 14 días después
      
      const itrData = {
        name: `ITR Test ${i}`,
        subsystem_id: subsystemId,
        status: i % 3 === 0 ? "delayed" : i % 2 === 0 ? "complete" : "inprogress",
        progress: i * 25, // 25, 50, 75, 100
        assigned_to: `Técnico ${i}`,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      };
      
      console.log(`Creando ITR ${i}:`, itrData);
      itrPromises.push(createITR(itrData));
    }
    
    const results = await Promise.all(itrPromises);
    console.log("ITRs de prueba creados:", results);
    
    // Verificar que los ITRs se crearon correctamente
    const { data: createdITRs, error: verifyError } = await supabase
      .from('itrs')
      .select('*')
      .eq('subsystem_id', subsystemId)
      .order('created_at', { ascending: false })
      .limit(4);
      
    if (verifyError) {
      console.error("Error al verificar ITRs creados:", verifyError);
    } else {
      console.log(`Verificación: Se encontraron ${createdITRs.length} ITRs recientes para el subsistema`);
    }
    
    return { 
      success: true, 
      message: "4 ITRs de prueba creados correctamente", 
      data: results 
    };
  } catch (error) {
    console.error("Error al crear ITRs de prueba:", error);
    return { 
      success: false, 
      message: `Error al crear ITRs de prueba: ${error}`, 
    };
  }
};
