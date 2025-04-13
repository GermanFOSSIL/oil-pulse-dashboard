
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

/**
 * User retrieval functions
 */

// Get all users with their profiles
export const getUsers = async () => {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*');
  
  if (error) throw error;
  
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

// Get all user profiles
export const getUserProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');
  
  if (error) throw error;
  return data;
};

// Get user permissions
export const getUserPermissions = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('permissions')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data?.permissions || [];
};

/**
 * User update functions
 */

// Update user profile
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

// Update user - alias for updateUserProfile
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

/**
 * User creation functions
 */

// Create a single user
export const createUser = async (userData: {
  email: string;
  password: string;
  full_name: string;
  role?: string;
  permissions?: string[];
}) => {
  // Create the user in auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true,
    user_metadata: {
      full_name: userData.full_name
    }
  });
  
  if (authError) throw authError;
  
  // Update the profile with role and permissions
  if (authData.user) {
    await updateUserProfile(authData.user.id, {
      full_name: userData.full_name,
      role: userData.role || 'user',
      permissions: userData.permissions || []
    });
  }
  
  return authData;
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

/**
 * User deletion and password management
 */

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
