
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getUserPermissions } from "@/services/userPermissionService";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  permissions: string[];
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch permissions if user is logged in
        if (session?.user) {
          try {
            const userPermissions = await getUserPermissions(session.user.id);
            setPermissions(userPermissions);
          } catch (error) {
            console.error("Error fetching user permissions:", error);
            setPermissions([]);
          }
        } else {
          setPermissions([]);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log("Initial session check:", session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      // Fetch permissions if user is logged in
      if (session?.user) {
        try {
          const userPermissions = await getUserPermissions(session.user.id);
          setPermissions(userPermissions);
        } catch (error) {
          console.error("Error fetching user permissions:", error);
          setPermissions([]);
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, permissions, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
