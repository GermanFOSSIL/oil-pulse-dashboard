
import { supabase } from "@/integrations/supabase/client";
import { PasswordChangeData } from "@/services/types";

/**
 * Change a user's password
 */
export const changeUserPassword = async (data: PasswordChangeData): Promise<{ success: boolean; message: string }> => {
  try {
    console.log("Changing password for user:", data.userId);
    
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

/**
 * Generate a random password
 */
export const generateRandomPassword = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters.charAt(randomIndex);
  }
  
  return password;
};
