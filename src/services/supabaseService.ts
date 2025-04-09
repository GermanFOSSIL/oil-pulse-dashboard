import { supabase } from "@/integrations/supabase/client";
import { getUserProfile } from "./userService";
import { getUserPermissions } from "./userPermissionService";

export { getUserProfile, getUserPermissions };
