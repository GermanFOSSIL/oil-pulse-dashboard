
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { UserIcon, CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ActivityItem {
  id: string;
  user_id?: string;
  table_name: string;
  action: string;
  details?: any;
  created_at: string;
  record_id?: string;
  user_name?: string;
}

export const DatabaseActivityTimeline = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        // Fetch the last 10 activities from the database
        const { data: activityData, error } = await supabase
          .from('db_activity_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        // Fetch user profiles to add names to the activities
        if (activityData && activityData.length > 0) {
          // Get unique user IDs
          const userIds = [...new Set(activityData.filter(item => item.user_id).map(item => item.user_id))];
          
          // Fetch user profiles
          if (userIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', userIds);

            // Map user names to activities
            const activitiesWithUserNames = activityData.map(activity => {
              const userProfile = profiles?.find(profile => profile.id === activity.user_id);
              return {
                ...activity,
                user_name: userProfile?.full_name || 'Usuario desconocido'
              };
            });

            setActivities(activitiesWithUserNames);
          } else {
            setActivities(activityData);
          }
        } else {
          setActivities([]);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('db-activity-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'db_activity_log' }, 
        payload => {
          setActivities(prevActivities => {
            const newActivity = payload.new as ActivityItem;
            // Avoid duplicates
            if (prevActivities.some(a => a.id === newActivity.id)) {
              return prevActivities;
            }
            return [newActivity, ...prevActivities].slice(0, 10);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'insert':
        return 'bg-green-500';
      case 'update':
        return 'bg-blue-500';
      case 'delete':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'insert':
        return 'Añadido';
      case 'update':
        return 'Actualizado';
      case 'delete':
        return 'Eliminado';
      default:
        return action;
    }
  };

  const getTableText = (tableName: string) => {
    const tableMap: Record<string, string> = {
      'projects': 'Proyecto',
      'systems': 'Sistema',
      'subsystems': 'Subsistema',
      'itrs': 'ITR',
      'tags': 'TAG',
      'test_packs': 'Test Pack',
      'tasks': 'Tarea',
      'profiles': 'Perfil'
    };
    
    return tableMap[tableName] || tableName;
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es });
    } catch (error) {
      return "fecha desconocida";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <CardDescription>
          Últimas acciones en la base de datos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                  <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            No hay actividad reciente para mostrar
          </p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 h-full w-px bg-muted"></div>
            
            {activities.map((activity) => (
              <div key={activity.id} className="mb-8 grid last:mb-0">
                <div className="flex items-start">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border border-muted bg-background z-10 mr-4`}>
                    <span className={`flex h-2 w-2 rounded-full ${getActionColor(activity.action)}`}></span>
                  </div>
                  <div className="flex-1 rounded-lg border p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                      <h3 className="font-semibold tracking-tight">
                        {getActionText(activity.action)} {getTableText(activity.table_name)}
                      </h3>
                      <span className="text-xs text-muted-foreground mt-1 sm:mt-0">
                        {formatTimeAgo(activity.created_at)}
                      </span>
                    </div>
                    
                    {activity.details && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {typeof activity.details === 'object' 
                          ? JSON.stringify(activity.details) 
                          : activity.details}
                      </p>
                    )}
                    
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {activity.user_name && (
                        <div className="flex items-center">
                          <UserIcon className="mr-1 h-3 w-3" />
                          <span>{activity.user_name}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        <span>
                          {new Date(activity.created_at).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
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
