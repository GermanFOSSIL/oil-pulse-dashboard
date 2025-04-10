
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Clock, 
  Mail, 
  Save, 
  AlertTriangle,
  Calendar,
  RefreshCw,
  Trash2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

interface EmailRecipient {
  id: string;
  email: string;
}

interface ReportSchedule {
  daily: {
    enabled: boolean;
    time: string;
  };
  weekly: {
    enabled: boolean;
    time: string;
    day: string;
  };
  monthly: {
    enabled: boolean;
    time: string;
    day: string;
  };
}

const ReportSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [schedule, setSchedule] = useState<ReportSchedule>({
    daily: { enabled: false, time: "07:00" },
    weekly: { enabled: false, time: "07:00", day: "monday" },
    monthly: { enabled: false, time: "07:00", day: "1" }
  });

  // Fetch report settings
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        // Fetch email recipients
        const { data: recipientsData, error: recipientsError } = await supabase
          .from("report_recipients")
          .select("*");

        if (recipientsError) {
          throw recipientsError;
        }

        // Fetch schedule settings
        const { data: scheduleData, error: scheduleError } = await supabase
          .from("report_schedule")
          .select("*")
          .single();

        if (scheduleError && scheduleError.code !== "PGRST116") {
          // PGRST116 is "no rows returned" which is fine for default settings
          throw scheduleError;
        }

        // Set recipients
        if (recipientsData) {
          setRecipients(recipientsData as EmailRecipient[]);
        }

        // Set schedule
        if (scheduleData) {
          setSchedule(scheduleData.settings);
        }
      } catch (error) {
        console.error("Error fetching report settings:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las configuraciones de reportes",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  // Add a new email recipient
  const addRecipient = async () => {
    if (!newEmail.trim() || !isValidEmail(newEmail)) {
      toast({
        title: "Error",
        description: "Por favor, ingrese un correo electrónico válido",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Check if email already exists
      if (recipients.some(r => r.email === newEmail.trim())) {
        toast({
          title: "Error",
          description: "Este correo ya está en la lista",
          variant: "destructive",
        });
        return;
      }

      // Add to database
      const { data, error } = await supabase
        .from("report_recipients")
        .insert([{ email: newEmail.trim() }])
        .select();

      if (error) throw error;

      // Update local state
      if (data && data.length > 0) {
        setRecipients([...recipients, data[0] as EmailRecipient]);
        setNewEmail("");
        toast({
          title: "Éxito",
          description: "Correo electrónico añadido con éxito",
        });
      }
    } catch (error) {
      console.error("Error adding email recipient:", error);
      toast({
        title: "Error",
        description: "No se pudo añadir el correo electrónico",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Remove an email recipient
  const removeRecipient = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("report_recipients")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setRecipients(recipients.filter(r => r.id !== id));
      toast({
        title: "Éxito",
        description: "Correo electrónico eliminado con éxito",
      });
    } catch (error) {
      console.error("Error removing email recipient:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el correo electrónico",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Update schedule settings
  const updateSchedule = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("report_schedule")
        .upsert({ id: 1, settings: schedule });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Configuración de programación guardada con éxito",
      });
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración de programación",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Validate email format
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handle schedule changes
  const handleScheduleChange = (type: keyof ReportSchedule, field: string, value: any) => {
    setSchedule(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Configuración de Reportes</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="bg-gray-100 h-20"></CardHeader>
              <CardContent className="h-40 mt-2 space-y-4">
                <div className="h-10 bg-gray-100 rounded-md"></div>
                <div className="h-10 bg-gray-100 rounded-md"></div>
                <div className="h-10 bg-gray-100 rounded-md"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración de Reportes</h1>
          <p className="text-muted-foreground">
            Configura los emails y la frecuencia de envío de reportes automáticos
          </p>
        </div>
      </div>

      <Tabs defaultValue="recipients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recipients">Destinatarios</TabsTrigger>
          <TabsTrigger value="schedule">Programación</TabsTrigger>
          <TabsTrigger value="preview">Vista Previa</TabsTrigger>
        </TabsList>

        {/* Email Recipients Tab */}
        <TabsContent value="recipients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Destinatarios de Reportes
              </CardTitle>
              <CardDescription>
                Añade o elimina direcciones de correo electrónico para enviar reportes automáticos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="nombre@empresa.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <Button onClick={addRecipient} disabled={saving}>
                  {saving ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Añadiendo...
                    </>
                  ) : (
                    "Añadir"
                  )}
                </Button>
              </div>

              {recipients.length === 0 ? (
                <div className="p-4 border border-dashed rounded-md flex justify-center items-center">
                  <div className="text-center text-muted-foreground">
                    <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                    <p>No hay destinatarios configurados</p>
                    <p className="text-sm">Añade al menos un correo electrónico para recibir reportes</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {recipients.map((recipient) => (
                    <div key={recipient.id} className="flex items-center justify-between p-3 border rounded-md">
                      <span>{recipient.email}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRecipient(recipient.id)}
                        disabled={saving}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Daily Report Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Reporte Diario
                </CardTitle>
                <CardDescription>
                  Configuración para envíos diarios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="daily-enabled">Activar</Label>
                  <Switch
                    id="daily-enabled"
                    checked={schedule.daily.enabled}
                    onCheckedChange={(checked) => handleScheduleChange('daily', 'enabled', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="daily-time">Hora de envío</Label>
                  <Input
                    id="daily-time"
                    type="time"
                    value={schedule.daily.time}
                    onChange={(e) => handleScheduleChange('daily', 'time', e.target.value)}
                    disabled={!schedule.daily.enabled}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Weekly Report Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Reporte Semanal
                </CardTitle>
                <CardDescription>
                  Configuración para envíos semanales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="weekly-enabled">Activar</Label>
                  <Switch
                    id="weekly-enabled"
                    checked={schedule.weekly.enabled}
                    onCheckedChange={(checked) => handleScheduleChange('weekly', 'enabled', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weekly-day">Día de la semana</Label>
                  <select
                    id="weekly-day"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={schedule.weekly.day}
                    onChange={(e) => handleScheduleChange('weekly', 'day', e.target.value)}
                    disabled={!schedule.weekly.enabled}
                  >
                    <option value="monday">Lunes</option>
                    <option value="tuesday">Martes</option>
                    <option value="wednesday">Miércoles</option>
                    <option value="thursday">Jueves</option>
                    <option value="friday">Viernes</option>
                    <option value="saturday">Sábado</option>
                    <option value="sunday">Domingo</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weekly-time">Hora de envío</Label>
                  <Input
                    id="weekly-time"
                    type="time"
                    value={schedule.weekly.time}
                    onChange={(e) => handleScheduleChange('weekly', 'time', e.target.value)}
                    disabled={!schedule.weekly.enabled}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Monthly Report Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Reporte Mensual
                </CardTitle>
                <CardDescription>
                  Configuración para envíos mensuales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="monthly-enabled">Activar</Label>
                  <Switch
                    id="monthly-enabled"
                    checked={schedule.monthly.enabled}
                    onCheckedChange={(checked) => handleScheduleChange('monthly', 'enabled', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="monthly-day">Día del mes</Label>
                  <select
                    id="monthly-day"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={schedule.monthly.day}
                    onChange={(e) => handleScheduleChange('monthly', 'day', e.target.value)}
                    disabled={!schedule.monthly.enabled}
                  >
                    {[...Array(28)].map((_, i) => (
                      <option key={i} value={(i + 1).toString()}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="monthly-time">Hora de envío</Label>
                  <Input
                    id="monthly-time"
                    type="time"
                    value={schedule.monthly.time}
                    onChange={(e) => handleScheduleChange('monthly', 'time', e.target.value)}
                    disabled={!schedule.monthly.enabled}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
            <Button onClick={updateSchedule} disabled={saving} className="w-full md:w-auto">
              {saving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar configuración
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa de Reportes</CardTitle>
              <CardDescription>
                Previsualización de los reportes automáticos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6 border-y">
                <h3 className="text-lg font-semibold mb-4">Contenido del reporte</h3>
                <div className="bg-muted p-4 rounded-md">
                  <p className="mb-2">El reporte incluirá:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Captura del Dashboard completo</li>
                    <li>Resumen de KPIs actuales</li>
                    <li>Listado de Test Packs completados en el período</li>
                    <li>Tags liberados en el período</li>
                    <li>Proyección de avance para los próximos 30 días</li>
                  </ul>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Destinatarios configurados</h3>
                {recipients.length === 0 ? (
                  <div className="p-4 border border-dashed rounded-md flex justify-center items-center">
                    <div className="text-center text-muted-foreground">
                      <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                      <p>No hay destinatarios configurados</p>
                      <p className="text-sm">Añade al menos un correo electrónico para recibir reportes</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted p-4 rounded-md">
                    <ul className="space-y-2">
                      {recipients.map((recipient) => (
                        <li key={recipient.id} className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          {recipient.email}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="p-6 border-t">
                <h3 className="text-lg font-semibold mb-4">Programación activa</h3>
                <div className="space-y-4">
                  {schedule.daily.enabled && (
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-primary" />
                      <span>Reporte diario a las {schedule.daily.time}</span>
                    </div>
                  )}
                  
                  {schedule.weekly.enabled && (
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-primary" />
                      <span>
                        Reporte semanal los{' '}
                        {
                          {
                            monday: 'lunes',
                            tuesday: 'martes',
                            wednesday: 'miércoles',
                            thursday: 'jueves',
                            friday: 'viernes',
                            saturday: 'sábados',
                            sunday: 'domingos'
                          }[schedule.weekly.day]
                        }{' '}
                        a las {schedule.weekly.time}
                      </span>
                    </div>
                  )}
                  
                  {schedule.monthly.enabled && (
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-primary" />
                      <span>
                        Reporte mensual el día {schedule.monthly.day} a las {schedule.monthly.time}
                      </span>
                    </div>
                  )}
                  
                  {!schedule.daily.enabled && !schedule.weekly.enabled && !schedule.monthly.enabled && (
                    <div className="p-4 border border-dashed rounded-md flex justify-center items-center">
                      <div className="text-center text-muted-foreground">
                        <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                        <p>No hay reportes programados</p>
                        <p className="text-sm">Activa al menos un tipo de reporte en la pestaña Programación</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportSettings;
