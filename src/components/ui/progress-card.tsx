
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressCardProps {
  title: string;
  value: number;
  total?: number;
  description?: string;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

export function ProgressCard({
  title,
  value,
  total = 100,
  description,
  variant = "default",
  className,
}: ProgressCardProps) {
  const percentage = Math.round((value / total) * 100);
  
  const progressColorClass = {
    default: "",
    success: "text-status-complete",
    warning: "text-status-inprogress",
    danger: "text-status-delayed",
  }[variant];
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("text-sm font-medium", progressColorClass)}>
          {percentage}%
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress
          value={percentage}
          className={cn(
            variant === "success" && "bg-status-complete/20 [&>div]:bg-status-complete",
            variant === "warning" && "bg-status-inprogress/20 [&>div]:bg-status-inprogress",
            variant === "danger" && "bg-status-delayed/20 [&>div]:bg-status-delayed"
          )}
        />
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
