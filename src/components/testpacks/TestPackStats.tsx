
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface TestPackStatsProps {
  stats: any;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

const TestPackStats = ({ stats }: TestPackStatsProps) => {
  // Early return with a loading state if stats is not provided
  if (!stats) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cargando estadísticas...</CardTitle>
            <CardDescription>Por favor espere mientras se cargan los datos</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Safely access nested properties with default values
  const testPacksTotal = stats.testPacks?.total || 0;
  const testPacksCompleted = stats.testPacks?.completed || 0;
  const testPacksProgress = stats.testPacks?.progress || 0;
  
  const tagsTotal = stats.tags?.total || 0;
  const tagsReleased = stats.tags?.released || 0;
  const tagsProgress = stats.tags?.progress || 0;
  
  // Prepare data for pie charts with safe values
  const testPacksData = [
    { name: 'Completados', value: testPacksCompleted },
    { name: 'Pendientes', value: testPacksTotal - testPacksCompleted }
  ].filter(item => item.value > 0);
  
  const tagsData = [
    { name: 'Liberados', value: tagsReleased },
    { name: 'Pendientes', value: tagsTotal - tagsReleased }
  ].filter(item => item.value > 0);
  
  // Progress bars for systems with safe access
  const systemsProgress = (stats.systems || []).sort((a: any, b: any) => (b.progress || 0) - (a.progress || 0));
  
  // Progress bars for ITRs with safe access
  const itrsProgress = (stats.itrs || []).sort((a: any, b: any) => (b.progress || 0) - (a.progress || 0));

  // Subsystems with safe access
  const subsystems = (stats.subsystems || []);

  // If there's no data at all, show a no data state
  if (testPacksTotal === 0 && tagsTotal === 0 && systemsProgress.length === 0 && itrsProgress.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>No hay datos disponibles</CardTitle>
            <CardDescription>Aún no hay Test Packs o ITRs en el sistema</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              Cree Test Packs para comenzar a ver estadísticas aquí
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumen General</CardTitle>
          <CardDescription>Estado actual de Test Packs y TAGs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Test Packs</h3>
                <span>{testPacksProgress}%</span>
              </div>
              <Progress value={testPacksProgress} className="h-2 mb-4" />
              <div className="text-sm text-muted-foreground mb-2">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>{testPacksTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completados:</span>
                  <span>{testPacksCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pendientes:</span>
                  <span>{testPacksTotal - testPacksCompleted}</span>
                </div>
              </div>
              
              <div className="h-[180px] mt-4">
                {testPacksData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={testPacksData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {testPacksData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">No hay datos para mostrar</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">TAGs</h3>
                <span>{tagsProgress}%</span>
              </div>
              <Progress value={tagsProgress} className="h-2 mb-4" />
              <div className="text-sm text-muted-foreground mb-2">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>{tagsTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Liberados:</span>
                  <span>{tagsReleased}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pendientes:</span>
                  <span>{tagsTotal - tagsReleased}</span>
                </div>
              </div>
              
              <div className="h-[180px] mt-4">
                {tagsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tagsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {tagsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">No hay datos para mostrar</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Progreso por Sistema</CardTitle>
          <CardDescription>Avance de liberación de TAGs por sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {systemsProgress.length > 0 ? (
              systemsProgress.map((system: any, index: number) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">{system.name || "Sin nombre"}</h3>
                    <span>{system.progress || 0}%</span>
                  </div>
                  <Progress value={system.progress || 0} className="h-2 mb-1" />
                  <div className="text-xs text-muted-foreground">
                    {system.completed || 0} de {system.total || 0} completados
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No hay datos disponibles</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Progreso por ITR</CardTitle>
          <CardDescription>Avance de liberación de TAGs por ITR</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {itrsProgress.length > 0 ? (
              itrsProgress.map((itr: any, index: number) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">{itr.name || "Sin nombre"}</h3>
                    <span>{itr.progress || 0}%</span>
                  </div>
                  <Progress value={itr.progress || 0} className="h-2 mb-1" />
                  <div className="text-xs text-muted-foreground">
                    {itr.completed || 0} de {itr.total || 0} completados
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No hay datos disponibles</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Progreso por Subsistema</CardTitle>
          <CardDescription>Los subsistemas con mayor avance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {subsystems.length > 0 ? (
              [...subsystems]
                .sort((a: any, b: any) => (b.progress || 0) - (a.progress || 0))
                .slice(0, 5)
                .map((subsystem: any, index: number) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-medium">{subsystem.name || "Sin nombre"}</h3>
                        <div className="text-xs text-muted-foreground">
                          Sistema: {subsystem.system || "Sin sistema"}
                        </div>
                      </div>
                      <span>{subsystem.progress || 0}%</span>
                    </div>
                    <Progress value={subsystem.progress || 0} className="h-2 mb-1" />
                    <div className="text-xs text-muted-foreground">
                      {subsystem.completed || 0} de {subsystem.total || 0} completados
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No hay datos disponibles</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestPackStats;
