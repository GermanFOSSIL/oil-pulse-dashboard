
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Check, Trash2, Plus, AlertCircle, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// The functions will be implemented directly in this file since they were missing
const getReportSchedule = async () => {
  try {
    const { data, error } = await supabase
      .from('report_schedule')
      .select('*')
      .single();
    
    if (error) throw error;
    return data || {
      settings: {
        daily: { enabled: false, time: "07:00" },
        weekly: { enabled: false, day: "monday", time: "07:00" },
        monthly: { enabled: false, day: "1", time: "07:00" }
      }
    };
  } catch (error) {
    console.error("Error fetching report schedule:", error);
    throw error;
  }
};

const updateReportSchedule = async (settings) => {
  try {
    const { data, error } = await supabase
      .from('report_schedule')
      .upsert({ 
        id: '1', // Using a fixed ID for simplicity
        settings 
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating report schedule:", error);
    throw error;
  }
};

const getReportRecipients = async () => {
  try {
    const { data, error } = await supabase
      .from('report_recipients')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching report recipients:", error);
    throw error;
  }
};

const addReportRecipient = async (email) => {
  try {
    const { data, error } = await supabase
      .from('report_recipients')
      .insert({ email })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding report recipient:", error);
    throw error;
  }
};

const removeReportRecipient = async (id) => {
  try {
    const { error } = await supabase
      .from('report_recipients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error removing report recipient:", error);
    throw error;
  }
};

const weekDays = [
  { value: "monday", label: "Lunes" },
  { value: "tuesday", label: "Martes" },
  { value: "wednesday", label: "Miércoles" },
  { value: "thursday", label: "Jueves" },
  { value: "friday", label: "Viernes" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" }
];

const monthDays = Array.from({ length: 31 }, (_, i) => ({ 
  value: String(i + 1), 
  label: String(i + 1) 
}));

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const ReportSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    daily: { enabled: false, time: "07:00" },
    weekly: { enabled: false, day: "monday", time: "07:00" },
    monthly: { enabled: false, day: "1", time: "07:00" }
  });
  const [recipients, setRecipients] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const scheduleData = await getReportSchedule();
        if (scheduleData?.settings) {
          setSettings(scheduleData.settings);
        }
        
        const recipientsData = await getReportRecipients();
        setRecipients(recipientsData);
      } catch (error) {
        console.error("Error loading settings:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las configuraciones de informes",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  const handleSettingChange = (reportType, key, value) => {
    setSettings(prev => ({
      ...prev,
      [reportType]: {
        ...prev[reportType],
        [key]: value
      }
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await updateReportSchedule(settings);
      toast({
        title: "Configuraciones guardadas",
        description: "Las configuraciones de informes se han actualizado correctamente",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar las configuraciones",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddRecipient = async () => {
    if (!newEmail) {
      setEmailError("El correo electrónico es requerido");
      return;
    }

    if (!validateEmail(newEmail)) {
      setEmailError("Correo electrónico inválido");
      return;
    }

    setEmailError("");
    try {
      const addedRecipient = await addReportRecipient(newEmail);
      setRecipients(prev => [...prev, addedRecipient]);
      setNewEmail("");
      toast({
        title: "Destinatario agregado",
        description: "El destinatario ha sido agregado correctamente",
      });
    } catch (error) {
      console.error("Error adding recipient:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el destinatario",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRecipient = async (id) => {
    setDeletingId(id);
    try {
      await removeReportRecipient(id);
      setRecipients(prev => prev.filter(r => r.id !== id));
      toast({
        title: "Destinatario eliminado",
        description: "El destinatario ha sido eliminado correctamente",
      });
    } catch (error) {
      console.error("Error removing recipient:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el destinatario",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Configuración de Informes</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="bg-muted/20 h-12"></CardHeader>
              <CardContent className="space-y-2 mt-4">
                <div className="h-6 bg-muted/20 rounded"></div>
                <div className="h-10 bg-muted/20 rounded"></div>
                <div className="h-6 bg-muted/20 rounded"></div>
                <div className="h-10 bg-muted/20 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración de Informes</h1>
          <p className="text-muted-foreground">
            Configure la programación y los destinatarios de los informes automáticos.
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <>Guardando...</>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Configuración
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Daily Report Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informe Diario</CardTitle>
            <CardDescription>
              Se envía un resumen diario de actividad del proyecto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="daily-enabled">Activar informe diario</Label>
              <Switch
                id="daily-enabled"
                checked={settings.daily.enabled}
                onCheckedChange={(checked) => handleSettingChange('daily', 'enabled', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily-time">Hora de envío</Label>
              <Input
                id="daily-time"
                type="time"
                value={settings.daily.time}
                onChange={(e) => handleSettingChange('daily', 'time', e.target.value)}
                disabled={!settings.daily.enabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Weekly Report Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informe Semanal</CardTitle>
            <CardDescription>
              Resumen semanal con estadísticas y avances del proyecto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="weekly-enabled">Activar informe semanal</Label>
              <Switch
                id="weekly-enabled"
                checked={settings.weekly.enabled}
                onCheckedChange={(checked) => handleSettingChange('weekly', 'enabled', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekly-day">Día de envío</Label>
              <Select
                disabled={!settings.weekly.enabled}
                value={settings.weekly.day}
                onValueChange={(value) => handleSettingChange('weekly', 'day', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar día" />
                </SelectTrigger>
                <SelectContent>
                  {weekDays.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekly-time">Hora de envío</Label>
              <Input
                id="weekly-time"
                type="time"
                value={settings.weekly.time}
                onChange={(e) => handleSettingChange('weekly', 'time', e.target.value)}
                disabled={!settings.weekly.enabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Monthly Report Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informe Mensual</CardTitle>
            <CardDescription>
              Resumen detallado mensual con métricas y KPIs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="monthly-enabled">Activar informe mensual</Label>
              <Switch
                id="monthly-enabled"
                checked={settings.monthly.enabled}
                onCheckedChange={(checked) => handleSettingChange('monthly', 'enabled', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly-day">Día del mes</Label>
              <Select
                disabled={!settings.monthly.enabled}
                value={settings.monthly.day}
                onValueChange={(value) => handleSettingChange('monthly', 'day', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar día" />
                </SelectTrigger>
                <SelectContent>
                  {monthDays.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly-time">Hora de envío</Label>
              <Input
                id="monthly-time"
                type="time"
                value={settings.monthly.time}
                onChange={(e) => handleSettingChange('monthly', 'time', e.target.value)}
                disabled={!settings.monthly.enabled}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Destinatarios de Informes</CardTitle>
          <CardDescription>
            Administre los correos electrónicos que recibirán los informes automáticos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Agregar destinatario de correo..."
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
              />
              {emailError && (
                <p className="text-sm text-destructive mt-1">{emailError}</p>
              )}
            </div>
            <Button onClick={handleAddRecipient}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar
            </Button>
          </div>

          {recipients.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No hay destinatarios</AlertTitle>
              <AlertDescription>
                No se han agregado destinatarios de informes. Agregue al menos un correo electrónico para recibir informes.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Correo Electrónico</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.map((recipient) => (
                  <TableRow key={recipient.id}>
                    <TableCell className="font-medium">{recipient.email}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteRecipient(recipient.id)}
                        disabled={deletingId === recipient.id}
                      >
                        {deletingId === recipient.id ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportSettings;
