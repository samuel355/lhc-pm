"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectForm } from "@/components/projects/project-form";
import { TaskForm } from "@/components/projects/task-form";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  CalendarIcon,
  ClipboardListIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  CircleDashedIcon,
  Trash2,
  FileIcon,
  FolderKanbanIcon,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useProjectStore } from "@/lib/store/project-store";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "completed" | "pending" | "in_progress";
  created_at: string;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  department_id: string;
  users: User;
}

interface User {
  role: string | null;
  full_name: string | null;
  email: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  users: User;
  department_id: string;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
  tasks: Task[];
  attachments?: string[];
}

type PageParams = {
  id: string;
  [key: string]: string;
};

const TASK_COLUMNS: {
  status: Task["status"];
  label: string;
  icon: typeof CircleDashedIcon;
  color: string;
  badgeColor: string;
}[] = [
  {
    status: "pending",
    label: "Pending",
    icon: CircleDashedIcon,
    color: "text-chart-4",
    badgeColor: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  },
  {
    status: "in_progress",
    label: "In Progress",
    icon: CircleDotIcon,
    color: "text-chart-2",
    badgeColor: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  },
  {
    status: "completed",
    label: "Completed",
    icon: CheckCircle2Icon,
    color: "text-chart-3",
    badgeColor: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  },
];

