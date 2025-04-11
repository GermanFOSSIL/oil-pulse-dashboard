import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

interface ReportScheduleSettings {
  daily: {
    time: string;
    enabled: boolean;
  };
  weekly: {
    day: string;
    time: string;
    enabled: boolean;
  };
  monthly: {
    day: string;
    time: string;
    enabled: boolean;
  };
}

const ReportSettings = () => {
  const [settings, setSettings] = useState<ReportScheduleSettings>({
    daily: { time: '08:00', enabled: false },
    weekly: { day: 'Monday', time: '08:00', enabled: false },
    monthly: { day: '1', time: '08:00', enabled: false },
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSchedule = async () => {
      const { data, error } = await supabase
        .from('report_schedule')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching schedule:', error);
        return;
      }

      if (data && data.settings) {
        // Cast to ReportScheduleSettings with type assertion
        setSettings(data.settings as ReportScheduleSettings);
      }
    };

    fetchSchedule();
  }, []);

  const handleInputChange = (section: string, field: string, value: any) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [section]: {
        ...prevSettings[section as keyof ReportScheduleSettings],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data, error } = await supabase
        .from('report_schedule')
        .upsert({ 
          id: '1', 
          settings: settings as any, // Cast to any to avoid type issues
          updated_at: new Date().toISOString() 
        });

      if (error) throw error;

      toast({
        title: 'Configuration Saved',
        description: 'Report schedule settings have been updated successfully',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Report Schedule Settings</CardTitle>
          <CardDescription>Configure when to send automated reports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Daily Settings */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="daily-enabled">Daily Report</Label>
                <Switch
                  id="daily-enabled"
                  checked={settings.daily.enabled}
                  onCheckedChange={(checked) => handleInputChange('daily', 'enabled', checked)}
                />
              </div>
              {settings.daily.enabled && (
                <div className="grid grid-cols-2 items-center gap-4">
                  <Label htmlFor="daily-time">Time:</Label>
                  <Input
                    type="time"
                    id="daily-time"
                    value={settings.daily.time}
                    onChange={(e) => handleInputChange('daily', 'time', e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Weekly Settings */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="weekly-enabled">Weekly Report</Label>
                <Switch
                  id="weekly-enabled"
                  checked={settings.weekly.enabled}
                  onCheckedChange={(checked) => handleInputChange('weekly', 'enabled', checked)}
                />
              </div>
              {settings.weekly.enabled && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 items-center gap-4">
                    <Label htmlFor="weekly-day">Day:</Label>
                    <Select
                      onValueChange={(value) => handleInputChange('weekly', 'day', value)}
                      defaultValue={settings.weekly.day}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monday">Monday</SelectItem>
                        <SelectItem value="Tuesday">Tuesday</SelectItem>
                        <SelectItem value="Wednesday">Wednesday</SelectItem>
                        <SelectItem value="Thursday">Thursday</SelectItem>
                        <SelectItem value="Friday">Friday</SelectItem>
                        <SelectItem value="Saturday">Saturday</SelectItem>
                        <SelectItem value="Sunday">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <Label htmlFor="weekly-time">Time:</Label>
                    <Input
                      type="time"
                      id="weekly-time"
                      value={settings.weekly.time}
                      onChange={(e) => handleInputChange('weekly', 'time', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Monthly Settings */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="monthly-enabled">Monthly Report</Label>
                <Switch
                  id="monthly-enabled"
                  checked={settings.monthly.enabled}
                  onCheckedChange={(checked) => handleInputChange('monthly', 'enabled', checked)}
                />
              </div>
              {settings.monthly.enabled && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 items-center gap-4">
                    <Label htmlFor="monthly-day">Day:</Label>
                    <Select
                      onValueChange={(value) => handleInputChange('monthly', 'day', value)}
                      defaultValue={settings.monthly.day}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a day" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={String(day)}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <Label htmlFor="monthly-time">Time:</Label>
                    <Input
                      type="time"
                      id="monthly-time"
                      value={settings.monthly.time}
                      onChange={(e) => handleInputChange('monthly', 'time', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportSettings;
