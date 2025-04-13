
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getReportSchedule, updateReportSchedule } from "@/services/reportService";
import { format } from 'date-fns';

interface ScheduleSettings {
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

const DEFAULT_SCHEDULE: ScheduleSettings = {
  daily: {
    enabled: false,
    time: "08:00",
  },
  weekly: {
    enabled: false,
    day: "monday",
    time: "08:00",
  },
  monthly: {
    enabled: false,
    day: "1",
    time: "08:00",
  },
};

const ReportSettings = () => {
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<ScheduleSettings>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const data = await getReportSchedule();
        setSchedule(data as ScheduleSettings || DEFAULT_SCHEDULE);
      } catch (error) {
        console.error("Error fetching report schedule:", error);
        toast({
          title: "Error",
          description: "Failed to load report schedule",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [toast]);

  const handleScheduleChange = (type: keyof ScheduleSettings, field: string, value: any) => {
    setSchedule((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const handleSaveSchedule = async () => {
    setIsSaving(true);
    try {
      await updateReportSchedule(schedule);
      toast({
        title: "Success",
        description: "Report schedule updated successfully",
      });
    } catch (error) {
      console.error("Error updating report schedule:", error);
      toast({
        title: "Error",
        description: "Failed to update report schedule",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report Settings</h1>
          <p className="text-muted-foreground">
            Configure automated report generation and scheduling.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Report</CardTitle>
          <CardDescription>
            Configure daily report generation settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="daily-enabled">Enabled</Label>
            <Switch
              id="daily-enabled"
              checked={schedule.daily.enabled}
              onCheckedChange={(checked) =>
                handleScheduleChange("daily", "enabled", checked)
              }
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="daily-time" className="text-right">
              Time
            </Label>
            <Input
              type="time"
              id="daily-time"
              value={schedule.daily.time}
              onChange={(e) => handleScheduleChange("daily", "time", e.target.value)}
              className="col-span-3"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Report</CardTitle>
          <CardDescription>
            Configure weekly report generation settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="weekly-enabled">Enabled</Label>
            <Switch
              id="weekly-enabled"
              checked={schedule.weekly.enabled}
              onCheckedChange={(checked) =>
                handleScheduleChange("weekly", "enabled", checked)
              }
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="weekly-day" className="text-right">
              Day
            </Label>
            <select
              id="weekly-day"
              value={schedule.weekly.day}
              onChange={(e) => handleScheduleChange("weekly", "day", e.target.value)}
              className="col-span-3 bg-background border border-input rounded-md px-3 py-2 focus:outline-none focus:border-primary"
            >
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
              <option value="saturday">Saturday</option>
              <option value="sunday">Sunday</option>
            </select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="weekly-time" className="text-right">
              Time
            </Label>
            <Input
              type="time"
              id="weekly-time"
              value={schedule.weekly.time}
              onChange={(e) => handleScheduleChange("weekly", "time", e.target.value)}
              className="col-span-3"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Report</CardTitle>
          <CardDescription>
            Configure monthly report generation settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="monthly-enabled">Enabled</Label>
            <Switch
              id="monthly-enabled"
              checked={schedule.monthly.enabled}
              onCheckedChange={(checked) =>
                handleScheduleChange("monthly", "enabled", checked)
              }
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="monthly-day" className="text-right">
              Day
            </Label>
            <Input
              type="number"
              id="monthly-day"
              value={schedule.monthly.day}
              onChange={(e) => handleScheduleChange("monthly", "day", e.target.value)}
              className="col-span-3"
              min="1"
              max="31"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="monthly-time" className="text-right">
              Time
            </Label>
            <Input
              type="time"
              id="monthly-time"
              value={schedule.monthly.time}
              onChange={(e) => handleScheduleChange("monthly", "time", e.target.value)}
              className="col-span-3"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveSchedule} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
};

export default ReportSettings;
