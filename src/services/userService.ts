
import { supabase } from "@/integrations/supabase/client";
import { BulkUserData, UserCreateData, UserUpdateData, PasswordChangeData } from "@/services/types";

// Define UserProfile interface here to avoid conflicts
export interface UserProfile {
  id: string;
  full_name?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  created_at?: string;
  updated_at?: string;
  avatar_url?: string;
}

// Available permissions
export const AVAILABLE_PERMISSIONS = [
  "projects:read",
  "projects:write",
  "users:read",
  "users:write",
  "systems:read",
  "systems:write",
  "subsystems:read",
  "subsystems:write",
  "itrs:read",
  "itrs:write",
  "reports:read",
  "reports:write",
  "testpacks:read",
  "testpacks:write",
  "admin"
];

// Get user profiles
export const getUserProfiles = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
      
    if (error) {
      console.error("Error fetching user profiles:", error);
      throw error;
    }
    
    return data as UserProfile[] || [];
  } catch (error) {
    console.error("Error in getUserProfiles:", error);
    throw error;
  }
};

// Get user permissions
export const getUserPermissions = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('permissions')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error(`Error fetching permissions for user ${userId}:`, error);
      throw error;
    }
    
    return data?.permissions || [];
  } catch (error) {
    console.error("Error in getUserPermissions:", error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userData: UserUpdateData): Promise<UserProfile> => {
  try {
    // Only include properties that are defined in the update
    const updates: Partial<UserProfile> = {};
    
    if (userData.full_name !== undefined) {
      updates.full_name = userData.full_name;
    }
    
    if (userData.email !== undefined) {
      updates.email = userData.email;
    }
    
    if (userData.role !== undefined) {
      updates.role = userData.role;
    }
    
    if (userData.permissions !== undefined) {
      updates.permissions = userData.permissions;
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userData.id)
      .select()
      .single();
      
    if (error) {
      console.error(`Error updating profile for user ${userData.id}:`, error);
      throw error;
    }
    
    return data as UserProfile;
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    throw error;
  }
};

// Bulk create users
export const bulkCreateUsers = async (users: BulkUserData[]): Promise<{ created: number, errors: any[] }> => {
  const results = {
    created: 0,
    errors: [] as any[]
  };
  
  // Process users sequentially to handle errors individually
  for (const user of users) {
    try {
      // First, create the auth user
      const tempPassword = generateTempPassword();
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: tempPassword,
        email_confirm: true
      });
      
      if (authError) {
        results.errors.push({
          email: user.email,
          error: authError.message
        });
        continue;
      }
      
      // Then, create the profile
      const userId = authData.user.id;
      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: user.full_name,
          email: user.email,
          role: user.role || 'user',
          permissions: user.permissions || []
        });
        
      if (profileError) {
        results.errors.push({
          email: user.email,
          error: profileError.message
        });
        continue;
      }
      
      results.created++;
    } catch (error: any) {
      results.errors.push({
        email: user.email,
        error: error.message || 'Unknown error'
      });
    }
  }
  
  return results;
};

// Helper function to generate a temporary password
const generateTempPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const length = 12;
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

// Change password for a user
export const changeUserPassword = async (data: PasswordChangeData): Promise<void> => {
  try {
    const { error } = await supabase.auth.admin.updateUserById(
      data.id,
      { password: data.password }
    );
    
    if (error) {
      console.error(`Error changing password for user ${data.id}:`, error);
      throw error;
    }
  } catch (error) {
    console.error("Error in changeUserPassword:", error);
    throw error;
  }
};

// Delete a user
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    // First delete the user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
      
    if (profileError) {
      console.error(`Error deleting profile for user ${userId}:`, profileError);
      throw profileError;
    }
    
    // Then delete the auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error(`Error deleting auth user ${userId}:`, authError);
      throw authError;
    }
  } catch (error) {
    console.error("Error in deleteUser:", error);
    throw error;
  }
};
