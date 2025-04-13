
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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
    // Delete user profile
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) throw profileError;

    // Delete auth user (requires admin rights)
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
    // Check if email is already in use
    const { data: existingUsers } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", userData.email);

    if (existingUsers && existingUsers.length > 0) {
      throw new Error("Email already in use");
    }

    // Create auth user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
        },
      },
    });

    if (authError) throw authError;

    // Create profile (handle in signUp trigger)
    return authData;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
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
    
    // Get the user profile
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

// Fix the method to properly return a Promise
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
