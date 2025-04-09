
import { BulkUserData, UserCreateData } from "@/services/types";
import { createUser } from "@/services/userService";
import { generateRandomPassword } from "@/services/userPasswordService";

/**
 * Create multiple users at once
 */
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
