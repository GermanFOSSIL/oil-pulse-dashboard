
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
  email?: string; // Added email to the UserProfile interface
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
    let userEmail = profileData?.email; // First try to get email from profiles
    
    if (!userEmail) {
      try {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        
        if (!userError && userData?.user) {
          userEmail = userData.user.email;
          console.log(`Got email ${userEmail} for user ${userId} from auth`);
          
          // Sync the email back to the profile if it doesn't exist there
          if (userEmail && !profileData.email) {
            await supabase
              .from('profiles')
              .update({ email: userEmail, updated_at: new Date().toISOString() })
              .eq('id', userId);
          }
        } else if (userError) {
          console.log(`Could not get email from auth for user ${userId}, error:`, userError);
        }
      } catch (authError) {
        console.log(`Error accessing auth API for user ${userId}:`, authError);
      }
    }

    // Combine profile data with email
    const profileWithEmail = {
      ...profileData,
      email: userEmail || profileData?.email
    } as UserProfile;
    
    return profileWithEmail;
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
      return data as UserProfile;
    } catch (fallbackError) {
      console.error(`Fallback also failed for user ${userId}:`, fallbackError);
      return null;
    }
  }
};

export const getUserProfiles = async (): Promise<UserProfile[]> => {
  try {
    // Use a more efficient query with fewer rows returned
    console.log('Fetching all user profiles');
    
    // First get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    // Get all auth users to match with profiles - but limit response fields
    try {
      const { data, error: authError } = await supabase.auth.admin.listUsers({
        perPage: 100, // Limit number of users per page
      });
      
      if (authError) {
        console.error('Error fetching auth users:', authError);
      }
      
      const authUsers = data?.users || [];
      
      // Create a map of user IDs to emails for faster lookup
      const userEmailMap: Record<string, string> = {};
      if (authUsers) {
        authUsers.forEach(user => {
          if (user.email) {
            userEmailMap[user.id] = user.email;
          }
        });
      }
      
      // For each profile, try to get the email if not already set
      const enhancedProfiles = profiles.map(profile => {
        // First try to use the email from the profile itself (preferred)
        // If not available, try to get it from auth users map
        const email = profile.email || userEmailMap[profile.id] || null;
        
        // Sync back to profile if needed
        if (email && !profile.email) {
          // Don't await this to keep the function responsive
          supabase
            .from('profiles')
            .update({ email, updated_at: new Date().toISOString() })
            .eq('id', profile.id)
            .then(() => console.log(`Synced email for user ${profile.id}`))
            .catch(error => console.error(`Failed to sync email for user ${profile.id}:`, error));
        }
        
        return {
          ...profile,
          email
        } as UserProfile;
      });

      return enhancedProfiles;
    } catch (authError) {
      console.error('Error accessing auth API:', authError);
      // If auth API fails, return profiles with their emails
      return profiles as UserProfile[];
    }
  } catch (error) {
    console.error('Error in getUserProfiles:', error);
    
    // Fallback: Just return profiles without trying to enhance them
    const { data, error: fallbackError } = await supabase
      .from('profiles')
      .select('*');

    if (fallbackError) throw fallbackError;
    return (data || []) as UserProfile[];
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
  console.log(`Updating profile for user ${userId} with:`, updates);
  
  try {
    // Make sure we're only sending valid columns to the database
    const validUpdates: Partial<UserProfile> = {
      full_name: updates.full_name,
      avatar_url: updates.avatar_url,
      role: updates.role,
      permissions: updates.permissions,
      email: updates.email, // Include email in valid updates
    };
    
    const { data, error } = await supabase
      .from('profiles')
      .update(validUpdates)
      .eq('id', userId)
      .select();

    if (error) {
      console.error(`Error updating profile for user ${userId}:`, error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned after update');
    }

    // Try to update email in auth.users if email has changed
    if (updates.email) {
      try {
        // Notice this requires admin privileges - may fail with public client
        const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
          userId,
          { email: updates.email }
        );
        
        if (updateAuthError) {
          console.error(`Could not update auth email for user ${userId}:`, updateAuthError);
        }
      } catch (authError) {
        console.error(`Error updating auth email for user ${userId}:`, authError);
        // Continue even if auth update fails - we've already updated the profile
      }
    }

    return data[0] as UserProfile;
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
    const batchSize = 5; // Process users in smaller batches
    
    // Process users in batches to prevent UI freezing
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      // Process batch in parallel
      const results = await Promise.all(
        batch.map(async (user) => {
          try {
            const result = await createUser({
              email: user.email,
              password: user.password || generateRandomPassword(),
              full_name: user.full_name,
              role: user.role || 'user'
            });
            
            return result.success;
          } catch (err) {
            console.error(`Error processing user ${user.email}:`, err);
            return false;
          }
        })
      );
      
      // Count successful creations
      successCount += results.filter(success => success).length;
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
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
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

    // Update the profile with additional information including email
    const profileData = {
      full_name: userData.full_name,
      role: userData.role || 'user',
      email: userData.email, // Store email in profile for easier access
      permissions: userData.permissions || getDefaultPermissions(userData.role || 'user')
    };

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

const getDefaultPermissions = (role: string): string[] => {
  if (role === 'admin') {
    return [...AVAILABLE_PERMISSIONS];
  } else if (role === 'tecnico') {
    return ['dashboard', 'reports', 'itrs'];
  } else {
    return ['dashboard', 'reports'];
  }
};

export const changeUserPassword = async (data: PasswordChangeData): Promise<{ success: boolean; message: string }> => {
  try {
    // Find the user email first
    let userEmail = "";
    
    try {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(data.userId);
      
      if (!userError && userData?.user?.email) {
        userEmail = userData.user.email;
      } else {
        // Try to get email from profiles table as fallback
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', data.userId)
          .single();
          
        if (profileData?.email) {
          userEmail = profileData.email;
        }
      }
    } catch (error) {
      console.error("Error getting user email:", error);
    }
    
    if (!userEmail) {
      return {
        success: false,
        message: "No se pudo encontrar el email del usuario"
      };
    }

    // Fix the Promise.catch issue by using try/catch with await
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: window.location.origin + '/auth/reset-password',
      });
      
      if (error) throw error;
      
      return { 
        success: true, 
        message: "Se ha enviado un correo electrónico con instrucciones para cambiar la contraseña." 
      };
    } catch (resetError: any) {
      console.error("Error resetting password:", resetError);
      return { 
        success: false, 
        message: `Error al enviar el correo de cambio de contraseña: ${resetError.message || "Error desconocido"}` 
      };
    }
  } catch (error: any) {
    console.error("Error sending password reset:", error);
    return { 
      success: false, 
      message: `Error al enviar el correo de cambio de contraseña: ${error.message || "Error desconocido"}` 
    };
  }
};

