import { useState, useEffect } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { getUserPermissions } from "@/services/userService";
import { LogoutButton } from "@/components/ui/logout-button";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    permission: "dashboard"
  },
  {
    label: "Projects",
    href: "/projects",
    icon: Briefcase,
    permission: "projects"
  },
  {
    label: "Systems",
    href: "/systems",
    icon: Layers,
    permission: "systems"
  },
  {
    label: "Subsystems",
    href: "/subsystems",
    icon: Layers,
    permission: "subsystems"
  },
  {
    label: "ITRs",
    href: "/itrs",
    icon: FileText,
    permission: "itrs"
  },
  {
    label: "Configuration",
    href: "/configuration",
    icon: Cog,
    permission: "configuration"
  },
  {
    label: "Users",
    href: "/users",
    icon: Users,
    permission: "users"
  },
  {
    label: "Reports",
    href: "/reports",
    icon: FilePieChart,
    permission: "reports"
  },
  {
    label: "Database",
    href: "/database",
    icon: Database,
    permission: "database"
  },
  {
    label: "Test Packs",
    href: "/test-packs",
    icon: FileText,
    permission: "test-packs"
  },
];

type SidebarProps = {
  isOpen: boolean;
};

const Sidebar = ({ isOpen }: SidebarProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(isOpen);
  const { user } = useAuth();
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (user) {
        try {
          const permissions = await getUserPermissions(user.id);
          setUserPermissions(permissions);
        } catch (error) {
          console.error("Error fetching permissions:", error);
          // Default to dashboard only
          setUserPermissions(['dashboard']);
        } finally {
          setLoading(false);
        }
      } else {
        setUserPermissions([]);
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

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
            <h1 className="text-xl font-semibold">FOSSIL Energies</h1>
          </div>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={closeSidebar}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 py-2">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sidebar-primary"></div>
            </div>
          ) : (
            <nav className="space-y-1 px-2">
              {navItems
                .filter(item => userPermissions.includes(item.permission))
                .map((item) => (
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
          )}
        </ScrollArea>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-primary font-semibold">
                FE
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">FOSSIL Energies</p>
                <p className="text-xs text-sidebar-foreground/70">Oil & Gas Management</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
