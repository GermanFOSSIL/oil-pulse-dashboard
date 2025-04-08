
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
  throw new Error("Function not implemented: generateImportTemplate");
};

export const importDataFromExcel = async () => {
  console.log("Function not implemented: importDataFromExcel");
  throw new Error("Function not implemented: importDataFromExcel");
};

// Temporary function for getting user profiles (plural)
export const getUserProfiles = async () => {
  console.log("Function not implemented: getUserProfiles");
  throw new Error("Function not implemented: getUserProfiles");
};

// Temporary function for creating user profile
export const createUserProfile = async () => {
  console.log("Function not implemented: createUserProfile");
  throw new Error("Function not implemented: createUserProfile");
};
