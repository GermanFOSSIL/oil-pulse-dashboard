
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface TestPackStatsProps {
  stats: any;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

const TestPackStats = ({ stats }: TestPackStatsProps) => {
  if (!stats) {
    return <div>No hay datos estadísticos disponibles</div>;
  }

  // Prepare data for pie charts
  const testPacksData = [
    { name: 'Completados', value: stats.testPacks.completed },
    { name: 'Pendientes', value: stats.testPacks.total - stats.testPacks.completed }
  ];
  
  const tagsData = [
    { name: 'Liberados', value: stats.tags.released },
    { name: 'Pendientes', value: stats.tags.total - stats.tags.released }
  ];
  
  // Progress bars for systems
  const systemsProgress = stats.systems.sort((a: any, b: any) => b.progress - a.progress);
  
  // Progress bars for ITRs
  const itrsProgress = stats.itrs.sort((a: any, b: any) => b.progress - a.progress);

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
                <span>{stats.testPacks.progress}%</span>
              </div>
              <Progress value={stats.testPacks.progress} className="h-2 mb-4" />
              <div className="text-sm text-muted-foreground mb-2">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>{stats.testPacks.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completados:</span>
                  <span>{stats.testPacks.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pendientes:</span>
                  <span>{stats.testPacks.total - stats.testPacks.completed}</span>
                </div>
              </div>
              
              <div className="h-[180px] mt-4">
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
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">TAGs</h3>
                <span>{stats.tags.progress}%</span>
              </div>
              <Progress value={stats.tags.progress} className="h-2 mb-4" />
              <div className="text-sm text-muted-foreground mb-2">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>{stats.tags.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Liberados:</span>
                  <span>{stats.tags.released}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pendientes:</span>
                  <span>{stats.tags.total - stats.tags.released}</span>
                </div>
              </div>
              
              <div className="h-[180px] mt-4">
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
                    <h3 className="font-medium">{system.name}</h3>
                    <span>{system.progress}%</span>
                  </div>
                  <Progress value={system.progress} className="h-2 mb-1" />
                  <div className="text-xs text-muted-foreground">
                    {system.completed} de {system.total} completados
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
                    <h3 className="font-medium">{itr.name}</h3>
                    <span>{itr.progress}%</span>
                  </div>
                  <Progress value={itr.progress} className="h-2 mb-1" />
                  <div className="text-xs text-muted-foreground">
                    {itr.completed} de {itr.total} completados
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
            {stats.subsystems.length > 0 ? (
              [...stats.subsystems]
                .sort((a: any, b: any) => b.progress - a.progress)
                .slice(0, 5)
                .map((subsystem: any, index: number) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-medium">{subsystem.name}</h3>
                        <div className="text-xs text-muted-foreground">
                          Sistema: {subsystem.system}
                        </div>
                      </div>
                      <span>{subsystem.progress}%</span>
                    </div>
                    <Progress value={subsystem.progress} className="h-2 mb-1" />
                    <div className="text-xs text-muted-foreground">
                      {subsystem.completed} de {subsystem.total} completados
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
