
import React, { useState, useCallback } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Download } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

type TestPacksChartProps = {
  data: any[];
  className?: string;
  onExport?: () => void;
};

const COLORS = ['#9b87f5', '#0EA5E9', '#F97316', '#8B5CF6'];

export const TestPacksChart = ({ data, className = "", onExport }: TestPacksChartProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleMouseEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  // Calculate date range for the last 3 months
  const endDate = new Date();
  const startDate = subMonths(endDate, 3);
  const dateRange = `${format(startDate, 'dd MMM', { locale: es })} - ${format(endDate, 'dd MMM yyyy', { locale: es })}`;

  // Custom tooltip content
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border shadow-sm rounded-md">
          <p className="font-semibold">{label}</p>
          <p className="text-sm">Test Packs: {payload[0].value}</p>
          <p className="text-sm">Completados: {payload[0].payload.completed || 0}</p>
          <p className="text-sm">Progreso: {payload[0].payload.progress || 0}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Test Packs por Sistema</CardTitle>
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
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
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
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="value" 
                name="Test Packs" 
                radius={[4, 4, 0, 0]}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                    cursor="pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
