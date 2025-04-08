
import { supabase } from "@/integrations/supabase/client";
import { BulkUserData, UserCreateData, UserUpdateData, PasswordChangeData } from "@/services/types";

// Define available permissions for sidebar menu items
export const AVAILABLE_PERMISSIONS = [
  "dashboard",
  "projects", 
  "systems",
  "subsystems",
  "itrs",
  "testpacks",
  "configuration",
  "users",
  "reports",
  "database"
];

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

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
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
};

export const getUserProfiles = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error('Error fetching user profiles:', error);
    throw error;
  }

  return data as unknown as UserProfile[];
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
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
};

export const getUserPermissions = async (userId: string): Promise<string[]> => {
  try {
    const profile = await getUserProfile(userId);
    
    if (!profile) {
      return [];
    }
    
    // Default permissions based on role
    let permissions: string[] = ['dashboard'];
    
    if (profile.role === 'admin') {
      // Admins have access to everything
      permissions = [...AVAILABLE_PERMISSIONS];
    } else if (profile.role === 'tecnico') {
      // Technicians have access to dashboards, reports, and ITRs
      permissions = ['dashboard', 'reports', 'itrs'];
    } else {
      // Regular users have access to dashboards and reports only
      permissions = ['dashboard', 'reports'];
    }
    
    // If custom permissions exist, use those instead
    if (profile.permissions && Array.isArray(profile.permissions)) {
      permissions = profile.permissions;
    }
    
    return permissions;
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return ['dashboard']; // Fallback to dashboard only
  }
};

export const bulkCreateUsers = async (users: BulkUserData[]): Promise<number> => {
  try {
    let successCount = 0;
    
    for (const user of users) {
      try {
        const result = await createUser({
          email: user.email,
          password: user.password || generateRandomPassword(),
          full_name: user.full_name,
          role: user.role || 'user'
        });
        
        if (result.success) {
          successCount++;
        }
      } catch (err) {
        console.error(`Error processing user ${user.email}:`, err);
      }
    }
    
    return successCount;
  } catch (error) {
    console.error("Error in bulk user creation:", error);
    throw error;
  }
};

export const createUser = async (userData: UserCreateData): Promise<{ success: boolean; message: string; userId?: string }> => {
  try {
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

    // Then, update the profile with additional information
    const profileData: UserUpdateData = {
      full_name: userData.full_name,
      role: userData.role || 'user',
    };

    if (userData.permissions) {
      profileData.permissions = userData.permissions;
    } else {
      // Set default permissions based on role
      if (userData.role === 'admin') {
        profileData.permissions = [...AVAILABLE_PERMISSIONS];
      } else if (userData.role === 'tecnico') {
        profileData.permissions = ['dashboard', 'reports', 'itrs'];
      } else {
        profileData.permissions = ['dashboard', 'reports'];
      }
    }

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

export const changeUserPassword = async (data: PasswordChangeData): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase.auth.admin.updateUserById(
      data.userId,
      { password: data.newPassword }
    );

    if (error) {
      console.error("Error changing password:", error);
      return { 
        success: false, 
        message: `Error al cambiar la contraseña: ${error.message}` 
      };
    }

    return { 
      success: true, 
      message: "Contraseña cambiada exitosamente" 
    };
  } catch (error: any) {
    console.error("Error changing password:", error);
    return { 
      success: false, 
      message: `Error al cambiar la contraseña: ${error.message || "Error desconocido"}` 
    };
  }
};

const generateRandomPassword = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters.charAt(randomIndex);
  }
  
  return password;
};
