import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserProfiles } from '@/services/userService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

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
        const { data, error } = await supabase
          .from('db_activity_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching database activities:', error);
          return;
        }

        const enrichedActivities = await Promise.all((data || []).map(async (activity: any) => {
          if (activity.user_id) {
            try {
              const profiles = await getUserProfiles([activity.user_id]);
              return {
                ...activity,
                userName: profiles[0]?.full_name || "Usuario desconocido"
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
    
    const channel = supabase
      .channel('db-activity-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'db_activity_log' },
        (payload) => {
          setActivities(prevActivities => {
            const newActivity = payload.new as DatabaseActivity;
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
      return format(parseISO(dateString), "d 'de' MMMM, yyyy HH:mm", { locale: es });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <CardDescription>
          Últimas modificaciones realizadas por los usuarios
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
              <div key={activity.id} className="mb-8 last:mb-0">
                <div className="flex items-start">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-muted bg-background z-10 mr-4">
                    <span className="flex h-2 w-2 rounded-full bg-primary"></span>
                  </div>
                  <div className="flex-1 rounded-lg border p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="font-semibold">{activity.userName}</span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{formatDateTime(activity.created_at)}</span>
                      </div>
                    </div>
                    <p className="text-sm">
                      {getActionText(activity)}
                      {activity.details && activity.details.name && 
                        <span className="font-medium"> "{activity.details.name}"</span>
                      }
                    </p>
                  </div>
                </div>
                {index < activities.length - 1 && <div className="h-4"></div>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
