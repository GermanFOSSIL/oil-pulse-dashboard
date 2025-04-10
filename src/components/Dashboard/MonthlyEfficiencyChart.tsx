
import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3 } from 'lucide-react';

interface MonthlyEfficiencyChartProps {
  data: {
    name: string;
    inspections: number;
    completions: number;
    issues: number;
  }[];
  className?: string;
}

export const MonthlyEfficiencyChart: React.FC<MonthlyEfficiencyChartProps> = ({ 
  data, 
  className = "" 
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border shadow-sm rounded-md">
          <p className="font-semibold">{label}</p>
          <div className="space-y-1 mt-1">
            {payload.map((entry: any, index: number) => (
              <div 
                key={`item-${index}`}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center">
                  <span 
                    className="h-3 w-3 rounded-full mr-2"
                    style={{ backgroundColor: entry.color }}
                  ></span>
                  <span className="text-sm">{entry.name}</span>
                </div>
                <span className="text-sm font-medium">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate efficiency ratio
  const efficiencyData = data.map(item => {
    const completionRatio = item.inspections > 0 
      ? Math.round((item.completions / item.inspections) * 100) 
      : 0;
      
    return {
      ...item,
      efficiency: completionRatio,
    };
  });

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <span>Actividad Mensual</span>
        </CardTitle>
        <CardDescription>
          Tendencia de inspecciones y completados por mes
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={efficiencyData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB', strokeWidth: 1 }}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                label={{ 
                  value: 'Cantidad', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: 12, fill: '#64748B' }
                }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
                label={{ 
                  value: 'Eficiencia', 
                  angle: 90, 
                  position: 'insideRight',
                  style: { textAnchor: 'middle', fontSize: 12, fill: '#64748B' }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 20 }} />
              
              <Area
                type="monotone"
                dataKey="inspections"
                name="Inspecciones"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.3}
                yAxisId="left"
              />
              <Area
                type="monotone"
                dataKey="completions"
                name="Completados"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.3}
                yAxisId="left"
              />
              <Area
                type="monotone"
                dataKey="issues"
                name="Problemas"
                stroke="#EF4444"
                fill="#EF4444"
                fillOpacity={0.3}
                yAxisId="left"
              />
              <Area
                type="monotone"
                dataKey="efficiency"
                name="Eficiencia"
                stroke="#F59E0B"
                strokeWidth={2}
                fill="none"
                yAxisId="right"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
