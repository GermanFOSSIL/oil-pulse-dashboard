
// This file re-exports all service functions from their respective modules
// to maintain backward compatibility with existing code

export * from './types';
export * from './projectService';
export * from './systemService';
export * from './subsystemService';
export * from './itrDataService';
export * from './taskService';
export * from './userService';
export * from './reportService';
export * from './dashboardService';

// Functions required by other parts of the app but not included in refactored files
export const generateImportTemplate = async () => {
  console.log("Function not implemented: generateImportTemplate");
  return new ArrayBuffer(0); // Return empty buffer for now
};

export const importDataFromExcel = async () => {
  console.log("Function not implemented: importDataFromExcel");
  return {
    projects: 0,
    systems: 0,
    subsystems: 0,
    tasks: 0,
    itrs: 0,
    users: 0
  };
};

// Temporary function for getting user profiles (plural)
export const getUserProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error("Error fetching user profiles:", error);
    throw error;
  }

  return data || [];
};

// Temporary function for creating user profile
export const createUserProfile = async () => {
  console.log("Function not implemented: createUserProfile");
  return { id: 'temp-id', full_name: 'Nuevo Usuario', role: 'user' };
};

// Import necessary Supabase client
import { supabase } from "@/integrations/supabase/client";
