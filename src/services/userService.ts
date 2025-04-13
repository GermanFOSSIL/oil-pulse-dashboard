
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
  const { data: users, error } = await supabase
    .from('users')
    .select('*, profile:profiles(*)');
  
  if (error) throw error;
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

// Get user permissions
export const getUserPermissions = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('permissions')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    return data?.permissions || [];
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
};

// Create new user
export const createUser = async (userData: {
  email: string;
  password: string;
  full_name: string;
  role: string;
  permissions?: string[];
}) => {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
  });
  
  if (authError) throw authError;
  
  if (authData?.user) {
    // Create profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: userData.full_name,
        role: userData.role,
        permissions: userData.permissions || []
      })
      .eq('id', authData.user.id);
    
    if (profileError) {
      // Attempt to clean up on error
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (e) {
        console.error('Failed to clean up user after profile creation error:', e);
      }
      throw profileError;
    }
    
    return authData;
  }
  
  throw new Error('Failed to create user: No user data returned');
};

// Update user
export const updateUser = async (userId: string, userData: {
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
