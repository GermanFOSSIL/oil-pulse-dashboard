
import { supabase } from "@/integrations/supabase/client";
import { TestPack } from "../testPackService";

// Get a specific test pack with its tags
export const getTestPackWithTags = async (testPackId: string): Promise<TestPack | null> => {
  try {
    console.log(`Fetching test pack ${testPackId} with tags`);
    const { data, error } = await supabase
      .from('test_packs')
      .select(`
        *,
        tags:tags(*)
      `)
      .eq('id', testPackId)
      .single();

    if (error) {
      console.error(`Error fetching test pack ${testPackId}:`, error);
      throw error;
    }

    if (!data) {
      console.log(`No test pack found with id ${testPackId}`);
      return null;
    }

    // Get the ITR name if available
    let itrName = data.itr_asociado;
    try {
      const { data: itrData } = await supabase
        .from('itrs')
        .select('name')
        .eq('id', data.itr_asociado)
        .maybeSingle();
      
      if (itrData?.name) {
        itrName = itrData.name;
      }
    } catch (err) {
      console.log('Error fetching ITR name, using code instead:', err);
    }

    // Ensure estado property is the correct type
    const formattedTestPack: TestPack = {
      ...data,
      itr_name: itrName,
      estado: data.estado as 'pendiente' | 'listo',
      tags: data.tags ? data.tags.map((tag: any) => ({
        ...tag,
        estado: tag.estado as 'pendiente' | 'liberado'
      })) : []
    };

    // Calculate progress
    const totalTags = formattedTestPack.tags ? formattedTestPack.tags.length : 0;
    const releasedTags = formattedTestPack.tags ? formattedTestPack.tags.filter(t => t.estado === 'liberado').length : 0;
    const progress = totalTags > 0 ? Math.round((releasedTags / totalTags) * 100) : 0;
    
    return {
      ...formattedTestPack,
      progress
    };
  } catch (error) {
    console.error(`Error in getTestPackWithTags for ${testPackId}:`, error);
    return null;
  }
};

