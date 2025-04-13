
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';

export const AVAILABLE_PERMISSIONS = [
  "view_dashboard",
  "manage_projects",
  "manage_systems",
  "manage_subsystems",
  "manage_itrs",
  "manage_users",
  "manage_reports",
  "export_data"
];

export interface UserProfile {
  id: string;
  full_name?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BulkUserData {
  email: string;
  full_name: string;
  role?: string;
  password?: string;
}

export const getUserPermissions = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("permissions")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data?.permissions || [];
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return [];
  }
};

export const getUserProfiles = async () => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching user profiles:", error);
    throw error;
  }
};

export const getUserByEmail = async (email) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user profile by email:", error);
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user profile by ID:", error);
    throw error;
  }
};

export const getUsers = async () => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(userData)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) throw profileError;

    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) throw authError;

    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const { data: existingUsers } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", userData.email);

    if (existingUsers && existingUsers.length > 0) {
      throw new Error("Email already in use");
    }

    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
        },
      },
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const bulkCreateUsers = async (users: BulkUserData[]) => {
  let successCount = 0;
  
  for (const userData of users) {
    try {
      const result = await createUser({
        email: userData.email,
        password: userData.password || generateRandomPassword(),
        full_name: userData.full_name,
        role: userData.role || 'user',
        permissions: []
      });
      
      if (result.user) {
        successCount++;
      }
    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error);
    }
  }
  
  return successCount;
};

const generateRandomPassword = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const updateUserRole = async (userId, role) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

export const updateUserPermissions = async (userId, permissions) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ permissions })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating user permissions:", error);
    throw error;
  }
};

export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error sending password reset:", error);
    throw error;
  }
};

export const updatePassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) return null;
    
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();
    
    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return {
        id: data.user.id,
        email: data.user.email
      };
    }
    
    return profile;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

export const getAuthSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
};

export const updateUserProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(profileData)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

export const confirmPasswordReset = (token, newPassword) => {
  return supabase.auth.updateUser({ password: newPassword })
    .then(({ data, error }) => {
      if (error) throw error;
      return data;
    })
    .catch(error => {
      console.error("Error confirming password reset:", error);
      throw error;
    });
};

export const changeUserPassword = async ({ userId, newPassword }) => {
  try {
    const { error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );
    
    if (error) throw error;
    
    return { 
      success: true, 
      message: "Password updated successfully" 
    };
  } catch (error) {
    console.error("Error updating password:", error);
    return { 
      success: false, 
      message: error.message || "Failed to update password" 
    };
  }
};

export const setRodrigoAsAdmin = async () => {
  try {
    const { data: rodrigoProfile } = await supabase
      .from("profiles")
      .select("*")
      .or("email.eq.rodrigo@fossilenergies.com,full_name.ilike.%rodrigo%peredo%")
      .limit(1);
    
    if (!rodrigoProfile || rodrigoProfile.length === 0) {
      console.log("Rodrigo's profile not found");
      return false;
    }
    
    const { error } = await supabase
      .from("profiles")
      .update({
        role: "admin",
        permissions: AVAILABLE_PERMISSIONS
      })
      .eq("id", rodrigoProfile[0].id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error setting admin:", error);
    return false;
  }
};
