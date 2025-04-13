
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getReportSchedule, updateReportSchedule, getReportRecipients, addReportRecipient, removeReportRecipient } from "@/services/reportService";
import { useToast } from "@/hooks/use-toast";
import { X, Plus, Save, Clock } from "lucide-react";

interface ReportScheduleSettings {
  daily: {
    enabled: boolean;
    time: string;
  };
  weekly: {
    enabled: boolean;
    day: string;
    time: string;
  };
  monthly: {
    enabled: boolean;
    day: string;
    time: string;
  };
}

interface ReportRecipient {
  id: string;
  email: string;
}

const ReportSettings = () => {
  const [schedule, setSchedule] = useState<ReportScheduleSettings>({
    daily: { enabled: false, time: "08:00" },
    weekly: { enabled: false, day: "monday", time: "08:00" },
    monthly: { enabled: false, day: "1", time: "08:00" }
  });
  
  const [recipients, setRecipients] = useState<ReportRecipient[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch schedule
        const scheduleData = await getReportSchedule();
        if (scheduleData) {
          // Ensure the data conforms to our expected structure
          const typedSchedule = scheduleData.settings as unknown as ReportScheduleSettings;
          setSchedule(typedSchedule);
        }
        
        // Fetch recipients
        const recipientsData = await getReportRecipients();
        setRecipients(recipientsData || []);
      } catch (error) {
        console.error("Error fetching report settings:", error);
        toast({
          title: "Error",
          description: "Error loading report settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updateReportSchedule(schedule);
      toast({
        title: "Success",
        description: "Report settings saved successfully",
      });
    } catch (error) {
      console.error("Error saving report settings:", error);
      toast({
        title: "Error",
        description: "Failed to save report settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddRecipient = async () => {
    if (!newEmail.trim() || !validateEmail(newEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (recipients.some(r => r.email === newEmail)) {
      toast({
        title: "Duplicate Email",
        description: "This email is already in the list",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await addReportRecipient(newEmail);
      if (result) {
        setRecipients([...recipients, result]);
        setNewEmail("");
        toast({
          title: "Success",
          description: "Email added to recipients",
        });
      }
    } catch (error) {
      console.error("Error adding recipient:", error);
      toast({
        title: "Error",
        description: "Failed to add recipient",
        variant: "destructive",
      });
    }
  };

  const handleRemoveRecipient = async (id: string) => {
    try {
      await removeReportRecipient(id);
      setRecipients(recipients.filter(r => r.id !== id));
      toast({
        title: "Success",
        description: "Recipient removed successfully",
      });
    } catch (error) {
      console.error("Error removing recipient:", error);
      toast({
        title: "Error",
        description: "Failed to remove recipient",
        variant: "destructive",
      });
    }
  };

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Card>
          <CardHeader className="bg-gray-100 h-20"></CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-6 bg-gray-100 rounded-md w-1/4"></div>
              <div className="h-10 bg-gray-100 rounded-md"></div>
              <div className="h-6 bg-gray-100 rounded-md w-1/3"></div>
              <div className="h-10 bg-gray-100 rounded-md"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Report Settings</h1>
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Schedule Settings</CardTitle>
            <CardDescription>Configure when reports are sent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Daily Reports */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Daily Reports</h3>
                  <p className="text-sm text-muted-foreground">Send reports every day</p>
                </div>
                <Switch
                  checked={schedule.daily.enabled}
                  onCheckedChange={(checked) =>
                    setSchedule({
                      ...schedule,
                      daily: { ...schedule.daily, enabled: checked },
                    })
                  }
                />
              </div>
              
              {schedule.daily.enabled && (
                <div className="flex items-center space-x-2 ml-4 pt-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="daily-time">Time</Label>
                  <Input
                    id="daily-time"
                    type="time"
                    value={schedule.daily.time}
                    onChange={(e) =>
                      setSchedule({
                        ...schedule,
                        daily: { ...schedule.daily, time: e.target.value },
                      })
                    }
                    className="w-32"
                  />
                </div>
              )}
            </div>

            {/* Weekly Reports */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Weekly Reports</h3>
                  <p className="text-sm text-muted-foreground">Send reports once a week</p>
                </div>
                <Switch
                  checked={schedule.weekly.enabled}
                  onCheckedChange={(checked) =>
                    setSchedule({
                      ...schedule,
                      weekly: { ...schedule.weekly, enabled: checked },
                    })
                  }
                />
              </div>
              
              {schedule.weekly.enabled && (
                <div className="space-y-4 ml-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="weekly-day">Day</Label>
                    <Select
                      value={schedule.weekly.day}
                      onValueChange={(value) =>
                        setSchedule({
                          ...schedule,
                          weekly: { ...schedule.weekly, day: value },
                        })
                      }
                    >
                      <SelectTrigger id="weekly-day" className="w-40">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monday">Monday</SelectItem>
                        <SelectItem value="tuesday">Tuesday</SelectItem>
                        <SelectItem value="wednesday">Wednesday</SelectItem>
                        <SelectItem value="thursday">Thursday</SelectItem>
                        <SelectItem value="friday">Friday</SelectItem>
                        <SelectItem value="saturday">Saturday</SelectItem>
                        <SelectItem value="sunday">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="weekly-time">Time</Label>
                    <Input
                      id="weekly-time"
                      type="time"
                      value={schedule.weekly.time}
                      onChange={(e) =>
                        setSchedule({
                          ...schedule,
                          weekly: { ...schedule.weekly, time: e.target.value },
                        })
                      }
                      className="w-32"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Monthly Reports */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Monthly Reports</h3>
                  <p className="text-sm text-muted-foreground">Send reports once a month</p>
                </div>
                <Switch
                  checked={schedule.monthly.enabled}
                  onCheckedChange={(checked) =>
                    setSchedule({
                      ...schedule,
                      monthly: { ...schedule.monthly, enabled: checked },
                    })
                  }
                />
              </div>
              
              {schedule.monthly.enabled && (
                <div className="space-y-4 ml-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="monthly-day">Day of month</Label>
                    <Select
                      value={schedule.monthly.day}
                      onValueChange={(value) =>
                        setSchedule({
                          ...schedule,
                          monthly: { ...schedule.monthly, day: value },
                        })
                      }
                    >
                      <SelectTrigger id="monthly-day" className="w-24">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(31)].map((_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="monthly-time">Time</Label>
                    <Input
                      id="monthly-time"
                      type="time"
                      value={schedule.monthly.time}
                      onChange={(e) =>
                        setSchedule({
                          ...schedule,
                          monthly: { ...schedule.monthly, time: e.target.value },
                        })
                      }
                      className="w-32"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Recipients</CardTitle>
            <CardDescription>Manage who receives the reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex space-x-2">
              <Input
                placeholder="Add email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddRecipient} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {recipients.length === 0 ? (
              <div className="text-center p-4 border border-dashed rounded-md">
                <p className="text-muted-foreground">No recipients added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className="flex items-center justify-between p-2 border rounded-md"
                  >
                    <span>{recipient.email}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRecipient(recipient.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportSettings;
