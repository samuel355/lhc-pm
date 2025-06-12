"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useProjectStore } from "@/lib/store/project-store";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useUser } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import ProjectFormDialog from "./ProjectFormDialog";
import ProjectEditDialog from "./ProjectEditDialog";
import ProjectDeleteDialog from "./ProjectDeleteDialog";
import ProjectCard from "./ProjectCard";
import type { UserResource } from "@clerk/types";
import { toast } from "sonner";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().min(1, "Description is required").refine(
    (val) => val && val.trim().split(/\s+/).length >= 20,
    { message: "Description must be at least 20 words" }
  ),
  start_date: z.date({ required_error: "Start date is required" }),
  end_date: z.date().optional(),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

interface Department {
  id: string;
  name: string;
}

// Helper function for delete permission
function canDeleteProject(user: UserResource, projectDepartmentId: string, currentDepartmentId: string) {
  const userRole = user.publicMetadata.role;
  const userDepartmentId = user.publicMetadata.department_id;
  const isDepartmentHead = user.publicMetadata.department_head;

  if (userRole === "sysadmin") {
    return true;
  }
  if (
    isDepartmentHead &&
    userDepartmentId === currentDepartmentId &&
    projectDepartmentId === currentDepartmentId
  ) {
    return true;
  }
  return false;
}

