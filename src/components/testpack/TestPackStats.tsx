
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatsData } from "@/services/types";
import { getTestPackStats, getTagCompletionData } from "@/services/testPackService";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export const TestPackStats = () => {
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const stats = await getTestPackStats();
        const tagData = await getTagCompletionData();
        
        setStatsData(stats);
        setChartData(tagData);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (!statsData) {
    return <div>No data available</div>;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Test Packs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statsData.totalPacks}</div>
          <p className="text-xs text-muted-foreground">
            {statsData.completedPacks} completados, {statsData.pendingPacks} pendientes
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statsData.totalTags}</div>
          <p className="text-xs text-muted-foreground">
            {statsData.releasedTags} liberados, {statsData.pendingTags} pendientes
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa de Completado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statsData.completionRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            Test packs completados
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estado de Tags</CardTitle>
        </CardHeader>
        <CardContent className="h-[100px]">
          {chartData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={40}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  label={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
