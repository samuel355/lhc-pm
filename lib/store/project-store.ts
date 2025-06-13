import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";

export type Task = {
  id: string;
  project_id: string;
  department_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  status: "pending" | "in_progress" | "completed";
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
  department_id: string;
  tasks?: Task[];
};

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  fetchProjects: (departmentId: string) => Promise<void>;
  fetchProject: (projectId: string) => Promise<void>;
  createProject: (project: Omit<Project, "id" | "created_at">) => Promise<void>;
  updateProject: (
    projectId: string,
    updates: Partial<Project>
  ) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  createTask: (task: Omit<Task, "id" | "created_at">) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  fetchProjects: async (departmentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          tasks (
            id,
            title,
            description,
            status,
            due_date,
            assigned_to,
            created_at
          )
        `
        )
        .eq("department_id", departmentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ projects: data || [], isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          tasks (
            id,
            title,
            description,
            status,
            due_date,
            assigned_to,
            created_at
          )
        `
        )
        .eq("id", projectId)
        .single();

      if (error) throw error;
      set({ currentProject: data, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createProject: async (project) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("projects")
        .insert(project)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        projects: [data, ...state.projects],
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateProject: async (projectId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", projectId)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        projects: state.projects.map((p) => (p.id === projectId ? data : p)),
        currentProject:
          state.currentProject?.id === projectId ? data : state.currentProject,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteProject: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== projectId),
        currentProject:
          state.currentProject?.id === projectId ? null : state.currentProject,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createTask: async (task) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tasks")
        .insert(task)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        currentProject: state.currentProject
          ? {
              ...state.currentProject,
              tasks: [...(state.currentProject.tasks || []), data],
            }
          : null,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateTask: async (taskId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;
      set((state) => ({
        currentProject: state.currentProject
          ? {
              ...state.currentProject,
              tasks: state.currentProject.tasks?.map((t) =>
                t.id === taskId ? data : t
              ),
            }
          : null,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteTask: async (taskId) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = createClient();
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);

      if (error) throw error;
      set((state) => ({
        currentProject: state.currentProject
          ? {
              ...state.currentProject,
              tasks: state.currentProject.tasks?.filter((t) => t.id !== taskId),
            }
          : null,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));
