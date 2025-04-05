
import { cn } from "@/lib/utils";

type StatusType = "complete" | "inprogress" | "delayed";

const statusConfig = {
  complete: {
    label: "Complete",
    className: "status-complete",
  },
  inprogress: {
    label: "In Progress",
    className: "status-inprogress",
  },
  delayed: {
    label: "Delayed",
    className: "status-delayed",
  },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  customLabel?: string;
}

export function StatusBadge({
  status,
  className,
  customLabel,
}: StatusBadgeProps) {
  const { label, className: statusClassName } = statusConfig[status];
  
  return (
    <span className={cn("status-badge", statusClassName, className)}>
      {customLabel || label}
    </span>
  );
}
