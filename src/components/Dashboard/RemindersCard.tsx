
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import { format, addMonths } from "date-fns";
import { es } from "date-fns/locale";

export const RemindersCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recordatorios</CardTitle>
        <CardDescription>
          Actividades pendientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-4 h-full w-px bg-muted"></div>
          
          {[
            {
              date: addMonths(new Date(), 0.25),
              title: "Verificación de Tags pendientes",
              description: "Revisar Tags pendientes de liberación del sistema eléctrico",
              priority: "high"
            },
            {
              date: addMonths(new Date(), 0.5),
              title: "Reporte mensual de avance",
              description: "Preparar reporte mensual de avance para cliente",
              priority: "medium"
            },
            {
              date: addMonths(new Date(), 0.75),
              title: "Revisión de sistema mecánico",
              description: "Completar inspección de sistema mecánico",
              priority: "low"
            }
          ].map((event, index) => {
            let priorityColor = "bg-blue-500";
            if (event.priority === "high") priorityColor = "bg-red-500";
            if (event.priority === "medium") priorityColor = "bg-orange-500";
            
            return (
              <div key={index} className="mb-8 grid last:mb-0">
                <div className="flex items-start">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border border-muted bg-background z-10 mr-4`}>
                    <span className={`flex h-2 w-2 rounded-full ${priorityColor}`}></span>
                  </div>
                  <div className="text-sm mr-4">
                    {`${format(event.date, 'dd/MM')}`}
                  </div>
                  <div className="flex-1 rounded-lg border p-4">
                    <h3 className="font-semibold tracking-tight">{event.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                    <div className="mt-2 flex items-center text-xs text-muted-foreground">
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      <span>
                        {format(event.date, 'dd MMM yyyy', { locale: es })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
