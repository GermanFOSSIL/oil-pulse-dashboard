
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
          name: 'Proyecto Demo',
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

    // Create a system for the project
    const { data: newSystem, error: systemError } = await supabase
      .from('systems')
      .insert({
        name: 'Sistema Eléctrico',
        project_id: projectId,
        completion_rate: 50
      })
      .select()
      .single();

    if (systemError) throw systemError;

    // Create a few subsystems
    const subsystemsToCreate = [
      { name: 'Subsistema Iluminación', system_id: newSystem.id, completion_rate: 60 },
      { name: 'Subsistema Potencia', system_id: newSystem.id, completion_rate: 40 },
      { name: 'Subsistema Control', system_id: newSystem.id, completion_rate: 30 }
    ];

    const { data: subsystems, error: subsystemError } = await supabase
      .from('subsystems')
      .insert(subsystemsToCreate)
      .select();

    if (subsystemError) throw subsystemError;

    // Create sample ITRs for each subsystem
    const itrsToCreate = [
      {
        name: 'ITR-001: Prueba de iluminación exterior',
        subsystem_id: subsystems[0].id,
        status: 'complete',
        progress: 100,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'ITR-002: Verificación de cableado',
        subsystem_id: subsystems[0].id,
        status: 'inprogress',
        progress: 65,
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'ITR-003: Prueba de cortocircuitos',
        subsystem_id: subsystems[1].id,
        status: 'delayed',
        progress: 30,
        due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'ITR-004: Verificación de protecciones',
        subsystem_id: subsystems[2].id,
        status: 'inprogress',
        progress: 15,
        due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
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
        system: newSystem,
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