function TaskCard({
  task,
  project,
  onEditSuccess,
  onDeleteRequest,
}: {
  task: Task;
  project: Project;
  onEditSuccess: () => void;
  onDeleteRequest: (taskId: string) => void;
}) {
  const isOverdue = task.end_date && new Date(task.end_date) < new Date() && task.status !== "completed";

  return (
    <Card className="glass-card group hover:shadow-xl hover:shadow-primary/10 dark:hover:shadow-primary/20 transition-all duration-300 overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <h4 className="font-semibold group-hover:text-primary transition-colors duration-300">
          {task.title}
        </h4>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {task.description || "No description provided."}
        </p>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-3 h-3" />
            <span>
              {task.start_date ? new Date(task.start_date).toLocaleDateString() : "No start"}
              {" – "}
              {task.end_date ? new Date(task.end_date).toLocaleDateString() : "No end"}
            </span>
            {isOverdue && <span className="text-destructive font-semibold">Overdue</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">By:</span>
            <span>{task.users?.full_name || "Unknown"}</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
          <TaskForm
            projectId={project.id}
            departmentId={project.department_id}
            task={task}
            onSuccess={onEditSuccess}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDeleteRequest(task.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectPage() {
  const params = useParams<PageParams>();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [departmentName, setDepartmentName] = useState<string | null>(null);
  const { user } = useUser();
  const { deleteTask } = useProjectStore();
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [taskId, setTaskId] = useState<string>("");

  // New states for attachment deletion
  const [deleteAttachmentDialog, setDeleteAttachmentDialog] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(
    null
  );
  const [isDeletingAttachment, setIsDeletingAttachment] = useState(false);

  const fetchProject = useCallback(async (id: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("projects")
      .select(
        `
        *,
        tasks (
          *,
          users!tasks_created_by_fkey (
            full_name,
            email,
            role
          )
        ),
        users!projects_created_by_fkey (
          full_name,
          email,
          role
        )
        `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.log("Error fetching project:", error);
      return;
    }

    setProject(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string);
    }
  }, [params.id, fetchProject]);

  useEffect(() => {
    if (project?.department_id) {
      const fetchDepartmentName = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("departments")
          .select("name")
          .eq("id", project.department_id)
          .single();
        if (!error && data) setDepartmentName(data.name);
      };
      fetchDepartmentName();
    }
  }, [project?.department_id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return <div>Project not found</div>;
  }
  const tasks = project.tasks || [];
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Permission logic
  let canDeleteTask = false;

  if (user) {
    const userRole = user.publicMetadata.role;
    const userDepartmentId: string = user.publicMetadata
      .department_id as string;
    const isDepartmentHead: boolean = Boolean(
      user.publicMetadata.department_head
    );
    if (userRole === "sysadmin" || (userDepartmentId && isDepartmentHead)) {
      canDeleteTask = true;
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!canDeleteTask) {
      toast.error(
        "You do not have permission to create tasks in this project."
      );
      return;
    }

    try {
      await deleteTask(taskId);
      setDeleteAlert(false);
      toast.success("Task Deleted Successfully");
      fetchProject(params.id as string);
    } catch (error) {
      console.log(error);
      toast.error("Error occured deleting the task");
    }
  };

  // Function to extract filename from URL
  const getFileNameFromUrl = (url: string): string => {
    try {
      return url.split("/").pop() || "file";
    } catch {
      return "file";
    }
  };

  // Function to extract bucket and path from storage URL
  const extractBucketAndPath = (
    url: string
  ): { bucket: string; path: string } | null => {
    try {
      // Assuming URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split("/");

      // Find the index of "object/public/"
      const publicIndex = pathSegments.indexOf("object") + 1;
      if (publicIndex < pathSegments.length - 1) {
        const bucket = pathSegments[publicIndex + 1];
        const path = pathSegments.slice(publicIndex + 2).join("/");
        return { bucket, path };
      }
    } catch (error) {
      console.error("Error parsing URL:", error);
    }
    return null;
  };

  // Handle attachment deletion
  const handleDeleteAttachment = async () => {
    if (!project || !attachmentToDelete) return;

    setIsDeletingAttachment(true);
    try {
      const supabase = createClient();

      // 1. First, try to delete from storage if it's a storage URL
      const bucketInfo = extractBucketAndPath(attachmentToDelete);
      if (bucketInfo) {
        const { error: storageError } = await supabase.storage
          .from(bucketInfo.bucket)
          .remove([bucketInfo.path]);

        if (storageError) {
          console.warn(
            "Could not delete from storage, but will update database:",
            storageError
          );
          // Continue with database update even if storage deletion fails
        }
      }

      // 2. Update the project's attachments array in database
      const updatedAttachments =
        project.attachments?.filter(
          (attachment) => attachment !== attachmentToDelete
        ) || [];

      const { error: updateError } = await supabase
        .from("projects")
        .update({ attachments: updatedAttachments })
        .eq("id", project.id);

      if (updateError) throw updateError;

      // 3. Update local state
      setProject({
        ...project,
        attachments: updatedAttachments,
      });

      toast.success("Attachment deleted successfully");
      setDeleteAttachmentDialog(false);
      setAttachmentToDelete(null);
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast.error("Failed to delete attachment");
    } finally {
      setIsDeletingAttachment(false);
    }
  };

  // Permission check for attachment deletion
  const canDeleteAttachment = (): boolean => {
    if (!user) return false;

    const userRole = user.publicMetadata.role;
    const userDepartmentId = user.publicMetadata.department_id as string;
    const isDepartmentHead = Boolean(user.publicMetadata.department_head);

    return (
      userRole === "sysadmin" ||
      (userDepartmentId && isDepartmentHead) ||
      user.id === project?.users.email // Allow creator to delete
    );
  };

  // Open delete confirmation dialog
  const openDeleteAttachmentDialog = (attachmentUrl: string) => {
    setAttachmentToDelete(attachmentUrl);
    setDeleteAttachmentDialog(true);
  };

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: departmentName || "Department", href: `/dashboard/department/${project.department_id}` },
    { label: project.name },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        breadcrumb={<Breadcrumb items={breadcrumbItems} />}
        title={project.name}
        description={
          <Link
            href={`/dashboard/department/${project.department_id}`}
            className="hover:text-primary transition-colors"
          >
            Department:{" "}
            <span className="font-semibold text-primary">
              {departmentName || "Loading..."}
            </span>
          </Link>
        }
        actions={
          <>
            <ProjectForm
              departmentId={project.department_id}
              project={{ ...project, attachments: project.attachments ?? [] }}
              onSuccess={() => fetchProject(params.id as string)}
            />
            <TaskForm
              projectId={project.id}
              departmentId={project.department_id}
              onSuccess={() => fetchProject(params.id as string)}
            />
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={totalTasks} icon={ClipboardListIcon} color="primary" />
        <StatCard label="Completed" value={completedTasks} icon={CheckCircle2Icon} color="chart-3" />
        <StatCard label="In Progress" value={inProgressTasks} icon={CircleDotIcon} color="chart-2" />
        <StatCard label="Pending" value={pendingTasks} icon={CircleDashedIcon} color="chart-4" />
      </div>

      <Card className="glass-card">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
              <FolderKanbanIcon className="w-5 h-5" />
              Overview
            </h3>
            <Badge className="bg-primary/10 text-primary border-primary/20">
              {progress.toFixed(0)}% Complete
            </Badge>
          </div>

          <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-base leading-relaxed">
              <span className="font-semibold text-foreground">Description:</span>{" "}
              <span className="text-muted-foreground">{project.description}</span>
            </p>
            <p className="text-base leading-relaxed mt-1 font-semibold">
              Created By: <span>{project.users.full_name}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-chart-2/5 border border-chart-2/20">
              <CalendarIcon className="w-5 h-5 text-chart-2" />
              <div>
                <span className="font-semibold text-sm text-chart-2">Start Date</span>
                <p className="text-sm text-muted-foreground">
                  {project.start_date
                    ? new Date(project.start_date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "Not set"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-chart-3/5 border border-chart-3/20">
              <CalendarIcon className="w-5 h-5 text-chart-3" />
              <div>
                <span className="font-semibold text-sm text-chart-3">End Date</span>
                <p className="text-sm text-muted-foreground">
                  {project.end_date
                    ? new Date(project.end_date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "Not set"}
                </p>
              </div>
            </div>
          </div>

          {project?.attachments && project.attachments.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-4 text-primary">Attachments</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {project.attachments.map((url) => {
                  const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                  const isPdf = url.match(/\.pdf$/i);
                  const fileName = getFileNameFromUrl(url);
                  const canDelete = canDeleteAttachment();

                  return (
                    <div
                      key={url}
                      className="group relative overflow-hidden rounded-lg border border-border/50 hover:border-primary/50 transition-colors duration-300"
                    >
                      {canDelete && (
                        <button
                          onClick={() => openDeleteAttachmentDialog(url)}
                          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-destructive/90 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-destructive"
                          title="Delete attachment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isImage ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="block relative">
                          <div className="relative h-24 w-full">
                            <Image
                              fill
                              src={url}
                              alt={fileName}
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          </div>
                          <div className="p-2 bg-background/80 backdrop-blur-sm">
                            <p className="text-xs text-muted-foreground truncate">{fileName}</p>
                          </div>
                        </a>
                      ) : (
                        <div className="p-4 text-center h-full flex flex-col">
                          <div className="flex-1 flex items-center justify-center mb-2">
                            {isPdf ? (
                              <div className="relative">
                                <FileIcon className="w-10 h-10 text-destructive" />
                                <span className="absolute -top-1 -right-1 text-xs font-bold text-destructive">
                                  PDF
                                </span>
                              </div>
                            ) : (
                              <FileIcon className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-primary hover:underline truncate block"
                            title={fileName}
                          >
                            {fileName}
                          </a>
                          <p className="text-xs text-muted-foreground mt-1">
                            {isPdf ? "PDF Document" : "File"}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Tasks
        </h2>

        {tasks.length === 0 ? (
          <EmptyState
            icon={ClipboardListIcon}
            title="No Tasks Yet"
            description="Create tasks to track progress and manage work items."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {TASK_COLUMNS.map((column) => {
              const columnTasks = tasks.filter((t) => t.status === column.status);
              const Icon = column.icon;
              return (
                <div key={column.status} className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div className={`flex items-center gap-2 font-semibold ${column.color}`}>
                      <Icon className="w-4 h-4" />
                      <span>{column.label}</span>
                    </div>
                    <Badge className={`${column.badgeColor} border`}>{columnTasks.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {columnTasks.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/60 py-8 text-center text-sm text-muted-foreground">
                        No tasks
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          project={project}
                          onEditSuccess={() => fetchProject(params.id as string)}
                          onDeleteRequest={(id) => {
                            setTaskId(id);
                            setDeleteAlert(true);
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Attachment Confirmation Dialog */}
      <Dialog open={deleteAttachmentDialog} onOpenChange={setDeleteAttachmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Delete Attachment
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this attachment? This action will:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Remove the file from storage</li>
                <li>Remove the attachment from the project</li>
                <li className="text-destructive font-semibold">This action cannot be undone</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteAttachmentDialog(false);
                setAttachmentToDelete(null);
              }}
              disabled={isDeletingAttachment}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAttachment}
              disabled={isDeletingAttachment}
            >
              {isDeletingAttachment ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Attachment
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {deleteAlert && (
        <AlertDialog open={deleteAlert} onOpenChange={setDeleteAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                task under this project
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                variant={"destructive"}
                size={"sm"}
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => handleDeleteTask(taskId)}
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Task</span>
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
