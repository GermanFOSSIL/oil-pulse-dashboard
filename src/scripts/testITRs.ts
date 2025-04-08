
import { createITR, getSubsystems } from "@/services/supabaseService";

export const createTestITRs = async () => {
  try {
    // Obtener subsistemas disponibles
    const subsystems = await getSubsystems();
    
    if (subsystems.length === 0) {
      console.error("No hay subsistemas disponibles para crear ITRs de prueba");
      return { success: false, message: "No hay subsistemas disponibles" };
    }
    
    // Usar el primer subsistema para las pruebas
    const subsystemId = subsystems[0].id;
    
    // Crear 4 ITRs de prueba
    const itrPromises = [];
    
    for (let i = 1; i <= 4; i++) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 14); // Fecha fin 14 días después
      
      itrPromises.push(
        createITR({
          name: `ITR Test ${i}`,
          subsystem_id: subsystemId,
          status: i % 3 === 0 ? "delayed" : i % 2 === 0 ? "complete" : "inprogress",
          progress: i * 25, // 25, 50, 75, 100
          assigned_to: `Técnico ${i}`, // Ahora esto es un string, no un UUID
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        })
      );
    }
    
    const results = await Promise.all(itrPromises);
    console.log("ITRs de prueba creados:", results);
    
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
