
import { useEffect, useState } from "react";
import { AreaChart, BarChart3, Briefcase, Layers } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressCard } from "@/components/ui/progress-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Area, AreaChart as RechartsAreaChart, CartesianGrid, Legend } from "recharts";
import { getDashboardStats } from "@/services/supabaseService";
import { initializeStorage } from "@/services/storageService";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  totalProjects: number;
  totalSystems: number;
  totalITRs: number;
  completionRate: number;
  projectsData: {
    title: string;
    value: number;
    description: string;
    variant: "success" | "warning" | "danger";
  }[];
  chartData: { name: string; value: number }[];
  areaChartData: { 
    name: string; 
    inspections: number; 
    completions: number; 
    issues: number;
  }[];
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      // Inicializar buckets de almacenamiento
      await initializeStorage();
      
      // Obtener estadísticas del dashboard
      const dashboardData = await getDashboardStats();
      setStats(dashboardData as DashboardStats);
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Refetch data every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Display empty state if no data exists
  const isEmpty = !stats || (
    stats.totalProjects === 0 &&
    stats.totalSystems === 0 &&
    stats.totalITRs === 0
  );

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de la gestión de proyectos y métricas clave
          </p>
        </div>
        
        <Card className="p-8">
          <div className="text-center space-y-6">
            <div className="mx-auto max-w-md">
              <h2 className="text-2xl font-bold">No hay datos disponibles</h2>
              <p className="text-muted-foreground mt-2">
                La aplicación no tiene datos cargados. Puede importar datos desde la sección de configuración.
              </p>
            </div>
            <Button onClick={() => navigate('/configuration')}>
              Ir a configuración
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen de la gestión de proyectos y métricas clave
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Proyectos"
          value={stats.totalProjects.toString()}
          description="Proyectos activos de petróleo y gas"
          icon={<Briefcase className="h-4 w-4" />}
          trend={{ value: 0, positive: true }}
        />
        <StatCard
          title="Sistemas"
          value={stats.totalSystems.toString()}
          description="A través de todos los proyectos"
          icon={<Layers className="h-4 w-4" />}
          trend={{ value: 0, positive: true }}
        />
        <StatCard
          title="ITRs"
          value={stats.totalITRs.toString()}
          description="Total de registros de inspección"
          icon={<BarChart3 className="h-4 w-4" />}
          trend={{ value: 0, positive: true }}
        />
        <StatCard
          title="Tasa de Completado"
          value={`${stats.completionRate}%`}
          description="Promedio en todos los proyectos"
          icon={<AreaChart className="h-4 w-4" />}
          trend={{ value: 0, positive: true }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.projectsData.map((project, index) => (
          <ProgressCard
            key={index}
            title={project.title}
            value={project.value}
            description={project.description}
            variant={project.variant}
            className="col-span-1"
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Progreso del Proyecto</CardTitle>
            <CardDescription>
              Tasas de finalización mensuales en todos los proyectos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.chartData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--secondary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad ITR</CardTitle>
            <CardDescription>
              Tendencias de inspección y finalización
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsAreaChart data={stats.areaChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="inspections" 
                  stroke="hsl(var(--secondary))" 
                  fill="hsl(var(--secondary)/0.2)" 
                  stackId="1" 
                />
                <Area 
                  type="monotone" 
                  dataKey="completions" 
                  stroke="#22c55e" 
                  fill="#22c55e20" 
                  stackId="2" 
                />
                <Area 
                  type="monotone" 
                  dataKey="issues" 
                  stroke="#ef4444" 
                  fill="#ef444420" 
                  stackId="3" 
                />
              </RechartsAreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
