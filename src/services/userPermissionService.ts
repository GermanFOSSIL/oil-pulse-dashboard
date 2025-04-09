
import { UserProfile, getUserProfile } from "@/services/userService";

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

/**
 * Get user permissions based on user ID
 */
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

/**
 * Generate default permissions based on user role
 */
export const getDefaultPermissionsForRole = (role: string): string[] => {
  if (role === 'admin') {
    return [...AVAILABLE_PERMISSIONS];
  } else if (role === 'tecnico') {
    return ['dashboard', 'reports', 'itrs'];
  } else {
    return ['dashboard', 'reports'];
  }
};
