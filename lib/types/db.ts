// lib/types/db.ts
export type Department =
  | "Administrative Department"
  | "Estate Department"
  | "Technology Solution Department"
  | "Projects Department"
  | "Geospatial Department";

export interface DBDepartment {
  id: string;
  name: Department;
  created_at: string;
}

export interface DBUser {
  id: string;
  full_name: string;
  email: string;
  department_id: string;
  role: "admin" | "member";
  created_at: string;
}

export interface DBProject {
  id: string;
  name: string;
  description: string;
  created_by: string; // user ID
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface DBTask {
  id: string;
  project_id: string;
  title: string;
  description: string;
  assigned_to: string; // user ID
  status: "pending" | "in_progress" | "completed";
  due_date: string | null;
  created_at: string;
}
