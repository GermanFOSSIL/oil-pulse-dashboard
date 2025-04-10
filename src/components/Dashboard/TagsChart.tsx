
import React from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tag } from 'lucide-react';

interface TagsChartProps {
  data: { name: string; value: number; }[];
  className?: string;
}

const COLORS = ['#10B981', '#F97316']; // Green for released, Orange for pending
const RADIAN = Math.PI / 180;

const TagsChart: React.FC<TagsChartProps> = ({ data, className = "" }) => {
  // Custom label for the pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border shadow-sm rounded-md">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm">Cantidad: {payload[0].value}</p>
          <p className="text-sm">Porcentaje: {((payload[0].value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            <span>Estado de Tags</span>
          </CardTitle>
          <span className="text-sm font-semibold bg-muted px-2 py-1 rounded-md">
            Total: {total}
          </span>
        </div>
        <CardDescription>
          Distribución de tags liberados y pendientes
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={90}
                innerRadius={40}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ paddingTop: 20 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export { TagsChart };
