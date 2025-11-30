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
import { DeleteIcon } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { AlertDialogTitle } from "@radix-ui/react-alert-dialog";

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
  const [taskId, setTaskId] = useState<string>('');

  const fetchProject = useCallback(async (id: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("projects")
      .select(
        `
      *,
      tasks (*),
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
  console.log(project.users);
  const tasks = project.tasks || [];
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
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
    console.log(taskId);
    if (!canDeleteTask) {
      toast.error(
        "You do not have permission to create tasks in this project."
      );
      return;
    }

    try {
      await deleteTask(taskId);
      setDeleteAlert(false)
      toast.success("Task Deleted Successfully");
    } catch (error) {
      console.log(error);
      toast.error("Error occured deleting the task");
    }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {project.name}
          </h1>
          <p className="text-muted-foreground text-lg">
            Department:{" "}
            <span className="font-semibold text-primary">
              {departmentName || "Loading..."}
            </span>
          </p>
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
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-base leading-relaxed">
                      <span className="font-semibold text-foreground">
                        Description:
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {project.description}
                      </span>
                    </p>
                    <p className="text-base leading-relaxed mt-1 font-semibold">
                      Created By: <span>{project.users.full_name}</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-chart-2/5 border border-chart-2/20">
                      <CalendarIcon className="w-5 h-5 text-chart-2" />
                      <div>
                        <span className="font-semibold text-sm text-chart-2">
                          Start Date
                        </span>
                        <p className="text-sm text-muted-foreground">
                          {project.start_date
                            ? new Date(project.start_date).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : "Not set"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-chart-3/5 border border-chart-3/20">
                      <CalendarIcon className="w-5 h-5 text-chart-3" />
                      <div>
                        <span className="font-semibold text-sm text-chart-3">
                          End Date
                        </span>
                        <p className="text-sm text-muted-foreground">
                          {project.end_date
                            ? new Date(project.end_date).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-primary">
                        Progress
                      </span>
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
                  </div>
                </div>
              </div>

              {project?.attachments && project.attachments.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-primary">
                    Attachments
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {project.attachments.map((url) => {
                      const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                      const isPdf = url.match(/\.pdf$/i);

                      return (
                        <div
                          key={url}
                          className="group relative overflow-hidden rounded-lg border border-border/50 hover:border-primary/50 transition-colors duration-300"
                        >
                          {isImage ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <Image
                                width={120}
                                height={120}
                                src={url}
                                alt="attachment"
                                className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </a>
                          ) : isPdf ? (
                            <div className="p-4 text-center">
                              <svg
                                className="w-8 h-8 mx-auto mb-2 text-destructive"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                View PDF
                              </a>
                            </div>
                          ) : (
                            <div className="p-4 text-center">
                              <svg
                                className="w-8 h-8 mx-auto mb-2 text-muted-foreground"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline break-all"
                              >
                                {url.split("/").pop()}
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

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
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-chart-2/5 border border-chart-2/20">
                    <span className="font-semibold text-chart-2">
                      Total Tasks
                    </span>
                    <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                      {totalTasks}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-chart-3/5 border border-chart-3/20">
                    <span className="font-semibold text-chart-3">
                      Completed
                    </span>
                    <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20">
                      {completedTasks}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-chart-4/5 border border-chart-4/20">
                    <span className="font-semibold text-chart-4">Pending</span>
                    <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">
                      {totalTasks - completedTasks}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Tasks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task, index) => {
            const getStatusColor = (status: string) => {
              switch (status) {
                case "completed":
                  return "bg-chart-3/10 text-chart-3 border-chart-3/20";
                case "in_progress":
                  return "bg-chart-2/10 text-chart-2 border-chart-2/20";
                case "pending":
                  return "bg-chart-4/10 text-chart-4 border-chart-4/20";
                default:
                  return "bg-muted/10 text-muted-foreground border-muted/20";
              }
            };

            const getStatusIcon = (status: string) => {
              switch (status) {
                case "completed":
                  return (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  );
                case "in_progress":
                  return (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  );
                case "pending":
                  return (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  );
                default:
                  return (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  );
              }
            };

            return (
              <Card
                key={task.id}
                className="glass-card group hover:shadow-2xl hover:shadow-primary/10 dark:hover:shadow-primary/20 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="relative p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold group-hover:text-primary transition-colors duration-300 mb-2">
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        <span>Task</span>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(task.status)} border`}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(task.status)}
                        <span className="capitalize">
                          {task.status.replace("_", " ")}
                        </span>
                      </div>
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {task.description || "No description provided."}
                    </p>

                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-3 h-3" />
                        <span>
                          Start:{" "}
                          {task.start_date
                            ? new Date(task.start_date).toLocaleDateString()
                            : "Not set"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-3 h-3" />
                        <span>
                          End:{" "}
                          {task.end_date
                            ? new Date(task.end_date).toLocaleDateString()
                            : "Not set"}
                        </span>
                        {task.end_date &&
                          new Date(task.end_date) < new Date() && (
                            <span className="ml-2 text-destructive font-semibold">
                              Overdue
                            </span>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border/50">
                    <TaskForm
                      projectId={project.id}
                      departmentId={project.department_id}
                      task={task}
                      onSuccess={() => fetchProject(params.id as string)}
                    />
                    {task.id && (
                      <Button
                        variant={"destructive"}
                        size={"sm"}
                        className="flex items-center gap-4 cursor-pointer"
                        onClick={() => {
                          setDeleteAlert((prevState) => !prevState);
                          setTaskId(task.id);
                        }}
                        //onClick={() => handleDeleteTask(task.id)}
                      >
                        <DeleteIcon className="w-4 h-4" />
                        <span>Delete Task</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mb-4">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Tasks Yet</h3>
            <p className="text-muted-foreground">
              Create tasks to track progress and manage work items.
            </p>
          </div>
        )}
      </div>

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
