
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/ui/stat-card";
import { StatsData } from "@/services/types";
import { 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  LineChart, Line,
  ComposedChart, Area,
  XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { 
  BarChart2, ChartPie, 
  LineChart as LineChartIcon, 
  TrendingUp, Activity, Calendar 
} from "lucide-react";

interface TestPackStatsProps {
  statsData: StatsData;
}

const COLORS = ["#3b82f6", "#10b981", "#f97316", "#8b5cf6", "#ec4899"];

// Sample daily completion data (would come from API in real implementation)
const dailyCompletionData = [
  { name: "Lun", completions: 4, tags: 8 },
  { name: "Mar", completions: 2, tags: 5 },
  { name: "Mié", completions: 5, tags: 12 },
  { name: "Jue", completions: 8, tags: 15 },
  { name: "Vie", completions: 6, tags: 10 },
  { name: "Sáb", completions: 1, tags: 3 },
  { name: "Dom", completions: 0, tags: 1 },
];

// Weekly trend data (would come from API in real implementation)
const weeklyTrendData = [
  { name: "Sem 1", testPacks: 12, tags: 45, completion: 35 },
  { name: "Sem 2", testPacks: 15, tags: 52, completion: 40 },
  { name: "Sem 3", testPacks: 18, tags: 60, completion: 48 },
  { name: "Sem 4", testPacks: 14, tags: 48, completion: 42 },
  { name: "Sem 5", testPacks: 20, tags: 65, completion: 55 },
  { name: "Sem 6", testPacks: 22, tags: 72, completion: 60 }
];

// Efficiency trend (would come from API in real implementation)
const efficiencyData = [
  { name: "Ene", goal: 40, actual: 35, efficiency: 87.5 },
  { name: "Feb", goal: 42, actual: 40, efficiency: 95.2 },
  { name: "Mar", goal: 45, actual: 38, efficiency: 84.4 },
  { name: "Abr", goal: 48, actual: 45, efficiency: 93.8 },
  { name: "May", goal: 50, actual: 48, efficiency: 96.0 },
  { name: "Jun", goal: 52, actual: 49, efficiency: 94.2 }
];

const TestPackStats = ({ statsData }: TestPackStatsProps) => {
  const { testPacks, tags, systems, subsystems, itrs } = statsData;
  const [chartView, setChartView] = useState("daily");
  
  const formatPercent = (value: number) => `${value}%`;
  
  const avgDailyCompletions = dailyCompletionData.reduce((sum, day) => sum + day.completions, 0) / 
    dailyCompletionData.length;

  const avgTagsPerDay = dailyCompletionData.reduce((sum, day) => sum + day.tags, 0) / 
    dailyCompletionData.length;

  const calculateWeeklyAvg = () => {
    const lastWeek = weeklyTrendData[weeklyTrendData.length - 1];
    const prevWeek = weeklyTrendData[weeklyTrendData.length - 2];
    
    if (!lastWeek || !prevWeek) return { trend: 0, positive: true };
    
    const diff = ((lastWeek.completion - prevWeek.completion) / prevWeek.completion) * 100;
    return {
      trend: Math.abs(parseFloat(diff.toFixed(1))),
      positive: diff >= 0
    };
  };
  
  const weeklyAvg = calculateWeeklyAvg();
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Test Packs Totales"
          value={testPacks.total}
          description={`${testPacks.completed} completados (${formatPercent(testPacks.progress)})`}
          icon={<BarChart2 className="h-4 w-4" />}
          trend={{
            value: weeklyAvg.trend,
            positive: weeklyAvg.positive
          }}
        />
        
        <StatCard
          title="TAGs Totales"
          value={tags.total}
          description={`${tags.released} liberados (${formatPercent(tags.progress)})`}
          icon={<ChartPie className="h-4 w-4" />}
          trend={{
            value: 4.2,
            positive: true
          }}
        />
        
        <StatCard
          title="Promedio Diario"
          value={avgDailyCompletions.toFixed(1)}
          description={`Test Packs completados por día`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        
        <StatCard
          title="Promedio TAGs"
          value={avgTagsPerDay.toFixed(1)}
          description={`TAGs procesados por día`}
          icon={<Activity className="h-4 w-4" />}
        />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Progreso Test Packs</CardTitle>
              <Tabs 
                value={chartView} 
                onValueChange={setChartView}
                className="w-auto"
              >
                <TabsList className="grid w-40 grid-cols-2">
                  <TabsTrigger value="daily">Diario</TabsTrigger>
                  <TabsTrigger value="weekly">Semanal</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <CardDescription>
              Completados vs. Procesados {chartView === "daily" ? "por día" : "por semana"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <div className="h-[300px]">
              <ChartContainer
                config={{
                  completions: {
                    color: "#3b82f6",
                    label: "Completados"
                  },
                  tags: {
                    color: "#f97316",
                    label: "TAGs procesados"
                  },
                  testPacks: {
                    color: "#10b981",
                    label: "Test Packs"
                  },
                  completion: {
                    color: "#8b5cf6",
                    label: "% Completado"
                  }
                }}
              >
                {chartView === "daily" ? (
                  <ComposedChart data={dailyCompletionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <ChartTooltip 
                      content={
                        <ChartTooltipContent/>
                      }
                    />
                    <Legend />
                    <Bar 
                      yAxisId="left"
                      dataKey="completions" 
                      name="completions" 
                      fill="var(--color-completions)" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      yAxisId="left"
                      dataKey="tags" 
                      name="tags" 
                      fill="var(--color-tags)" 
                      radius={[4, 4, 0, 0]}
                    />
                  </ComposedChart>
                ) : (
                  <ComposedChart data={weeklyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <ChartTooltip 
                      content={
                        <ChartTooltipContent/>
                      }
                    />
                    <Legend />
                    <Bar 
                      yAxisId="left"
                      dataKey="testPacks" 
                      name="testPacks" 
                      fill="var(--color-testPacks)" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="completion" 
                      name="completion" 
                      stroke="var(--color-completion)" 
                      strokeWidth={2}
                    />
                  </ComposedChart>
                )}
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Eficiencia Mensual</CardTitle>
            <CardDescription>
              Cumplimiento de objetivos por mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer
                config={{
                  goal: {
                    color: "#3b82f6",
                    label: "Objetivo"
                  },
                  actual: {
                    color: "#10b981",
                    label: "Real"
                  },
                  efficiency: {
                    color: "#f97316",
                    label: "Eficiencia %"
                  }
                }}
              >
                <ComposedChart data={efficiencyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent/>
                    }
                  />
                  <Legend />
                  <Bar 
                    yAxisId="left"
                    dataKey="goal" 
                    name="goal" 
                    fill="var(--color-goal)" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="actual" 
                    name="actual" 
                    fill="var(--color-actual)" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="efficiency" 
                    name="efficiency" 
                    stroke="var(--color-efficiency)" 
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
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
          <CardHeader>
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
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Avance por ITR</CardTitle>
            <CardDescription>Top 5 ITRs por cantidad de Test Packs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {itrs.length > 0 ? (
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
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No hay datos disponibles</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sistemas</CardTitle>
            <CardDescription>Top 5 sistemas por cantidad de Test Packs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {systems.length > 0 ? (
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
            <CardTitle>Subsistemas</CardTitle>
            <CardDescription>Top 5 subsistemas por cantidad de Test Packs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {subsystems.length > 0 ? (
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
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No hay datos disponibles</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestPackStats;
