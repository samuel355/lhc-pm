"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectForm } from "@/components/projects/project-form";
import { TaskForm } from "@/components/projects/task-form";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import { DeleteIcon, Trash2, FileIcon } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

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
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);
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

  // Function to extract filename from URL
  const getFileNameFromUrl = (url: string): string => {
    try {
      return url.split("/").pop() || "file";
    } catch {
      return "file";
    }
  };

  // Function to extract bucket and path from storage URL
  const extractBucketAndPath = (url: string): { bucket: string; path: string } | null => {
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
          console.warn("Could not delete from storage, but will update database:", storageError);
          // Continue with database update even if storage deletion fails
        }
      }

      // 2. Update the project's attachments array in database
      const updatedAttachments = project.attachments?.filter(
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
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Permission logic for tasks
  let canDeleteTask = false;
  if (user) {
    const userRole = user.publicMetadata.role;
    const userDepartmentId: string = user.publicMetadata.department_id as string;
    const isDepartmentHead: boolean = Boolean(user.publicMetadata.department_head);
    if (userRole === "sysadmin" || (userDepartmentId && isDepartmentHead)) {
      canDeleteTask = true;
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    console.log(taskId);
    if (!canDeleteTask) {
      toast.error("You do not have permission to delete tasks in this project.");
      return;
    }

    try {
      await deleteTask(taskId);
      setDeleteAlert(false);
      toast.success("Task Deleted Successfully");
      fetchProject(params.id as string);
    } catch (error) {
      console.log(error);
      toast.error("Error occurred deleting the task");
    }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* ... existing header code ... */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {project.name}
          </h1>
          <Link
            href={`/dashboard/department/${project.department_id}`}
            className="text-muted-foreground text-lg"
          >
            Department:{" "}
            <span className="font-semibold text-primary">
              {departmentName || "Loading..."}
            </span>
          </Link>
        </div>
        <div className="flex gap-3">
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
        </div>
      </div>

      <Card className="glass-card">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              {/* ... existing project details ... */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-primary flex items-center gap-2">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  Project Details
                </h3>
                {/* ... existing project details content ... */}
              </div>

              {/* ATTACHMENTS SECTION - Updated with delete functionality */}
              {project?.attachments && project.attachments.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-primary">
                      Attachments ({project.attachments.length})
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {project.attachments.map((url) => {
                      const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
                      const isPdf = url.match(/\.pdf$/i);
                      const fileName = getFileNameFromUrl(url);
                      const canDelete = canDeleteAttachment();

                      return (
                        <div
                          key={url}
                          className="group relative overflow-hidden rounded-lg border border-border/50 hover:border-primary/50 transition-all duration-300"
                        >
                          {/* Delete button overlay */}
                          {canDelete && (
                            <button
                              onClick={() => openDeleteAttachmentDialog(url)}
                              className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-destructive/90 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-destructive"
                              title="Delete attachment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* File content */}
                          {isImage ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block relative"
                            >
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
                                <p className="text-xs text-muted-foreground truncate">
                                  {fileName}
                                </p>
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
            </div>

            {/* ... existing task summary section ... */}
            <div className="lg:border-l lg:pl-8 border-border/50">
              <h3 className="text-2xl font-semibold mb-6 text-primary flex items-center gap-2">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                Task Summary
              </h3>
              {/* ... existing task summary content ... */}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ... existing tasks section ... */}

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
              {attachmentToDelete && (
                <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium">File to delete:</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {getFileNameFromUrl(attachmentToDelete)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {attachmentToDelete}
                  </p>
                </div>
              )}
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

      {/* ... existing task delete dialog ... */}
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
                className="flex items-center gap-4 cursor-pointer"
                onClick={() => handleDeleteTask(taskId)}
              >
                <DeleteIcon className="w-4 h-4" />
                <span>Delete Task</span>
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}