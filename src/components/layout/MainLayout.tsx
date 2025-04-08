
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Menu, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const MainLayout = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { toast } = useToast();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Set up real-time listener for data changes
  useEffect(() => {
    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
          // Display toast notification for data changes
          toast({
            title: "Datos actualizados",
            description: "Se han detectado cambios en los datos."
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="bg-background border-b p-4 flex justify-between items-center">
          {isMobile ? (
            <Button variant="outline" size="icon" onClick={toggleSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
          ) : (
            <div className="font-medium">FOSSIL Energies - Oil & Gas Management</div>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
            className="ml-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar datos
          </Button>
        </div>
        <div className="flex-1 overflow-auto">
          <main className="p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