export default function DepartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { projects, isLoading, error, fetchProjects } = useProjectStore();
  const [department, setDepartment] = useState<Department | null>(null);
  const [open, setOpen] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const { user } = useUser();
  const router = useRouter();

  // New states for editing
  const [editOpen, setEditOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectFormValues & { id: string } | null>(null);

  // New states for deleting
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      start_date: undefined,
      end_date: undefined,
    },
  });

  useEffect(() => {
    const fetchDepartment = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("id", resolvedParams.id)
        .single();

      if (error) {
        console.error("Error fetching department:", error);
        return;
      }

      setDepartment(data);
    };

    fetchDepartment();
    fetchProjects(resolvedParams.id);
  }, [resolvedParams.id, fetchProjects]);

  //Create Project
  const onSubmit = async (values: ProjectFormValues) => {
    try {
      if (!user) {
        setProjectError("User not authenticated.");
        return;
      }

      const {
        role: userRole,
        department_id: userDepartmentId,
        department_head: isDepartmentHead,
      } = user.publicMetadata;
      const currentDepartmentId = resolvedParams.id;

      // Permission
      const isAdmin = userRole === "sysadmin";
      const isDeptHeadForThisDept =
        isDepartmentHead &&
        userDepartmentId === currentDepartmentId;

      if (!isAdmin && !isDeptHeadForThisDept) {
        setProjectError("You do not have permission to create project in this department.");
        return;
      }

      setProjectError(null);
      setIsCreating(true);

      const supabase = createClient();
      await supabase.from("projects").insert({
        ...values,
        department_id: currentDepartmentId,
        start_date: values.start_date?.toISOString() || null,
        end_date: values.end_date?.toISOString() || null,
        created_by: user.id,
        description: values.description || null,
      });
      setOpen(false);
      fetchProjects(currentDepartmentId);
      toast.success("Project created successfully");
    } catch (error) {
      console.error("Error saving project:", error);
    } finally {
      setIsCreating(false);
    }
  };
 
  //Edit Project
  const onEditSubmit = async (values: ProjectFormValues) => {
    try {
      if (!user || !editingProject) {
        setProjectError("User not authenticated or project not selected for editing.");
        return;
      }

      const userRole = user.publicMetadata.role;
      const userDepartmentId = user.publicMetadata.department_id;
      const currentDepartmentId = resolvedParams.id;
      const isDepartmentHead = user.publicMetadata.department_head;

      if (userRole === "sysadmin") {
        // Sysadmin can proceed, no error
      } else if (userRole === "department_head" && isDepartmentHead && userDepartmentId === currentDepartmentId) {
        // Department head of *this* department can proceed, no error
      } else {
        // Not authorized. Provide specific error if department_head but wrong department.
        if (userRole === "department_head" && isDepartmentHead && userDepartmentId !== currentDepartmentId) {
          setProjectError("Department heads can only edit projects in their own department.");
        } else {
          setProjectError("You do not have permission to edit projects.");
        }
        return;
      }

      setProjectError(null); // Clear any previous errors

      const supabase = createClient();
      await supabase.from('projects').update({
        name: values.name,
        description: values.description || null,
        start_date: values.start_date?.toISOString() || null,
        end_date: values.end_date?.toISOString() || null,
      }).eq('id', editingProject.id);

      setEditOpen(false);
      setEditingProject(null);
      fetchProjects(resolvedParams.id);
    } catch (error) {
      console.error('Error updating project:', error);
      setProjectError("Failed to update project.");
    }
  };

  //Delete Project
  const onDeleteConfirm = async () => {

    try {
      if (!user || !projectToDelete) {
        setProjectError("User not authenticated or project not selected for deletion.");
        return;
      }

      const currentDepartmentId = resolvedParams.id;
      const supabase = createClient();
      const { data: projectData, error: fetchError } = await supabase
        .from('projects')
        .select('id, department_id')
        .eq('id', projectToDelete)
        .single();

      if (fetchError || !projectData) {
        console.error('Error fetching project for deletion check:', fetchError);
        setProjectError("Project not found or error checking permissions.");
        toast.error('Something went wrong deleting this project');
        return;
      }

      if (!canDeleteProject(user, projectData.department_id, currentDepartmentId)) {
        toast.error('You are not authorized to delete this project');
        setProjectError("You do not have permission to delete projects in this department.");
        return;
      }

      setProjectError(null); // Clear any previous errors

      await supabase.from('projects').delete().eq('id', projectToDelete);

      toast.success("Project deleted successfully");

      setDeleteConfirmOpen(false);
      setProjectToDelete(null);
      fetchProjects(resolvedParams.id);
      
    } catch (error) {
      console.error('Error deleting project:', error);
      setProjectError("Failed to delete project.");
    }
  };

  useEffect(() => {
    if (editOpen && editingProject) {
      form.reset({
        name: editingProject.name,
        description: editingProject.description || '',
        start_date: editingProject.start_date ? new Date(editingProject.start_date) : undefined,
        end_date: editingProject.end_date ? new Date(editingProject.end_date) : undefined,
      });
    } else if (!editOpen) {
      form.reset({
        name: '',
        description: '',
        start_date: undefined,
        end_date: undefined,
      });
    }
  }, [editOpen, editingProject, form]);

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Departments", href: "/dashboard/departments" },
    { label: department?.name || "Department" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Breadcrumb items={breadcrumbItems} />
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {department?.name || "Department"}
          </h2>
          <ProjectFormDialog
            open={open}
            setOpen={setOpen}
            onSubmit={onSubmit}
            form={form}
            projectError={projectError || ""}
            isCreating={isCreating}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects?.length === 0 ? (
          <p className="text-center text-muted-foreground col-span-full">
            No projects yet. Create a new project to get started.
          </p>
        ) : (
          projects?.map((project) => {
            const completedTasks =
              project.tasks?.filter((t) => t.status === "completed").length ||
              0;
            const totalTasks = project.tasks?.length || 0;
            const progress =
              totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            return (
              <ProjectCard
                key={project.id}
                project={project}
                progress={progress}
                onView={() => router.push(`/dashboard/projects/${project.id}`)}
                onEdit={() => {
                  setEditingProject({
                    id: project.id,
                    name: project.name,
                    description: project.description || "",
                    start_date: project.start_date ? new Date(project.start_date) : new Date(),
                    end_date: project.end_date ? new Date(project.end_date) : undefined,
                  });
                  setEditOpen(true);
                }}
                onDelete={() => {
                  setProjectToDelete(project.id);
                  setDeleteConfirmOpen(true);
                }}
              />
            );
          })
        )}
      </div>

      <ProjectEditDialog
        open={editOpen}
        setOpen={setEditOpen}
        onEditSubmit={onEditSubmit}
        form={form}
        projectError={projectError || ""}
      />
      <ProjectDeleteDialog
        open={deleteConfirmOpen}
        setOpen={setDeleteConfirmOpen}
        onDeleteConfirm={onDeleteConfirm}
      />
    </div>
  );
}
