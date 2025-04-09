
export type Project = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  location: string | null;
  status: "complete" | "inprogress" | "delayed";
  progress: number | null;
  start_date: string | null;
  end_date: string | null;
};

export type System = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  project_id: string;
  completion_rate: number | null;
  start_date: string | null;
  end_date: string | null;
};

export type Subsystem = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  system_id: string;
  completion_rate: number | null;
  start_date: string | null;
  end_date: string | null;
};

export type ITR = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  subsystem_id: string;
  status: "complete" | "inprogress" | "delayed";
  progress: number | null;
  start_date: string | null;
  end_date: string | null;
  assigned_to: string | null;
  quantity: number;
};

export type Task = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  subsystem_id: string;
  status: string;
};

export type Profile = {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  permissions?: string[] | null;
};

export type BulkUserData = {
  email: string;
  full_name: string;
  role?: string;
  password?: string;
};

export type ReportType = 'project_status' | 'itrs' | 'tasks';

export type UserUpdateData = {
  full_name?: string;
  avatar_url?: string;
  role?: string;
  permissions?: string[];
};

export type UserCreateData = {
  email: string;
  password: string;
  full_name: string;
  role?: string;
  permissions?: string[];
};

export type PasswordChangeData = {
  userId: string;
  newPassword: string;
};

// Test Pack module types
export type TestPack = {
  id: string;
  created_at: string;
  updated_at: string;
  nombre_paquete: string;
  itr_asociado: string;
  sistema: string;
  subsistema: string;
  estado: 'pendiente' | 'listo';
};

export type Tag = {
  id: string;
  created_at: string;
  updated_at: string;
  test_pack_id: string;
  tag_name: string;
  estado: 'pendiente' | 'liberado';
  fecha_liberacion: string | null;
};

export type AccionesLog = {
  id: string;
  usuario_id: string;
  tag_id: string;
  accion: string;
  fecha: string;
};

export type TestPackStats = {
  total: number;
  completed: number;
  progress: number;
};

export type TagStats = {
  total: number;
  released: number;
  progress: number;
};

export type StatsData = {
  testPacks: TestPackStats;
  tags: TagStats;
  systems: { name: string; value: number; }[];
  subsystems: { name: string; value: number; }[];
  itrs: { name: string; value: number; }[];
};

// Database activity log
export type DbActivityLog = {
  id: string;
  created_at: string;
  action: string;
  table_name: string;
  record_id: string | null;
  details: any;
  user_id: string | null;
};
