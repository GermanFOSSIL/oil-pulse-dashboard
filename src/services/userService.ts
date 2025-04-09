
import { supabase } from "@/integrations/supabase/client";
import { UserCreateData, UserUpdateData } from "@/services/types";
import { AVAILABLE_PERMISSIONS, getDefaultPermissionsForRole } from "@/services/userPermissionService";
import { changeUserPassword, generateRandomPassword } from "@/services/userPasswordService";
import { bulkCreateUsers } from "@/services/userBulkService";

// Use a different name to avoid conflict with the Profile in types.ts
export interface UserProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  permissions?: string[];
  created_at?: string;
  updated_at?: string;
}

// Re-export functions from other modules
export { 
  AVAILABLE_PERMISSIONS,
  changeUserPassword,
  generateRandomPassword,
  bulkCreateUsers
};

/**
 * Get a single user profile
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error(`Error fetching profile for user ${userId}:`, error);
      throw error;
    }

    return data as unknown as UserProfile;
  } catch (error) {
    console.error(`Error in getUserProfile for ${userId}:`, error);
    throw error;
  }
};

/**
 * Get all user profiles
 */
export const getUserProfiles = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('Error fetching user profiles:', error);
      throw error;
    }

    return data as unknown as UserProfile[];
  } catch (error) {
    console.error('Error in getUserProfiles:', error);
    throw error;
  }
};

/**
 * Update a user profile
 */
export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
  try {
    console.log(`Updating profile for user ${userId}:`, updates);
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating profile for user ${userId}:`, error);
      throw error;
    }

    return data as unknown as UserProfile;
  } catch (error) {
    console.error(`Error in updateUserProfile for ${userId}:`, error);
    throw error;
  }
};

/**
 * Create a new user
 */
export const createUser = async (userData: UserCreateData): Promise<{ success: boolean; message: string; userId?: string }> => {
  try {
    console.log("Creating user with data:", { 
      email: userData.email, 
      full_name: userData.full_name, 
      role: userData.role 
    });
    
    // First, create the user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Automatically confirm the email
    });

    if (authError) {
      console.error("Error creating user account:", authError);
      return { 
        success: false, 
        message: `Error al crear la cuenta de usuario: ${authError.message}` 
      };
    }

    if (!authData.user) {
      return { success: false, message: "Error al crear la cuenta de usuario: No se pudo crear el usuario" };
    }

    const userId = authData.user.id;
    console.log("User created successfully with ID:", userId);

    // Then, update the profile with additional information
    const profileData: UserUpdateData = {
      full_name: userData.full_name,
      role: userData.role || 'user',
    };

    if (userData.permissions) {
      profileData.permissions = userData.permissions;
    } else {
      // Set default permissions based on role
      profileData.permissions = getDefaultPermissionsForRole(userData.role || 'user');
    }

    console.log("Updating profile for new user with data:", profileData);
    
    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId);

    if (profileError) {
      console.error("Error updating user profile:", profileError);
      return { 
        success: true, 
        message: "Usuario creado, pero hubo un error al actualizar el perfil", 
        userId 
      };
    }

    return { 
      success: true, 
      message: "Usuario creado exitosamente", 
      userId 
    };
  } catch (error: any) {
    console.error("Error creating user:", error);
    return { 
      success: false, 
      message: `Error al crear usuario: ${error.message || "Error desconocido"}` 
    };
  }
};
