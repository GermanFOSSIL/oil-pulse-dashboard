
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DatabaseActivityTimeline } from "@/components/DatabaseActivityTimeline";
import { getActionLogs, ActionLog } from "@/services/testPackService";

const TestPackActivity = () => {
  const { data: actionLogs, isLoading } = useQuery({
    queryKey: ['actionLogs'],
    queryFn: getActionLogs,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <CardDescription>Historial de acciones realizadas sobre los TAGs</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-4">Acciones sobre TAGs</h3>
              {actionLogs && actionLogs.length > 0 ? (
                <div className="space-y-4">
                  {actionLogs.map((log: ActionLog) => (
                    <div key={log.id} className="border rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{log.user_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.accion} el TAG: <span className="font-medium">{log.tag_name}</span>
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.fecha).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6">No hay acciones registradas</p>
              )}
            </div>
            
            <div>
              <h3 className="font-medium mb-4">Actividad del Sistema</h3>
              <DatabaseActivityTimeline />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestPackActivity;
