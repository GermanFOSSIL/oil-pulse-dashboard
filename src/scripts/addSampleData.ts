
import { supabase } from "@/integrations/supabase/client";

// This script is for adding sample data to the database
export const addSampleITRs = async () => {
  try {
    // First, make sure we have a project
    const { data: existingProjects, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .limit(1);

    if (projectError) throw projectError;

    let projectId: string;

    // If no projects exist, create one
    if (!existingProjects || existingProjects.length === 0) {
      const { data: newProject, error: createProjectError } = await supabase
        .from('projects')
        .insert({
          name: 'Proyecto Demo LACA 32',
          location: 'Ciudad Demo',
          status: 'inprogress',
          progress: 45
        })
        .select()
        .single();

      if (createProjectError) throw createProjectError;
      projectId = newProject.id;
    } else {
      projectId = existingProjects[0].id;
    }

    // Create multiple systems for the project
    const systemsToCreate = [
      { name: 'Sistema Eléctrico', project_id: projectId, completion_rate: 50 },
      { name: 'Sistema Mecánico', project_id: projectId, completion_rate: 35 },
      { name: 'Sistema de Control', project_id: projectId, completion_rate: 60 }
    ];
    
    const { data: systems, error: systemsError } = await supabase
      .from('systems')
      .insert(systemsToCreate)
      .select();

    if (systemsError) throw systemsError;

    // Create a few subsystems for each system
    const subsystemsToCreate = [
      // Sistema Eléctrico
      { name: 'Subsistema Iluminación', system_id: systems[0].id, completion_rate: 70 },
      { name: 'Subsistema Potencia', system_id: systems[0].id, completion_rate: 40 },
      { name: 'Subsistema Control', system_id: systems[0].id, completion_rate: 30 },
      
      // Sistema Mecánico
      { name: 'Subsistema Bombeo', system_id: systems[1].id, completion_rate: 25 },
      { name: 'Subsistema Válvulas', system_id: systems[1].id, completion_rate: 40 },
      
      // Sistema de Control
      { name: 'Subsistema PLC', system_id: systems[2].id, completion_rate: 80 },
      { name: 'Subsistema HMI', system_id: systems[2].id, completion_rate: 55 },
      { name: 'Subsistema Instrumentación', system_id: systems[2].id, completion_rate: 45 }
    ];

    const { data: subsystems, error: subsystemError } = await supabase
      .from('subsystems')
      .insert(subsystemsToCreate)
      .select();

    if (subsystemError) throw subsystemError;

    // Current date for reference
    const now = new Date();
    
    // Create sample ITRs for each subsystem with varying statuses and dates
    const itrsToCreate = [
      // Sistema Eléctrico - Subsistema Iluminación
      {
        name: 'ITR-E001: Prueba de iluminación exterior',
        subsystem_id: subsystems[0].id,
        status: 'complete',
        progress: 100,
        due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 15).toISOString()
      },
      {
        name: 'ITR-E002: Verificación de circuitos de iluminación',
        subsystem_id: subsystems[0].id,
        status: 'inprogress',
        progress: 65,
        due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10).toISOString()
      },
      
      // Sistema Eléctrico - Subsistema Potencia
      {
        name: 'ITR-E003: Prueba de transformadores',
        subsystem_id: subsystems[1].id,
        status: 'delayed',
        progress: 30,
        due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3).toISOString()
      },
      {
        name: 'ITR-E004: Verificación de bancos de capacitores',
        subsystem_id: subsystems[1].id,
        status: 'inprogress',
        progress: 25,
        due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30).toISOString()
      },
      
      // Sistema Eléctrico - Subsistema Control
      {
        name: 'ITR-E005: Prueba de protecciones eléctricas',
        subsystem_id: subsystems[2].id,
        status: 'inprogress',
        progress: 15,
        due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 21).toISOString()
      },
      
      // Sistema Mecánico - Subsistema Bombeo
      {
        name: 'ITR-M001: Prueba hidrostática de bombas',
        subsystem_id: subsystems[3].id,
        status: 'delayed',
        progress: 20,
        due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5).toISOString()
      },
      
      // Sistema Mecánico - Subsistema Válvulas
      {
        name: 'ITR-M002: Inspección de válvulas de seguridad',
        subsystem_id: subsystems[4].id,
        status: 'complete',
        progress: 100,
        due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10).toISOString()
      },
      {
        name: 'ITR-M003: Prueba de actuadores neumáticos',
        subsystem_id: subsystems[4].id,
        status: 'inprogress',
        progress: 45,
        due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15).toISOString()
      },
      
      // Sistema de Control - Subsistema PLC
      {
        name: 'ITR-C001: Verificación de entradas/salidas PLC',
        subsystem_id: subsystems[5].id,
        status: 'complete',
        progress: 100,
        due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 20).toISOString()
      },
      
      // Sistema de Control - Subsistema HMI
      {
        name: 'ITR-C002: Prueba de funcionalidad HMI',
        subsystem_id: subsystems[6].id,
        status: 'inprogress',
        progress: 55,
        due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString()
      },
      
      // Sistema de Control - Subsistema Instrumentación
      {
        name: 'ITR-C003: Calibración de sensores de presión',
        subsystem_id: subsystems[7].id,
        status: 'delayed',
        progress: 40,
        due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2).toISOString()
      },
      {
        name: 'ITR-C004: Verificación de transmisores de nivel',
        subsystem_id: subsystems[7].id,
        status: 'inprogress',
        progress: 70,
        due_date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 25).toISOString()
      }
    ];

    const { data: itrs, error: itrError } = await supabase
      .from('itrs')
      .insert(itrsToCreate)
      .select();

    if (itrError) throw itrError;

    return {
      success: true,
      message: 'Datos de muestra añadidos correctamente',
      data: {
        project: { id: projectId },
        systems,
        subsystems,
        itrs
      }
    };
  } catch (error) {
    console.error('Error adding sample data:', error);
    return {
      success: false,
      message: 'Error al añadir datos de muestra',
      error
    };
  }
};
