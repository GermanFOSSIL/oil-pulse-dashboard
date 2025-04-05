
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataImport } from "@/components/DataImport";
import { useEffect } from "react";
import { initializeStorage } from "@/services/storageService";

export default function Configuration() {
  useEffect(() => {
    // Ensure storage buckets are initialized
    initializeStorage();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Gestiona la configuración de la aplicación
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="data">Datos</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>
                Configura los parámetros generales de la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Las opciones de configuración general estarán disponibles en futuras actualizaciones.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="data" className="space-y-4">
          <DataImport />
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Seguridad</CardTitle>
              <CardDescription>
                Configura los parámetros de seguridad de la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Las opciones de configuración de seguridad estarán disponibles en futuras actualizaciones.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
