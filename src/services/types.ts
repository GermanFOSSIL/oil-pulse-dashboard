
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

// Add the missing interfaces
export interface Project {
  id: string;
  name: string;
  location?: string;
  status: string;
  progress?: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface System {
  id: string;
  name: string;
  project_id: string;
  completion_rate?: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Subsystem {
  id: string;
  name: string;
  system_id: string;
  completion_rate?: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ITR {
  id: string;
  name: string;
  subsystem_id: string;
  status: string;
  progress?: number;
  assigned_to?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  quantity: number;
}

export interface TestPack {
  id: string;
  nombre_paquete: string;
  sistema: string;
  subsistema: string;
  itr_asociado: string;
  estado: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  tag_name: string;
  test_pack_id: string;
  estado: string;
  fecha_liberacion?: string;
  created_at: string;
  updated_at: string;
}

export interface AccionesLog {
  id: string;
  accion: string;
  fecha: string;
  tag_id: string;
  usuario_id: string;
}

export interface StatsData {
  totalPacks: number;
  pendingPacks: number;
  completedPacks: number;
  totalTags: number;
  pendingTags: number;
  releasedTags: number;
  completionRate: number;
}

export interface BulkUserData {
  email: string;
  full_name: string;
  role?: string;
  permissions?: string[];
}

export interface UserCreateData {
  email: string;
  password: string;
  full_name: string;
  role?: string;
  permissions?: string[];
}

export interface UserUpdateData {
  id: string;
  full_name?: string;
  email?: string;
  role?: string;
  permissions?: string[];
}

export interface PasswordChangeData {
  id: string;
  password: string;
}

export interface UserProfile {
  id: string;
  full_name?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ITRWithActions extends ITR {
  actions?: {
    canEdit: boolean;
    canDelete: boolean;
  };
  subsystemName?: string;
  systemName?: string;
  projectName?: string;
}
