
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

// Define interfaces para los datos
export interface TestPack {
  id: string;
  sistema: string;
  subsistema: string;
  nombre_paquete: string;
  itr_asociado: string;
  estado: 'pendiente' | 'listo';
  progress?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Tag {
  id: string;
  test_pack_id: string;
  tag_name: string;
  estado: 'pendiente' | 'liberado';
  fecha_liberacion?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AccionLog {
  id: string;
  user_id: string;
  user_name: string;
  tag_id: string;
  tag_name: string;
  accion: string;
  fecha: string;
}

export interface TestPackStats {
  totalTestPacks: number;
  completedTestPacks: number;
  pendingTestPacks: number;
  totalTags: number;
  completedTags: number;
  pendingTags: number;
  completionPercentage: number;
  bySystem: SystemStats[];
}

export interface SystemStats {
  sistema: string;
  total: number;
  completados: number;
  pendientes: number;
  porcentaje: number;
}

// Obtener todos los test packs
export const getTestPacks = async (): Promise<TestPack[]> => {
  try {
    const { data, error } = await supabase
      .from('test_packs')
      .select('*');

    if (error) throw error;

    // Calcular el progreso para cada test pack
    for (const testPack of data) {
      const { data: tags, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .eq('test_pack_id', testPack.id);

      if (tagsError) throw tagsError;

      if (tags && tags.length > 0) {
        const completedTags = tags.filter(tag => tag.estado === 'liberado').length;
        testPack.progress = Math.round((completedTags / tags.length) * 100);
      } else {
        testPack.progress = 0;
      }
    }

    return data as TestPack[];
  } catch (error) {
    console.error('Error fetching test packs:', error);
    throw error;
  }
};

// Crear un nuevo test pack
export const createTestPack = async (testPackData: Omit<TestPack, 'id' | 'created_at' | 'updated_at'>): Promise<TestPack> => {
  try {
    const { data, error } = await supabase
      .from('test_packs')
      .insert({
        ...testPackData,
        id: uuidv4(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as TestPack;
  } catch (error) {
    console.error('Error creating test pack:', error);
    throw error;
  }
};

// Obtener un test pack específico con sus tags
export const getTestPackWithTags = async (testPackId: string): Promise<TestPack & { tags: Tag[] }> => {
  try {
    const { data: testPack, error: testPackError } = await supabase
      .from('test_packs')
      .select('*')
      .eq('id', testPackId)
      .single();

    if (testPackError) throw testPackError;

    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .eq('test_pack_id', testPackId)
      .order('tag_name', { ascending: true });

    if (tagsError) throw tagsError;

    // Calcular el progreso
    const completedTags = tags ? tags.filter(tag => tag.estado === 'liberado').length : 0;
    const totalTags = tags ? tags.length : 0;
    const progress = totalTags > 0 ? Math.round((completedTags / totalTags) * 100) : 0;

    return {
      ...testPack as TestPack,
      tags: tags as Tag[],
      progress
    };
  } catch (error) {
    console.error('Error fetching test pack with tags:', error);
    throw error;
  }
};

// Actualizar un tag
export const updateTag = async (tagId: string, updates: Partial<Tag>): Promise<Tag> => {
  try {
    // Obtener información del tag para registro
    const { data: tagData, error: tagError } = await supabase
      .from('tags')
      .select('*')
      .eq('id', tagId)
      .single();

    if (tagError) throw tagError;

    // Actualizar el tag
    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', tagId)
      .select()
      .single();

    if (error) throw error;

    // Registrar la acción en el log
    if (updates.estado === 'liberado') {
      await supabase
        .from('acciones_log')
        .insert({
          usuario_id: 'sistema', // Esto debería reemplazarse con el ID del usuario actual
          tag_id: tagId,
          accion: 'liberó',
          tag_name: (tagData as Tag).tag_name
        });
    }

    return data as Tag;
  } catch (error) {
    console.error('Error updating tag:', error);
    throw error;
  }
};

// Obtener logs de acciones
export const getActionLogs = async (): Promise<AccionLog[]> => {
  try {
    const { data, error } = await supabase
      .from('acciones_log')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Obtener nombres de usuarios
    const userIds = [...new Set(data.map(log => log.usuario_id))];
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    if (usersError) throw usersError;

    // Obtener nombres de tags
    const tagIds = [...new Set(data.map(log => log.tag_id))];
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('id, tag_name');

    if (tagsError) throw tagsError;

    // Combinar datos
    const enrichedLogs = data.map(log => {
      const user = users?.find(u => u.id === log.usuario_id);
      const tag = tags?.find(t => t.id === log.tag_id);
      
      return {
        ...log,
        user_name: user?.full_name || 'Sistema',
        tag_name: tag?.tag_name || 'TAG Desconocido'
      };
    });

    return enrichedLogs as AccionLog[];
  } catch (error) {
    console.error('Error fetching action logs:', error);
    throw error;
  }
};

// Importar test packs y tags desde Excel
export const importFromExcel = async (excelBuffer: ArrayBuffer): Promise<{ testPacks: number, tags: number }> => {
  try {
    const workbook = XLSX.read(excelBuffer, { type: 'array' });
    const testPacksSheet = workbook.Sheets[workbook.SheetNames[0]];
    const tagsSheet = workbook.Sheets[workbook.SheetNames[1]];
    
    const testPacksData = XLSX.utils.sheet_to_json(testPacksSheet) as any[];
    const tagsData = XLSX.utils.sheet_to_json(tagsSheet) as any[];
    
    // Procesar test packs
    for (const tp of testPacksData) {
      // Verificar si ya existe
      const { data: existingTp, error: checkError } = await supabase
        .from('test_packs')
        .select('id')
        .eq('sistema', tp.sistema)
        .eq('subsistema', tp.subsistema)
        .eq('nombre_paquete', tp.nombre_paquete)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (!existingTp) {
        const testPackId = uuidv4();
        await supabase
          .from('test_packs')
          .insert({
            id: testPackId,
            sistema: tp.sistema,
            subsistema: tp.subsistema,
            nombre_paquete: tp.nombre_paquete,
            itr_asociado: tp.itr_asociado || '',
            estado: tp.estado || 'pendiente'
          });
      }
    }
    
    // Procesar tags
    for (const tag of tagsData) {
      // Buscar el test pack asociado
      const { data: relatedTp, error: tpError } = await supabase
        .from('test_packs')
        .select('id')
        .eq('sistema', tag.sistema)
        .eq('subsistema', tag.subsistema)
        .eq('nombre_paquete', tag.nombre_paquete)
        .single();
      
      if (tpError) continue; // Ignorar tags sin test pack
      
      // Verificar si ya existe el tag
      const { data: existingTag, error: tagCheckError } = await supabase
        .from('tags')
        .select('id')
        .eq('test_pack_id', relatedTp.id)
        .eq('tag_name', tag.tag_name)
        .single();
      
      if (tagCheckError && tagCheckError.code !== 'PGRST116') {
        throw tagCheckError;
      }
      
      if (!existingTag) {
        await supabase
          .from('tags')
          .insert({
            id: uuidv4(),
            test_pack_id: relatedTp.id,
            tag_name: tag.tag_name,
            estado: tag.estado || 'pendiente',
            fecha_liberacion: tag.fecha_liberacion || null
          });
      }
    }
    
    return {
      testPacks: testPacksData.length,
      tags: tagsData.length
    };
  } catch (error) {
    console.error('Error importing from Excel:', error);
    throw error;
  }
};

// Generar plantilla de importación
export const generateImportTemplate = (): ArrayBuffer => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Hoja para Test Packs
    const testPacksData = [
      {
        sistema: 'Sistema Ejemplo',
        subsistema: 'Subsistema Ejemplo',
        nombre_paquete: 'TP-001',
        itr_asociado: 'ITR-001',
        estado: 'pendiente'
      }
    ];
    
    const testPacksSheet = XLSX.utils.json_to_sheet(testPacksData);
    XLSX.utils.book_append_sheet(workbook, testPacksSheet, 'Test Packs');
    
    // Hoja para TAGs
    const tagsData = [
      {
        sistema: 'Sistema Ejemplo',
        subsistema: 'Subsistema Ejemplo',
        nombre_paquete: 'TP-001',
        tag_name: 'TAG-001',
        estado: 'pendiente'
      }
    ];
    
    const tagsSheet = XLSX.utils.json_to_sheet(tagsData);
    XLSX.utils.book_append_sheet(workbook, tagsSheet, 'TAGs');
    
    // Convertir a buffer
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  } catch (error) {
    console.error('Error generating import template:', error);
    throw error;
  }
};

// Exportar datos a Excel
export const exportToExcel = async (): Promise<ArrayBuffer> => {
  try {
    // Obtener todos los test packs
    const { data: testPacks, error: tpError } = await supabase
      .from('test_packs')
      .select('*');
    
    if (tpError) throw tpError;
    
    // Obtener todos los tags
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*');
    
    if (tagsError) throw tagsError;
    
    // Preparar datos para Excel
    const testPacksData = testPacks.map(tp => ({
      ID: tp.id,
      Sistema: tp.sistema,
      Subsistema: tp.subsistema,
      'Nombre Paquete': tp.nombre_paquete,
      'ITR Asociado': tp.itr_asociado,
      Estado: tp.estado,
      'Fecha Creación': tp.created_at
    }));
    
    const tagsData = tags.map(tag => {
      const relatedTp = testPacks.find(tp => tp.id === tag.test_pack_id);
      return {
        ID: tag.id,
        'ID Test Pack': tag.test_pack_id,
        Sistema: relatedTp?.sistema || '',
        Subsistema: relatedTp?.subsistema || '',
        'Nombre Paquete': relatedTp?.nombre_paquete || '',
        TAG: tag.tag_name,
        Estado: tag.estado,
        'Fecha Liberación': tag.fecha_liberacion || ''
      };
    });
    
    // Crear libro Excel
    const workbook = XLSX.utils.book_new();
    
    // Añadir hojas
    const testPacksSheet = XLSX.utils.json_to_sheet(testPacksData);
    XLSX.utils.book_append_sheet(workbook, testPacksSheet, 'Test Packs');
    
    const tagsSheet = XLSX.utils.json_to_sheet(tagsData);
    XLSX.utils.book_append_sheet(workbook, tagsSheet, 'TAGs');
    
    // Convertir a buffer
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

// Obtener estadísticas de test packs
export const getTestPacksStats = async (): Promise<TestPackStats> => {
  try {
    // Obtener todos los test packs
    const { data: testPacks, error: tpError } = await supabase
      .from('test_packs')
      .select('*');
    
    if (tpError) throw tpError;
    
    // Obtener todos los tags
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*');
    
    if (tagsError) throw tagsError;
    
    // Calcular estadísticas totales
    const totalTestPacks = testPacks.length;
    const completedTestPacks = testPacks.filter(tp => tp.estado === 'listo').length;
    const pendingTestPacks = totalTestPacks - completedTestPacks;
    
    const totalTags = tags.length;
    const completedTags = tags.filter(tag => tag.estado === 'liberado').length;
    const pendingTags = totalTags - completedTags;
    
    const completionPercentage = totalTags > 0 
      ? Math.round((completedTags / totalTags) * 100) 
      : 0;
    
    // Calcular estadísticas por sistema
    const systems = [...new Set(testPacks.map(tp => tp.sistema))];
    
    const bySystem = systems.map(sistema => {
      const systemTestPacks = testPacks.filter(tp => tp.sistema === sistema);
      const systemTestPackIds = systemTestPacks.map(tp => tp.id);
      const systemTags = tags.filter(tag => systemTestPackIds.includes(tag.test_pack_id));
      
      const total = systemTags.length;
      const completados = systemTags.filter(tag => tag.estado === 'liberado').length;
      const pendientes = total - completados;
      const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;
      
      return {
        sistema,
        total,
        completados,
        pendientes,
        porcentaje
      };
    });
    
    return {
      totalTestPacks,
      completedTestPacks,
      pendingTestPacks,
      totalTags,
      completedTags,
      pendingTags,
      completionPercentage,
      bySystem
    };
  } catch (error) {
    console.error('Error getting test packs stats:', error);
    throw error;
  }
};