// Implement a debounced version of setRodrigoAsAdmin to prevent multiple calls
let adminSetTimeout: NodeJS.Timeout | null = null;
export const setRodrigoAsAdmin = async (): Promise<boolean> => {
  // Clear any existing timeout
  if (adminSetTimeout) {
    clearTimeout(adminSetTimeout);
  }
  
  return new Promise((resolve) => {
    // Set a new timeout to debounce the function call
    adminSetTimeout = setTimeout(async () => {
      try {
        console.log("Looking for Rodrigo Peredo in profiles");
        
        // Find Rodrigo's profile by name
        const { data: profiles, error: findError } = await supabase
          .from('profiles')
          .select('*')
          .ilike('full_name', '%Rodrigo Peredo%');
        
        if (findError) {
          console.error("Error finding Rodrigo Peredo:", findError);
          resolve(false);
          return;
        }
        
        if (!profiles || profiles.length === 0) {
          console.log("No profile found for Rodrigo Peredo");
          resolve(false);
          return;
        }
        
        const rodrigoProfile = profiles[0];
        console.log("Found profile for Rodrigo Peredo:", rodrigoProfile);
        
        // Check if already admin with all permissions
        if (rodrigoProfile.role === 'admin' && 
            Array.isArray(rodrigoProfile.permissions) && 
            AVAILABLE_PERMISSIONS.every(p => rodrigoProfile.permissions?.includes(p))) {
          console.log("Rodrigo Peredo is already admin with all permissions");
          resolve(true);
          return;
        }
        
        // Update to admin role with all permissions
        try {
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
            resolve(false);
            return;
          }
          
          console.log("Successfully set Rodrigo Peredo as admin with all permissions");
          resolve(true);
        } catch (updateError) {
          console.error("Error updating Rodrigo to admin:", updateError);
          resolve(false);
        }
      } catch (error) {
        console.error("Error in setRodrigoAsAdmin:", error);
        resolve(false);
      }
    }, 300); // 300ms debounce
  });
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
