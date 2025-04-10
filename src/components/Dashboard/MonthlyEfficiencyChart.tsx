
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
import { CalendarIcon, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

type MonthlyEfficiencyChartProps = {
  data: any[];
  className?: string;
  onExport?: () => void;
};

export const MonthlyEfficiencyChart = ({ data, className = "", onExport }: MonthlyEfficiencyChartProps) => {
  // Calculate date range for the last 6 months
  const endDate = new Date();
  const startDate = subMonths(endDate, 6);
  const dateRange = `${format(startDate, 'dd MMM', { locale: es })} - ${format(endDate, 'dd MMM yyyy', { locale: es })}`;

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Eficiencia Mensual</CardTitle>
          <CardDescription className="flex items-center mt-1 text-xs">
            <CalendarIcon className="h-3 w-3 mr-1" />
            {dateRange}
          </CardDescription>
        </div>
        {onExport && (
          <Button variant="ghost" size="sm" onClick={onExport}>
            <Download className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-80 w-full px-4 pb-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorInspections" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9b87f5" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#9b87f5" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB', strokeWidth: 1 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB', strokeWidth: 1 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }} 
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="inspections" 
                name="Inspecciones"
                stroke="#9b87f5" 
                fillOpacity={1}
                fill="url(#colorInspections)" 
                strokeWidth={2}
                activeDot={{ r: 6 }}
              />
              <Area 
                type="monotone" 
                dataKey="completions" 
                name="Completados"
                stroke="#22c55e" 
                fillOpacity={1}
                fill="url(#colorCompletions)" 
                strokeWidth={2}
                activeDot={{ r: 6 }}
              />
              <Area 
                type="monotone" 
                dataKey="issues" 
                name="Problemas"
                stroke="#ef4444" 
                fillOpacity={1}
                fill="url(#colorIssues)" 
                strokeWidth={2}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
