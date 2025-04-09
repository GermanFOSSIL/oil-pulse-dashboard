import { supabase } from "@/integrations/supabase/client";
import { getUserProfile } from "./userService";
import { getUserPermissions } from "./userPermissionService";
import {
  Project,
  System,
  Subsystem,
  ITR,
  TestPack,
  Tag,
  Profile,
  UserUpdateData,
  UserCreateData,
  BulkUserData,
  PasswordChangeData,
  Task,
  ReportType,
  TestPackStats,
  TagStats,
  StatsData,
  AccionesLog,
  DbActivityLog
} from "./types";

// Re-export types
export type {
  Project,
  System,
  Subsystem,
  ITR,
  TestPack,
  Tag,
  Profile,
  UserUpdateData,
  UserCreateData,
  BulkUserData,
  PasswordChangeData,
  Task,
  ReportType,
  TestPackStats,
  TagStats,
  StatsData,
  AccionesLog,
  DbActivityLog
};

// Project functions
export const getProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }

  return (data || []).map(item => ({
    ...item,
    status: item.status as "complete" | "inprogress" | "delayed"
  })) as Project[];
};

export const createProject = async (project: Partial<Project>): Promise<Project> => {
  if (!project.name) {
    throw new Error("Project name is required");
  }

  const { data, error } = await supabase
    .from("projects")
    .insert(project)
    .select()
    .single();

  if (error) {
    console.error("Error creating project:", error);
    throw error;
  }

  return {
    ...data,
    status: data.status as "complete" | "inprogress" | "delayed"
  } as Project;
};

export const updateProject = async (id: string, project: Partial<Project>): Promise<Project> => {
  const { data, error } = await supabase
    .from("projects")
    .update({ ...project, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating project:", error);
    throw error;
  }

  return {
    ...data,
    status: data.status as "complete" | "inprogress" | "delayed"
  } as Project;
};

export const deleteProject = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};

// System functions
export const getSystems = async (): Promise<System[]> => {
  const { data, error } = await supabase
    .from("systems")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching systems:", error);
    throw error;
  }

  return data || [];
};

export const getSystemsByProjectId = async (projectId: string): Promise<System[]> => {
  const { data, error } = await supabase
    .from("systems")
    .select("*")
    .eq("project_id", projectId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching systems by project:", error);
    throw error;
  }

  return data || [];
};

export const createSystem = async (system: Partial<System>): Promise<System> => {
  if (!system.name || !system.project_id) {
    throw new Error("System name and project_id are required");
  }

  const { data, error } = await supabase
    .from("systems")
    .insert(system)
    .select()
    .single();

  if (error) {
    console.error("Error creating system:", error);
    throw error;
  }

  return data;
};

export const updateSystem = async (id: string, system: Partial<System>): Promise<System> => {
  const { data, error } = await supabase
    .from("systems")
    .update({ ...system, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating system:", error);
    throw error;
  }

  return data;
};

export const deleteSystem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("systems")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting system:", error);
    throw error;
  }
};

// Subsystem functions
export const getSubsystems = async (): Promise<Subsystem[]> => {
  const { data, error } = await supabase
    .from("subsystems")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching subsystems:", error);
    throw error;
  }

  return data || [];
};

export const getSubsystemsBySystemId = async (systemId: string): Promise<Subsystem[]> => {
  const { data, error } = await supabase
    .from("subsystems")
    .select("*")
    .eq("system_id", systemId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching subsystems by system:", error);
    throw error;
  }

  return data || [];
};

export const createSubsystem = async (subsystem: Partial<Subsystem>): Promise<Subsystem> => {
  if (!subsystem.name || !subsystem.system_id) {
    throw new Error("Subsystem name and system_id are required");
  }

  const { data, error } = await supabase
    .from("subsystems")
    .insert(subsystem)
    .select()
    .single();

  if (error) {
    console.error("Error creating subsystem:", error);
    throw error;
  }

  return data;
};

export const updateSubsystem = async (id: string, subsystem: Partial<Subsystem>): Promise<Subsystem> => {
  const { data, error } = await supabase
    .from("subsystems")
    .update({ ...subsystem, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating subsystem:", error);
    throw error;
  }

  return data;
};

export const deleteSubsystem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("subsystems")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting subsystem:", error);
    throw error;
  }
};

// ITR functions
export const getITRs = async (): Promise<ITR[]> => {
  const { data, error } = await supabase
    .from("itrs")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching ITRs:", error);
    throw error;
  }

  return (data || []).map(item => ({
    ...item,
    status: item.status as "complete" | "inprogress" | "delayed"
  })) as ITR[];
};

export const createITR = async (itr: Partial<ITR>): Promise<ITR> => {
  if (!itr.name || !itr.subsystem_id) {
    throw new Error("ITR name and subsystem_id are required");
  }

  const { data, error } = await supabase
    .from("itrs")
    .insert(itr)
    .select()
    .single();

  if (error) {
    console.error("Error creating ITR:", error);
    throw error;
  }

  return {
    ...data,
    status: data.status as "complete" | "inprogress" | "delayed"
  } as ITR;
};

