
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getUserProfile } from "@/services/userService";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DatabaseActivity {
  id: string;
  created_at: string;
  table_name: string;
  action: string;
  user_id: string | null;
  record_id: string | null;
  details?: any;
  userName?: string;
}

export const DatabaseActivityTimeline = () => {
  const [activities, setActivities] = useState<DatabaseActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        // Use a direct query with executeRaw instead of typed query builder
        const { data, error } = await supabase
          .rpc('get_recent_activity', { limit_count: 10 })
          .then(result => {
            if (result.error) throw result.error;
            return { data: result.data, error: null };
          })
          .catch(() => {
            console.error('Falling back to direct query since RPC call failed');
            // Fallback to direct query if RPC doesn't exist
            return supabase
              .from('db_activity_log')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(10);
          });

        if (error) {
          console.error('Error fetching database activities:', error);
          return;
        }

        // Enrich with user names
        const enrichedActivities = await Promise.all((data || []).map(async (activity: any) => {
          if (activity.user_id) {
            try {
              const profile = await getUserProfile(activity.user_id);
              return {
                ...activity,
                userName: profile?.full_name || "Usuario desconocido"
              };
            } catch (error) {
              console.error('Error fetching user profile:', error);
              return {
                ...activity,
                userName: "Usuario desconocido"
              };
            }
          }
          return {
            ...activity,
            userName: "Sistema"
          };
        }));

        setActivities(enrichedActivities as DatabaseActivity[]);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('db-activity-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'db_activity_log' },
        (payload) => {
          setActivities(prevActivities => {
            const newActivity = payload.new as DatabaseActivity;
            // To avoid duplicates
            if (prevActivities.some(act => act.id === newActivity.id)) {
              return prevActivities;
            }
            return [newActivity, ...prevActivities].slice(0, 10);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getActionText = (activity: DatabaseActivity) => {
    const actionMap: Record<string, string> = {
      'INSERT': 'creó',
      'UPDATE': 'actualizó',
      'DELETE': 'eliminó'
    };
    
    const tableMap: Record<string, string> = {
      'itrs': 'un ITR',
      'projects': 'un Proyecto',
      'systems': 'un Sistema',
      'subsystems': 'un Subsistema',
      'profiles': 'un Perfil de Usuario',
      'tasks': 'una Tarea'
    };
    
    const action = actionMap[activity.action] || activity.action;
    const table = tableMap[activity.table_name] || activity.table_name;
    
    return `${action} ${table}`;
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy HH:mm", { locale: es });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad de la Base de Datos</CardTitle>
        <CardDescription>
          Últimas modificaciones a la base de datos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : activities.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">No hay actividad reciente</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id} className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">{activity.userName}</span>
                    <span className="ml-2 text-muted-foreground">
                      {getActionText(activity)}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDateTime(activity.created_at)}
                  </span>
                </div>
                {index < activities.length - 1 && <Separator className="mt-2" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
