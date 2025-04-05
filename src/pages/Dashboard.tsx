
import { AreaChart, BarChart3, Briefcase, Layers } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressCard } from "@/components/ui/progress-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Area, AreaChart as RechartsAreaChart, CartesianGrid, Legend } from "recharts";

const chartData = [
  { name: "Jan", value: 400 },
  { name: "Feb", value: 300 },
  { name: "Mar", value: 500 },
  { name: "Apr", value: 700 },
  { name: "May", value: 400 },
  { name: "Jun", value: 300 },
  { name: "Jul", value: 500 },
];

const areaChartData = [
  { 
    name: "Jan", 
    inspections: 40, 
    completions: 24, 
    issues: 10 
  },
  { 
    name: "Feb", 
    inspections: 30, 
    completions: 18, 
    issues: 8 
  },
  { 
    name: "Mar", 
    inspections: 80, 
    completions: 32, 
    issues: 14 
  },
  { 
    name: "Apr", 
    inspections: 90, 
    completions: 45, 
    issues: 6 
  },
  { 
    name: "May", 
    inspections: 70, 
    completions: 52, 
    issues: 5 
  },
  { 
    name: "Jun", 
    inspections: 60, 
    completions: 40, 
    issues: 12 
  },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Project management overview and key metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value="12"
          description="Active oil and gas projects"
          icon={<Briefcase className="h-4 w-4" />}
          trend={{ value: 16, positive: true }}
        />
        <StatCard
          title="Systems"
          value="48"
          description="Across all projects"
          icon={<Layers className="h-4 w-4" />}
          trend={{ value: 8, positive: true }}
        />
        <StatCard
          title="ITRs"
          value="324"
          description="Total inspection records"
          icon={<BarChart3 className="h-4 w-4" />}
          trend={{ value: 5, positive: true }}
        />
        <StatCard
          title="Completion Rate"
          value="72%"
          description="Average across all projects"
          icon={<AreaChart className="h-4 w-4" />}
          trend={{ value: 12, positive: true }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ProgressCard
          title="North Sea Platform A"
          value={78}
          description="78 of 100 ITRs completed"
          variant="success"
          className="col-span-1"
        />
        <ProgressCard
          title="Gulf of Mexico Drilling"
          value={45}
          description="45 of 100 ITRs completed"
          variant="warning"
          className="col-span-1"
        />
        <ProgressCard
          title="Caspian Pipeline"
          value={23}
          description="23 of 100 ITRs completed"
          variant="danger"
          className="col-span-1"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>
              Monthly completion rates across all projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
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
            <CardTitle>ITR Activity</CardTitle>
            <CardDescription>
              Inspection and completion trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsAreaChart data={areaChartData}>
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