export const updateITR = async (id: string, itr: Partial<ITR>): Promise<ITR> => {
  const { data, error } = await supabase
    .from("itrs")
    .update({ ...itr, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating ITR:", error);
    throw error;
  }

  return {
    ...data,
    status: data.status as "complete" | "inprogress" | "delayed"
  } as ITR;
};

export const deleteITR = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("itrs")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting ITR:", error);
    throw error;
  }
};

// Tasks functions
export const getTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }

  return data || [];
};

// Dashboard and Reports functions
export const getDashboardStats = async (projectId: string | null): Promise<any> => {
  try {
    // Get projects data
    const projectsData = await getProjects();
    
    // Basic stats calculation
    const stats = {
      totalProjects: projectsData.length,
      completedProjects: projectsData.filter(p => p.status === "complete").length,
      inProgressProjects: projectsData.filter(p => p.status === "inprogress").length,
      delayedProjects: projectsData.filter(p => p.status === "delayed").length,
      totalSystems: 0,
      totalITRs: 0,
      completedITRs: 0,
      inProgressITRs: 0,
      delayedITRs: 0,
      completionRate: 0,
      chartData: [],
      areaChartData: [],
      projectsData: []
    };
    
    // Mock chart data
    stats.chartData = [
      { name: "Sistema A", value: 70, completedITRs: 7, totalITRs: 10 },
      { name: "Sistema B", value: 45, completedITRs: 5, totalITRs: 11 },
      { name: "Sistema C", value: 90, completedITRs: 9, totalITRs: 10 },
      { name: "Sistema D", value: 30, completedITRs: 3, totalITRs: 10 }
    ];
    
    // Mock area chart data
    stats.areaChartData = [
      { name: "Ene", inspections: 20, completions: 10, issues: 5 },
      { name: "Feb", inspections: 25, completions: 15, issues: 3 },
      { name: "Mar", inspections: 30, completions: 20, issues: 4 },
      { name: "Abr", inspections: 35, completions: 25, issues: 2 },
      { name: "May", inspections: 40, completions: 30, issues: 1 }
    ];
    
    // Mock projects data for cards
    stats.projectsData = projectsData.map(project => ({
      title: project.name,
      value: project.progress || 0,
      description: `Estado: ${project.status}, Ubicación: ${project.location || "N/A"}`
    }));
    
    // Calculate completion rate
    stats.completionRate = 75; // Mocked value
    
    // Set totals
    stats.totalSystems = 15; // Mocked value
    stats.totalITRs = 45; // Mocked value
    stats.completedITRs = 30; // Mocked value
    stats.inProgressITRs = 10; // Mocked value
    stats.delayedITRs = 5; // Mocked value
    
    return stats;
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    throw error;
  }
};

export const generateReport = async (reportType: string, projectId: string): Promise<string> => {
  try {
    // For demonstration purposes, return a mock URL
    // In a real application, this would generate a report and return a URL to download it
    console.log(`Generating report: ${reportType} for project: ${projectId}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock report data URL
    return 'data:application/json;base64,' + btoa(JSON.stringify({
      reportType,
      projectId,
      date: new Date().toISOString(),
      systems: [
        { id: "1", name: "Sistema A", completion_rate: 75 },
        { id: "2", name: "Sistema B", completion_rate: 45 },
        { id: "3", name: "Sistema C", completion_rate: 90 }
      ],
      subsystems: [
        { id: "1", name: "Subsistema A1", system_id: "1" },
        { id: "2", name: "Subsistema A2", system_id: "1" },
        { id: "3", name: "Subsistema B1", system_id: "2" }
      ],
      itrs: [
        { id: "1", name: "ITR-001", status: "complete", progress: 100, subsystem_id: "1", due_date: "2025-05-15" },
        { id: "2", name: "ITR-002", status: "inprogress", progress: 50, subsystem_id: "1", due_date: "2025-05-20" },
        { id: "3", name: "ITR-003", status: "delayed", progress: 30, subsystem_id: "2", due_date: "2025-05-10" }
      ]
    }));
  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
};

// Data import/export functions
export const generateImportTemplate = async (): Promise<ArrayBuffer> => {
  try {
    // In a real application, this would generate an Excel template
    // For now, just return a mock ArrayBuffer
    console.log("Generating import template");
    
    // Create a mock ArrayBuffer
    const buffer = new ArrayBuffer(1024);
    return buffer;
  } catch (error) {
    console.error("Error generating import template:", error);
    throw error;
  }
};

export const importDataFromExcel = async (data: ArrayBuffer): Promise<any> => {
  try {
    // In a real application, this would process the Excel file
    // For now, just return mock stats
    console.log("Importing data from Excel");
    
    return {
      projects: 3,
      systems: 5,
      subsystems: 10,
      itrs: 20,
      users: 5,
      tasks: 15
    };
  } catch (error) {
    console.error("Error importing data from Excel:", error);
    throw error;
  }
};

// Test Pack and Tags functions
export const getTestPacks = async (): Promise<TestPack[]> => {
  const { data, error } = await supabase
    .from("test_packs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching test packs:", error);
    throw error;
  }

  return (data || []).map(item => ({
    ...item,
    estado: item.estado as "pendiente" | "listo"
  })) as TestPack[];
};

// Re-export functions from other services
export { getUserProfile, getUserPermissions };
