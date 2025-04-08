
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getUserProfile } from "@/services/userService";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DBActivity } from "@/services/types";

export const DatabaseActivityTimeline = () => {
  const [activities, setActivities] = useState<DBActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        // Execute a raw query to get activity log data
        const { data, error } = await supabase
          .from('db_activity_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

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

        setActivities(enrichedActivities as DBActivity[]);
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
            const newActivity = payload.new as DBActivity;
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

  const getActionText = (activity: DBActivity) => {
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
        <CardTitle>Línea de Tiempo</CardTitle>
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
          <div className="relative">
            <div className="absolute left-4 h-full w-px bg-muted"></div>
            
            {activities.map((activity, index) => (
              <div key={activity.id} className="mb-8 grid gap-2 last:mb-0 md:grid-cols-[1fr_4fr]">
                <div className="flex items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-muted bg-background z-10">
                    <span className="flex h-2 w-2 rounded-full bg-primary"></span>
                  </div>
                  <div className="ml-4 text-sm">
                    {format(new Date(activity.created_at), "d/M", { locale: es })}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold tracking-tight">
                    {activity.action === 'INSERT' && `Creación de ${activity.table_name === 'profiles' ? 'Perfil' : activity.table_name}`}
                    {activity.action === 'UPDATE' && `Actualización de ${activity.table_name === 'profiles' ? 'Perfil' : activity.table_name}`}
                    {activity.action === 'DELETE' && `Eliminación de ${activity.table_name === 'profiles' ? 'Perfil' : activity.table_name}`}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getActionText(activity)}
                  </p>
                  <div className="mt-2 flex items-center text-xs text-muted-foreground">
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    <span>
                      Responsable: {activity.userName}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
