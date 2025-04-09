
import { supabase } from "@/integrations/supabase/client";
import { BulkUserData, UserCreateData, UserUpdateData, PasswordChangeData } from "@/services/types";

// Define available permissions for sidebar menu items
export const AVAILABLE_PERMISSIONS = [
  "dashboard",
  "projects", 
  "systems",
  "subsystems",
  "itrs",
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
  email?: string; // Add email property to fix TypeScript error
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    console.log(`Fetching profile for user ${userId}`);
    
    // First get the profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error(`Error fetching profile for user ${userId}:`, profileError);
      throw profileError;
    }

    // Now get the user email from auth if possible
    const { data: userData, error: userError } = await supabase.auth.getUser(userId);
    
    let userEmail = null;
    if (!userError && userData?.user) {
      userEmail = userData.user.email;
      console.log(`Got email ${userEmail} for user ${userId} from auth`);
    } else {
      console.log(`Could not get email from auth for user ${userId}, error:`, userError);
    }

    // Combine profile data with email
    return {
      ...profileData,
      email: userEmail || profileData?.email,
    } as UserProfile;
  } catch (error) {
    console.error(`Error in getUserProfile for ${userId}:`, error);
    
    // Fallback: Try to get the profile directly
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as unknown as UserProfile;
    } catch (fallbackError) {
      console.error(`Fallback also failed for user ${userId}:`, fallbackError);
      return null;
    }
  }
};

export const getUserProfiles = async (): Promise<UserProfile[]> => {
  try {
    console.log('Fetching all user profiles');
    
    // First get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    // Get all auth users to match with profiles
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Error fetching auth data:', authError);
    }
    
    const currentUserId = authData?.user?.id;
    
    // For each profile, try to get the email
    const enhancedProfiles = await Promise.all(profiles.map(async (profile) => {
      try {
        // If this is the current user, we can use the email from auth data
        if (profile.id === currentUserId && authData?.user?.email) {
          return {
            ...profile,
            email: authData.user.email,
          };
        }
        
        // For other users, try to get email from database
        // We'll store the email in the profile during creation/update operations
        return {
          ...profile,
          email: profile.email || 'Email no disponible',
        };
      } catch (error) {
        console.error(`Error enhancing profile for user ${profile.id}:`, error);
        return {
          ...profile,
          email: 'Email no disponible',
        };
      }
    }));

    return enhancedProfiles as UserProfile[];
  } catch (error) {
    console.error('Error in getUserProfiles:', error);
    
    // Fallback: Just return profiles without emails
    const { data, error: fallbackError } = await supabase
      .from('profiles')
      .select('*');

    if (fallbackError) throw fallbackError;
    return data as unknown as UserProfile[];
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
  console.log(`Updating profile for user ${userId} with:`, updates);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select();

    if (error) {
      console.error(`Error updating profile for user ${userId}:`, error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned after update');
    }

    return data[0] as unknown as UserProfile;
  } catch (error) {
    console.error(`Error in updateUserProfile for user ${userId}:`, error);
    throw error;
  }
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
    console.log("Creating user with data:", {...userData, password: '******'});
    
    // Use the standard auth.signUp method with email and password
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
        }
      }
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
    console.log("User created with ID:", userId);

    // Update the profile with additional information
    const profileData: UserUpdateData = {
      full_name: userData.full_name,
      role: userData.role || 'user',
      email: userData.email, // Store email in profile for easier access
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

    console.log("Updating profile with data:", profileData);
    
    // Use upsert instead of update to ensure the profile is created if it doesn't exist
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

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
      message: "Usuario creado exitosamente. El usuario debe confirmar su correo electrónico.", 
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
    // We can't use admin API to change passwords
    // Send a password reset link instead
    const { error } = await supabase.auth.resetPasswordForEmail(data.userId, {
      redirectTo: window.location.origin + '/auth/reset-password',
    });
    
    if (error) {
      throw error;
    }
    
    return { 
      success: true, 
      message: "Se ha enviado un correo electrónico con instrucciones para cambiar la contraseña." 
    };
  } catch (error: any) {
    console.error("Error sending password reset:", error);
    return { 
      success: false, 
      message: `Error al enviar el correo de cambio de contraseña: ${error.message || "Error desconocido"}` 
    };
  }
};

export const setRodrigoAsAdmin = async (): Promise<boolean> => {
  try {
    console.log("Looking for Rodrigo Peredo in profiles");
    
    // Find Rodrigo's profile by name
    const { data: profiles, error: findError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('full_name', '%Rodrigo Peredo%');
    
    if (findError) {
      console.error("Error finding Rodrigo Peredo:", findError);
      return false;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log("No profile found for Rodrigo Peredo");
      return false;
    }
    
    const rodrigoProfile = profiles[0];
    console.log("Found profile for Rodrigo Peredo:", rodrigoProfile);
    
    // Update to admin role with all permissions
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        role: 'admin',
        permissions: AVAILABLE_PERMISSIONS,
        updated_at: new Date().toISOString()
      })
      .eq('id', rodrigoProfile.id);
    
    if (updateError) {
      console.error("Error updating Rodrigo to admin:", updateError);
      return false;
    }
    
    console.log("Successfully set Rodrigo Peredo as admin with all permissions");
    return true;
  } catch (error) {
    console.error("Error in setRodrigoAsAdmin:", error);
    return false;
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
