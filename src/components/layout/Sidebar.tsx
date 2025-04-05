
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Briefcase,
  Cog,
  Database,
  FileText,
  LayoutDashboard,
  Users,
  FilePieChart,
  Layers,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Projects",
    href: "/projects",
    icon: Briefcase,
  },
  {
    label: "Systems",
    href: "/systems",
    icon: Layers,
  },
  {
    label: "Subsystems",
    href: "/subsystems",
    icon: Layers,
  },
  {
    label: "ITRs",
    href: "/itrs",
    icon: FileText,
  },
  {
    label: "Configuration",
    href: "/configuration",
    icon: Cog,
  },
  {
    label: "Users",
    href: "/users",
    icon: Users,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: FilePieChart,
  },
  {
    label: "Database",
    href: "/database",
    icon: Database,
  },
];

type SidebarProps = {
  isOpen: boolean;
};

const Sidebar = ({ isOpen }: SidebarProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(isOpen);

  const closeSidebar = () => {
    if (isMobile) {
      setOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "bg-sidebar text-sidebar-foreground w-64 flex-shrink-0 transition-all duration-300 ease-in-out z-10",
        isMobile && "fixed h-full shadow-xl"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <div className="flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-sidebar-primary" />
            <h1 className="text-xl font-semibold">OilPulse</h1>
          </div>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={closeSidebar}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm rounded-md transition-colors hover:bg-sidebar-accent group",
                  location.pathname === item.href
                    ? "bg-sidebar-accent text-sidebar-primary font-medium"
                    : "text-sidebar-foreground/80"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 transition-colors",
                    location.pathname === item.href
                      ? "text-sidebar-primary"
                      : "text-sidebar-foreground/80 group-hover:text-sidebar-foreground"
                  )}
                />
                {item.label}
              </Link>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-primary font-semibold">
              OP
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">OilPulse Admin</p>
              <p className="text-xs text-sidebar-foreground/70">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
