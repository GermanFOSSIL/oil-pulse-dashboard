
export interface Task {
  id: string;
  name: string;
  description?: string;
  status: string;
  subsystem_id: string;
  created_at: string;
  updated_at: string;
}

export interface GanttTask {
  id: string;
  task: string;
  start: string;
  end: string;
  progress: number;
  type?: string;
  parent?: string;
  status?: string;
  dependencies?: string;
  quantity?: number;
}

export interface ReportScheduleSettings {
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

export interface EmailRecipient {
  id: string;
  email: string;
}
