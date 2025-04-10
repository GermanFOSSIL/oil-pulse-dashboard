import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { PlusCircle, Trash2, Send, InfoIcon } from "lucide-react";
import { ReportScheduleSettings, EmailRecipient } from "@/services/types";

interface ReportSettingsProps {}

const ReportSettings: React.FC<ReportSettingsProps> = () => {
  const [scheduleSettings, setScheduleSettings] = useState<ReportScheduleSettings>({
    daily: { time: '08:00', enabled: false },
    weekly: { day: 'monday', time: '08:00', enabled: false },
    monthly: { day: '1', time: '08:00', enabled: false },
  });
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [newRecipientEmail, setNewRecipientEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  const daysOfWeek = [
    { value: 'monday', label: 'Lunes' },
    { value: 'tuesday', label: 'Martes' },
    { value: 'wednesday', label: 'Miércoles' },
    { value: 'thursday', label: 'Jueves' },
    { value: 'friday', label: 'Viernes' },
    { value: 'saturday', label: 'Sábado' },
    { value: 'sunday', label: 'Domingo' },
  ];
  
  const handleScheduleChange = (type: keyof ReportScheduleSettings, field: string, value: any) => {
    setScheduleSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };
  
  const handleAddRecipient = async () => {
    if (!newRecipientEmail) return;
    
    try {
      setIsSaving(true);
      const { data, error } = await supabase
        .from('report_recipients')
        .insert([{ email: newRecipientEmail }])
        .select();
      
      if (error) throw error;
      
      setRecipients([...recipients, { id: data[0].id, email: newRecipientEmail }]);
      setNewRecipientEmail("");
      toast({
        title: "Destinatario agregado",
        description: "El destinatario se ha agregado correctamente."
      });
    } catch (error) {
      console.error("Error adding recipient:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar el destinatario.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteRecipient = async (id: string) => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('report_recipients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setRecipients(recipients.filter(r => r.id !== id));
      toast({
        title: "Destinatario eliminado",
        description: "El destinatario se ha eliminado correctamente."
      });
    } catch (error) {
      console.error("Error deleting recipient:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el destinatario.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const fetchRecipients = async () => {
    try {
      const { data, error } = await supabase
        .from('report_recipients')
        .select('*');
      
      if (error) throw error;
      
      setRecipients(data || []);
    } catch (error) {
      console.error("Error fetching recipients:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los destinatarios.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('report_schedule')
          .select('*')
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            // No record found, we'll create one later
            console.info("No schedule settings found, will create new.");
          } else {
            throw error;
          }
        }
        
        if (data) {
          // Convert the settings from JSON to our ReportScheduleSettings type
          const typedSettings = data.settings as ReportScheduleSettings;
          setScheduleSettings(typedSettings);
        }
      } catch (error) {
        console.error("Error fetching report schedule settings:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las configuraciones de reportes.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
    fetchRecipients();
  }, []);

  const saveScheduleSettings = async () => {
    try {
      setIsSaving(true);
      
      // Create a properly formatted settings object for Supabase
      const { data, error } = await supabase
        .from('report_schedule')
        .upsert({
          id: '1', // Using a fixed ID as there will be only one settings record
          settings: scheduleSettings as any // Cast to any to satisfy Supabase's Json type
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Configuración guardada",
        description: "La configuración de reportes se ha actualizado correctamente."
      });
    } catch (error) {
      console.error("Error saving schedule settings:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración de reportes.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Reportes</CardTitle>
          <CardDescription>
            Administra la programación y los destinatarios de los reportes automáticos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="daily" className="space-y-4">
            <TabsList>
              <TabsTrigger value="daily">Diario</TabsTrigger>
              <TabsTrigger value="weekly">Semanal</TabsTrigger>
              <TabsTrigger value="monthly">Mensual</TabsTrigger>
            </TabsList>
            <TabsContent value="daily" className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="daily-enabled">Enviar reporte diario</Label>
                <Switch 
                  id="daily-enabled"
                  checked={scheduleSettings.daily.enabled}
                  onCheckedChange={(checked) => handleScheduleChange('daily', 'enabled', checked)}
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="daily-time">Hora de envío</Label>
                <Input 
                  type="time" 
                  id="daily-time" 
                  value={scheduleSettings.daily.time}
                  onChange={(e) => handleScheduleChange('daily', 'time', e.target.value)}
                  disabled={!scheduleSettings.daily.enabled}
                />
              </div>
            </TabsContent>
            <TabsContent value="weekly" className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="weekly-enabled">Enviar reporte semanal</Label>
                <Switch 
                  id="weekly-enabled"
                  checked={scheduleSettings.weekly.enabled}
                  onCheckedChange={(checked) => handleScheduleChange('weekly', 'enabled', checked)}
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="weekly-day">Día de la semana</Label>
                <Select 
                  value={scheduleSettings.weekly.day}
                  onValueChange={(value) => handleScheduleChange('weekly', 'day', value)}
                  disabled={!scheduleSettings.weekly.enabled}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecciona un día" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label htmlFor="weekly-time">Hora de envío</Label>
                <Input 
                  type="time" 
                  id="weekly-time"
                  value={scheduleSettings.weekly.time}
                  onChange={(e) => handleScheduleChange('weekly', 'time', e.target.value)}
                  disabled={!scheduleSettings.weekly.enabled}
                />
              </div>
            </TabsContent>
            <TabsContent value="monthly" className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="monthly-enabled">Enviar reporte mensual</Label>
                <Switch 
                  id="monthly-enabled"
                  checked={scheduleSettings.monthly.enabled}
                  onCheckedChange={(checked) => handleScheduleChange('monthly', 'enabled', checked)}
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="monthly-day">Día del mes</Label>
                <Input 
                  type="number"
                  id="monthly-day"
                  value={scheduleSettings.monthly.day}
                  onChange={(e) => handleScheduleChange('monthly', 'day', e.target.value)}
                  disabled={!scheduleSettings.monthly.enabled}
                  min="1"
                  max="31"
                />
                <Label htmlFor="monthly-time">Hora de envío</Label>
                <Input 
                  type="time" 
                  id="monthly-time"
                  value={scheduleSettings.monthly.time}
                  onChange={(e) => handleScheduleChange('monthly', 'time', e.target.value)}
                  disabled={!scheduleSettings.monthly.enabled}
                />
              </div>
            </TabsContent>
          </Tabs>
          <Button onClick={saveScheduleSettings} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar configuración"}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Destinatarios de Reportes</CardTitle>
          <CardDescription>
            Administra la lista de destinatarios que recibirán los reportes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipients.map((recipient) => (
                <TableRow key={recipient.id}>
                  <TableCell>{recipient.email}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteRecipient(recipient.id)} disabled={isSaving}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center space-x-2">
            <Input 
              type="email"
              placeholder="Nuevo destinatario"
              value={newRecipientEmail}
              onChange={(e) => setNewRecipientEmail(e.target.value)}
            />
            <Button onClick={handleAddRecipient} disabled={isSaving}>
              Agregar <PlusCircle className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportSettings;