// Get test packs
export const getTestPacks = async (): Promise<TestPack[]> => {
  try {
    console.log("Fetching test packs");
    const { data, error } = await supabase
      .from('test_packs')
      .select(`
        *,
        tags:tags(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching test packs:", error);
      throw error;
    }

    // Fetch ITR names for all test packs
    const itrIds = [...new Set(data.map((tp: any) => tp.itr_asociado))];
    const itrNamesPromises = itrIds.map(async (itrId) => {
      try {
        const { data: itrData } = await supabase
          .from('itrs')
          .select('id, name')
          .eq('id', itrId)
          .maybeSingle();
        
        return { id: itrId, name: itrData?.name };
      } catch (err) {
        console.log(`Error fetching ITR name for ${itrId}:`, err);
        return { id: itrId, name: null };
      }
    });

    const itrNames = await Promise.all(itrNamesPromises);
    const itrMap = new Map(itrNames.map(itr => [itr.id, itr.name]));

    // Ensure estado property is the correct type and calculate progress
    const formattedTestPacks: TestPack[] = data.map((tp: any) => {
      const formattedTags = tp.tags ? tp.tags.map((tag: any) => ({
        ...tag,
        estado: tag.estado as 'pendiente' | 'liberado'
      })) : [];
      
      const totalTags = formattedTags.length;
      const releasedTags = formattedTags.filter((t: any) => t.estado === 'liberado').length;
      const progress = totalTags > 0 ? Math.round((releasedTags / totalTags) * 100) : 0;
      
      // Add ITR name if found
      const itrName = itrMap.get(tp.itr_asociado);
      
      return {
        ...tp,
        itr_name: itrName || tp.itr_asociado,
        estado: tp.estado as 'pendiente' | 'listo',
        tags: formattedTags,
        progress
      };
    });

    console.log(`Found ${formattedTestPacks.length} test packs`);
    return formattedTestPacks;
  } catch (error) {
    console.error("Error in getTestPacks:", error);
    return [];
  }
};

// Get test packs stats
export const getTestPacksStats = async () => {
  try {
    console.log("Fetching test packs stats");
    
    // Get all test packs with their tags
    const testPacks = await getTestPacks();
    
    // Calculate test packs stats
    const totalTestPacks = testPacks.length;
    const completedTestPacks = testPacks.filter(tp => tp.estado === 'listo').length;
    const testPacksProgress = totalTestPacks > 0 
      ? Math.round((completedTestPacks / totalTestPacks) * 100) 
      : 0;
    
    // Calculate tags stats
    let totalTags = 0;
    let releasedTags = 0;
    
    testPacks.forEach(tp => {
      if (tp.tags) {
        totalTags += tp.tags.length;
        releasedTags += tp.tags.filter(t => t.estado === 'liberado').length;
      }
    });
    
    const tagsProgress = totalTags > 0 
      ? Math.round((releasedTags / totalTags) * 100) 
      : 0;
    
    // Calculate system distribution
    const systemCounts = testPacks.reduce((acc: Record<string, number>, tp) => {
      acc[tp.sistema] = (acc[tp.sistema] || 0) + 1;
      return acc;
    }, {});
    
    const systems = Object.entries(systemCounts).map(([name, count]) => ({
      name,
      value: count
    }));
    
    // Calculate subsystem distribution
    const subsystemCounts = testPacks.reduce((acc: Record<string, number>, tp) => {
      acc[tp.subsistema] = (acc[tp.subsistema] || 0) + 1;
      return acc;
    }, {});
    
    const subsystems = Object.entries(subsystemCounts).map(([name, count]) => ({
      name,
      value: count
    }));
    
    // Calculate ITR distribution
    const itrCounts = testPacks.reduce((acc: Record<string, number>, tp) => {
      const itrKey = tp.itr_name || tp.itr_asociado;
      acc[itrKey] = (acc[itrKey] || 0) + 1;
      return acc;
    }, {});
    
    const itrs = Object.entries(itrCounts).map(([name, count]) => ({
      name,
      value: count
    }));
    
    return {
      testPacks: {
        total: totalTestPacks,
        completed: completedTestPacks,
        progress: testPacksProgress
      },
      tags: {
        total: totalTags,
        released: releasedTags,
        progress: tagsProgress
      },
      systems,
      subsystems,
      itrs
    };
  } catch (error) {
    console.error("Error in getTestPacksStats:", error);
    return {
      testPacks: { total: 0, completed: 0, progress: 0 },
      tags: { total: 0, released: 0, progress: 0 },
      systems: [],
      subsystems: [],
      itrs: []
    };
  }
};

// Get test packs by ITR name
export const getTestPacksByITR = async (itrName: string): Promise<TestPack[]> => {
  try {
    console.log(`Fetching test packs for ITR: ${itrName}`);
    
    // First try to get the ITR id if itrName is not a UUID
    let itrId = itrName;
    if (!isUUID(itrName)) {
      const { data: itrData } = await supabase
        .from('itrs')
        .select('id')
        .eq('name', itrName)
        .maybeSingle();
      
      if (itrData?.id) {
        itrId = itrData.id;
      }
    }
    
    const { data, error } = await supabase
      .from('test_packs')
      .select(`
        *,
        tags:tags(*)
      `)
      .eq('itr_asociado', itrId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching test packs for ITR ${itrName}:`, error);
      throw error;
    }

    // Format the data
    const formattedTestPacks: TestPack[] = data.map((tp: any) => {
      const formattedTags = tp.tags ? tp.tags.map((tag: any) => ({
        ...tag,
        estado: tag.estado as 'pendiente' | 'liberado'
      })) : [];
      
      const totalTags = formattedTags.length;
      const releasedTags = formattedTags.filter((t: any) => t.estado === 'liberado').length;
      const progress = totalTags > 0 ? Math.round((releasedTags / totalTags) * 100) : 0;
      
      return {
        ...tp,
        itr_name: itrName,
        estado: tp.estado as 'pendiente' | 'listo',
        tags: formattedTags,
        progress
      };
    });

    console.log(`Found ${formattedTestPacks.length} test packs for ITR ${itrName}`);
    return formattedTestPacks;
  } catch (error) {
    console.error(`Error in getTestPacksByITR for ${itrName}:`, error);
    return [];
  }
};

// Helper function to check if a string is a UUID
const isUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};
