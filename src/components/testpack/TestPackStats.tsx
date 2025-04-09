
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { StatsData } from "@/services/types";

interface TestPackStatsProps {
  statsData: StatsData;
}

const COLORS = ["#3b82f6", "#10b981", "#f97316", "#8b5cf6", "#ec4899"];

const TestPackStats = ({ statsData }: TestPackStatsProps) => {
  const { testPacks, tags, systems, subsystems, itrs } = statsData;
  
  const formatPercent = (value: number) => `${value}%`;
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Test Packs</CardTitle>
          <CardDescription>Resumen de Test Packs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{testPacks.total} test pack(s)</div>
          <p className="text-xs text-muted-foreground">
            {testPacks.completed} completados
          </p>
          <div className="mt-4 flex items-center space-x-2">
            <div className="flex-1">
              <Progress value={testPacks.progress} className="h-2" />
            </div>
            <div className="text-sm font-medium">{formatPercent(testPacks.progress)}</div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">TAGs</CardTitle>
          <CardDescription>Resumen de TAGs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{tags.total} tag(s)</div>
          <p className="text-xs text-muted-foreground">
            {tags.released} liberados
          </p>
          <div className="mt-4 flex items-center space-x-2">
            <div className="flex-1">
              <Progress value={tags.progress} className="h-2" />
            </div>
            <div className="text-sm font-medium">{formatPercent(tags.progress)}</div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Avance por ITR</CardTitle>
          <CardDescription>Top 5 ITRs por cantidad de Test Packs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            {itrs.length > 0 ? (
              <ChartContainer>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={itrs}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {itrs.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} test pack(s)`, 'Cantidad']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No hay datos disponibles</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sistemas</CardTitle>
          <CardDescription>Top 5 sistemas por cantidad de Test Packs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            {systems.length > 0 ? (
              <ChartContainer>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={systems}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {systems.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} test pack(s)`, 'Cantidad']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No hay datos disponibles</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subsistemas</CardTitle>
          <CardDescription>Top 5 subsistemas por cantidad de Test Packs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            {subsystems.length > 0 ? (
              <ChartContainer>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subsystems}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {subsystems.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} test pack(s)`, 'Cantidad']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
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
