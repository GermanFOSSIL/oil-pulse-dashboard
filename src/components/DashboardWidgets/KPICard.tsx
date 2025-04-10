
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type KPICardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  valueSize?: 'small' | 'medium' | 'large';
};

export const KPICard = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  className = "",
  valueSize = 'large'
}: KPICardProps) => {
  // Determine value size class
  const valueSizeClass = {
    'small': 'text-2xl',
    'medium': 'text-3xl',
    'large': 'text-4xl'
  }[valueSize];

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <div className={`font-bold ${valueSizeClass}`}>{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div className={`flex items-center text-sm ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              <span className="mr-1">
                {trend.isPositive ? '↑' : '↓'}
              </span>
              {trend.value}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
