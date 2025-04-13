import { supabase } from "@/integrations/supabase/client";

export interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  status: "complete" | "inprogress" | "delayed";
  progress: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export const getProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select('*');

  if (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }

  return (data as unknown as Project[]) || [];
};

export const getProject = async (id: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching project with id ${id}:`, error);
    throw error;
  }

  return data as unknown as Project;
};

export const createProject = async (projectData: Omit<Project, "id" | "created_at" | "updated_at">) => {
  const { data, error } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single();

  if (error) {
    console.error("Error creating project:", error);
    throw error;
  }

  return data as unknown as Project;
};

export const updateProject = async (id: string, projectData: Partial<Project>) => {
  const { data, error } = await supabase
    .from('projects')
    .update(projectData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating project with id ${id}:`, error);
    throw error;
  }

  return data as unknown as Project;
};

export const deleteProject = async (id: string) => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting project with id ${id}:`, error);
    throw error;
  }
};

export const getProjectsSummary = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select('*');

  if (error) {
    console.error("Error fetching projects for summary:", error);
    throw error;
  }

  const projects = data as unknown as Project[];
  const total = projects.length;
  const complete = projects.filter(p => p.status === 'complete').length;
  const inProgress = projects.filter(p => p.status === 'inprogress').length;
  const delayed = projects.filter(p => p.status === 'delayed').length;

  return { total, complete, inProgress, delayed };
};
