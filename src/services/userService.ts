// Aquí se exportarán todos los servicios relacionados con usuarios

import { supabase } from "@/integrations/supabase/client";

// Define available permissions
export const AVAILABLE_PERMISSIONS = [
  "dashboard",
  "projects",
  "systems", 
  "subsystems",
  "itrs",
  "test-packs",
  "configuration",
  "users",
  "reports",
  "database"
];

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

// Get all users with their profiles
export const getUsers = async () => {
  // This is the correct approach since we can't query "users" directly
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*');
  
  if (error) throw error;
  
  // Format response similar to how it would be if we could query users
  const users = profiles.map(profile => ({
    id: profile.id,
    email: profile.email,
    profile: profile,
    created_at: profile.created_at
  }));
  
  return users;
};

// Get specific user profile
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

// Update user profile - renamed from updateUser for clarity
export const updateUserProfile = async (userId: string, userData: {
  full_name?: string;
  role?: string;
  permissions?: string[];
}) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(userData)
    .eq('id', userId);
  
  if (error) throw error;
  return data;
};

// Update user
export const updateUser = updateUserProfile;

// Update user permissions
export const updateUserPermissions = async (userId: string, permissions: string[]) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ permissions })
    .eq('id', userId);
  
  if (error) throw error;
  return data;
};

// Delete user
export const deleteUser = async (userId: string) => {
  // First, delete from auth
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) throw authError;
  
  // Profile should be deleted automatically through RLS policies
  return { success: true };
};

// Change user password
export const changeUserPassword = async (userId: string, newPassword: string) => {
  const { data, error } = await supabase.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  );
  
  if (error) throw error;
  return data;
};

// Bulk create users
export const bulkCreateUsers = async (users: any[]) => {
  let successCount = 0;
  
  for (const userData of users) {
    try {
      await createUser(userData);
      successCount++;
    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error);
    }
  }
  
  return successCount;
};

// Get all user profiles
export const getUserProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');
  
  if (error) throw error;
  return data;
};
