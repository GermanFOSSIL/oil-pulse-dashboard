
import { supabase } from "@/integrations/supabase/client";
import { Profile, BulkUserData } from "@/services/types";

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

export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error(`Error fetching profile for user ${userId}:`, error);
    throw error;
  }

  return data as unknown as Profile;
};

export const updateUserProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile> => {
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

  return data as unknown as Profile;
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
        const { data, error } = await supabase.auth.admin.createUser({
          email: user.email,
          password: generateRandomPassword(),
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name
          }
        });
        
        if (error) {
          console.error(`Error creating user ${user.email}:`, error);
          continue;
        }
        
        if (data.user && user.role) {
          await updateUserProfile(data.user.id, {
            role: user.role
          });
        }
        
        successCount++;
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

const generateRandomPassword = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters.charAt(randomIndex);
  }
  
  return password;
};
