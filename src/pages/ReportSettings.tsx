
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyPlaceholder } from "@/components/ui/EmptyPlaceholder";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ReportScheduleSettings } from "@/services/types";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const monthDays = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

const ReportSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recipients, setRecipients] = useState<{ id: string; email: string }[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [settings, setSettings] = useState<ReportScheduleSettings>({
    daily: {
      time: "08:00",
      enabled: false
    },
    weekly: {
      day: "Monday",
      time: "08:00",
      enabled: false
    },
    monthly: {
      day: "1",
      time: "08:00",
      enabled: false
    }
  });

  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch recipients
        const { data: recipientsData, error: recipientsError } = await supabase
          .from('report_recipients')
          .select('*');

        if (recipientsError) {
          console.error("Error fetching recipients:", recipientsError);
          throw recipientsError;
        }

        setRecipients(recipientsData || []);

        // Fetch schedule settings
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('report_schedule')
          .select('*')
          .eq('id', '1')
          .single();

        if (scheduleError) {
          if (scheduleError.code === 'PGRST116') {
            // No settings found, use defaults
            console.log("No settings found, using defaults");
          } else {
            console.error("Error fetching schedule settings:", scheduleError);
            throw scheduleError;
          }
        } else if (scheduleData && scheduleData.settings) {
          // Convert the settings from JSON to our type
          const reportSettings = scheduleData.settings as ReportScheduleSettings;
          setSettings(reportSettings);
        }
      } catch (error) {
        console.error("Error loading report settings:", error);
        toast({
          title: "Error",
          description: "Failed to load report settings",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleAddRecipient = async () => {
    if (!newEmail.trim() || !/\S+@\S+\.\S+/.test(newEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('report_recipients')
        .insert([{ email: newEmail.trim() }])
        .select();

      if (error) {
        throw error;
      }

      setRecipients([...recipients, ...(data || [])]);
      setNewEmail("");
      toast({
        title: "Success",
        description: "Recipient added successfully"
      });
    } catch (error) {
      console.error("Error adding recipient:", error);
      toast({
        title: "Error",
        description: "Failed to add recipient",
        variant: "destructive"
      });
    }
  };

  const handleRemoveRecipient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('report_recipients')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setRecipients(recipients.filter(r => r.id !== id));
      toast({
        title: "Success",
        description: "Recipient removed successfully"
      });
    } catch (error) {
      console.error("Error removing recipient:", error);
      toast({
        title: "Error",
        description: "Failed to remove recipient",
        variant: "destructive"
      });
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Convert settings to proper format for Supabase
      const { error } = await supabase
        .from('report_schedule')
        .upsert({
          id: '1',
          settings: settings as any
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Report schedule settings saved successfully"
      });
    } catch (error) {
      console.error("Error saving schedule settings:", error);
      toast({
        title: "Error",
        description: "Failed to save schedule settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 container">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Report Settings</h2>
        <p className="text-muted-foreground">Configure automatic report delivery</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recipients */}
        <Card>
          <CardHeader>
            <CardTitle>Report Recipients</CardTitle>
            <CardDescription>
              Add or remove email addresses for report delivery
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <Button onClick={handleAddRecipient}>Add</Button>
            </div>
            {recipients.length === 0 ? (
              <EmptyPlaceholder
                title="No recipients"
                description="Add email addresses to receive automated reports"
              />
            ) : (
              <div className="space-y-2">
                {recipients.map((recipient) => (
                  <div key={recipient.id} className="flex justify-between items-center p-2 bg-muted rounded-md">
                    <span>{recipient.email}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRecipient(recipient.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Settings</CardTitle>
            <CardDescription>
              Configure when reports should be sent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Daily reports */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Daily Reports</Label>
                <Switch
                  checked={settings.daily.enabled}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    daily: { ...settings.daily, enabled: checked }
                  })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="daily-time">Time</Label>
                  <Input
                    id="daily-time"
                    type="time"
                    value={settings.daily.time}
                    onChange={(e) => setSettings({
                      ...settings,
                      daily: { ...settings.daily, time: e.target.value }
                    })}
                    disabled={!settings.daily.enabled}
                  />
                </div>
              </div>
            </div>

            {/* Weekly reports */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Weekly Reports</Label>
                <Switch
                  checked={settings.weekly.enabled}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    weekly: { ...settings.weekly, enabled: checked }
                  })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="weekly-day">Day</Label>
                  <Select
                    value={settings.weekly.day}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      weekly: { ...settings.weekly, day: value }
                    })}
                    disabled={!settings.weekly.enabled}
                  >
                    <SelectTrigger id="weekly-day">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="weekly-time">Time</Label>
                  <Input
                    id="weekly-time"
                    type="time"
                    value={settings.weekly.time}
                    onChange={(e) => setSettings({
                      ...settings,
                      weekly: { ...settings.weekly, time: e.target.value }
                    })}
                    disabled={!settings.weekly.enabled}
                  />
                </div>
              </div>
            </div>

            {/* Monthly reports */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Monthly Reports</Label>
                <Switch
                  checked={settings.monthly.enabled}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    monthly: { ...settings.monthly, enabled: checked }
                  })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="monthly-day">Day</Label>
                  <Select
                    value={settings.monthly.day}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      monthly: { ...settings.monthly, day: value }
                    })}
                    disabled={!settings.monthly.enabled}
                  >
                    <SelectTrigger id="monthly-day">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthDays.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="monthly-time">Time</Label>
                  <Input
                    id="monthly-time"
                    type="time"
                    value={settings.monthly.time}
                    onChange={(e) => setSettings({
                      ...settings,
                      monthly: { ...settings.monthly, time: e.target.value }
                    })}
                    disabled={!settings.monthly.enabled}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="w-full"
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ReportSettings;
