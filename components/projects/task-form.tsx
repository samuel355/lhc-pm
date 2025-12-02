import { useState } from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  CheckSquareIcon,
  ClockIcon,
  AlertCircleIcon,
  PlusIcon,
  EditIcon,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

const taskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed"]),
  start_date: z.date({ required_error: "Start date is required" }),
  end_date: z.date({ required_error: "End date is required" }),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  projectId: string;
  departmentId: string;
  task?: {
    id: string;
    title: string;
    description: string | null;
    status: "pending" | "in_progress" | "completed";
    start_date: string | null;
    end_date: string | null;
    created_by: string | null;
    department_id: string;
  };
  onSuccess?: () => void;
}

export function TaskForm({
  projectId,
  departmentId,
  task,
  onSuccess,
}: TaskFormProps) {
  const [open, setOpen] = useState(false);
  const { createTask, updateTask } = useProjectStore();
  const { user } = useUser();
  const userId = user?.id;

  const departmentIdStr = String(departmentId);

  // Permission logic
  let canCreateTask = false;
  if (user) {
    const userRole = user.publicMetadata.role;
    const userDepartmentId: string = user.publicMetadata
      .department_id as string;
    const isDepartmentHead: boolean = Boolean(
      user.publicMetadata.department_head
    );
    // If editing, always allow (edit button is only shown for existing tasks)
    if (task) {
      canCreateTask = true;
    } else {
      canCreateTask =
        userRole === "sysadmin" ||
        (isDepartmentHead &&
          typeof userDepartmentId === "string" &&
          userDepartmentId === departmentIdStr);
    }
  }

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      status: task?.status || "pending",
      start_date: task?.start_date ? new Date(task.start_date) : undefined,
      end_date: task?.end_date ? new Date(task.end_date) : undefined,
    },
  });

  const onSubmit = async (values: TaskFormValues) => {
    if (!canCreateTask) {
      toast.error(
        "You do not have permission to create tasks in this project."
      );
      return;
    }
    try {
      if (task) {
        await updateTask(task.id, {
          ...values,
          start_date: values.start_date?.toISOString() || null,
          end_date: values.end_date?.toISOString() || null,
        });
      } else {
        await createTask({
          ...values,
          project_id: projectId,
          department_id: departmentId,
          start_date: values.start_date?.toISOString() || null,
          end_date: values.end_date?.toISOString() || null,
          assigned_to: null,
          description: values.description || null,
          created_by: userId || null,
        });
      }
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  // Only show the button if allowed to create or edit
  if (!canCreateTask) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={task ? "outline" : "default"}
          className={
            task
              ? "hover:bg-chart-3/10 hover:text-chart-3 hover:border-chart-3/50 transition-all duration-300 cursor-pointer"
              : "hover:bg-primary/90 transition-all duration-300"
          }
        >
          <div className="flex items-center gap-2">
            {task ? (
              <>
                <EditIcon className="w-4 h-4" />
                <span>Edit Task</span>
              </>
            ) : (
              <>
                <PlusIcon className="w-4 h-4" />
                <span>New Task</span>
              </>
            )}
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-chart-2/10">
              <CheckSquareIcon className="w-5 h-5 text-chart-2" />
            </div>
            <div>
              <DialogTitle>
                {task ? "Edit Task" : "Create New Task"}
              </DialogTitle>
              <p className="text-muted-foreground text-base leading-relaxed">
                {task
                  ? "Update your task details below."
                  : "Fill in the details to create a new task."}
              </p>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 py-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold flex items-center gap-2">
                      <CheckSquareIcon className="w-4 h-4 text-primary" />
                      Task Title
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter task title"
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold flex items-center gap-2">
                      <AlertCircleIcon className="w-4 h-4 text-primary" />
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter task description"
                        className="resize-none transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-primary" />
                      Status
                    </FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value)}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent
                        className="glass-card z-80"
                        position="popper"
                      >
                        <SelectItem
                          value="pending"
                          className="flex items-center gap-2"
                        >
                          <AlertCircleIcon className="w-4 h-4 text-chart-4" />
                          <span>Pending</span>
                        </SelectItem>
                        <SelectItem
                          value="in_progress"
                          className="flex items-center gap-2"
                        >
                          <ClockIcon className="w-4 h-4 text-chart-2" />
                          <span>In Progress</span>
                        </SelectItem>
                        <SelectItem
                          value="completed"
                          className="flex items-center gap-2"
                        >
                          <CheckSquareIcon className="w-4 h-4 text-chart-3" />
                          <span>Completed</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={
                            field.value ? format(field.value, "yyyy-MM-dd") : ""
                          }
                          onChange={(e) => {
                            const date = e.target.value
                              ? new Date(e.target.value)
                              : undefined;
                            field.onChange(date);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : undefined;
                            field.onChange(date);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="hover:bg-muted/50 transition-all duration-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="hover:bg-primary/90 transition-all duration-300"
              >
                {task ? "Save Changes" : "Create Task"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
