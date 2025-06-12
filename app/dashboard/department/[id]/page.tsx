'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { useProjectStore } from '@/lib/store/project-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useUser } from '@clerk/nextjs';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface Department {
  id: string;
  name: string;
}

export default function DepartmentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { projects, isLoading, error, fetchProjects } = useProjectStore();
  const [department, setDepartment] = useState<Department | null>(null);
  const [open, setOpen] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const { user } = useUser();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      start_date: undefined,
      end_date: undefined,
    },
  });

  useEffect(() => {
    const fetchDepartment = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

      if (error) {
        console.error('Error fetching department:', error);
        return;
      }

      setDepartment(data);
    };

    fetchDepartment();
    fetchProjects(resolvedParams.id);
  }, [resolvedParams.id, fetchProjects]);

  const onSubmit = async (values: ProjectFormValues) => {
    try {
      if (!user) {
        setProjectError("User not authenticated.");
        return;
      }

      const userRole = user.publicMetadata.role;
      const userDepartmentId = user.publicMetadata.department_id;
      const currentDepartmentId = resolvedParams.id;

      if (userRole !== "sysadmin") {
        if (userRole === "department_head" && userDepartmentId !== currentDepartmentId) {
          setProjectError("Department heads can only create projects in their own department.");
          return;
        } else if (userRole !== "department_head") {
          setProjectError("You do not have permission to create projects.");
          return;
        }
      }

      setProjectError(null); // Clear any previous errors

      const supabase = createClient();
      await supabase.from('projects').insert({
        ...values,
        department_id: resolvedParams.id,
        start_date: values.start_date?.toISOString() || null,
        end_date: values.end_date?.toISOString() || null,
        created_by: null,
        description: values.description || null,
      });
      setOpen(false);
      fetchProjects(resolvedParams.id);
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Departments', href: '/dashboard/departments' },
    { label: department?.name || 'Department' }
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
          <h2 className="text-2xl font-bold">{department?.name || 'Department'}</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>New Project</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new project.
                </DialogDescription>
              </DialogHeader>
              {projectError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{projectError}</AlertDescription>
                </Alert>
              )}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 py-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter project name" {...field} />
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
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter project description"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
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
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      'w-full pl-3 text-left font-normal',
                                      !field.value && 'text-muted-foreground'
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, 'PPP')
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date('1900-01-01')
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
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
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      'w-full pl-3 text-left font-normal',
                                      !field.value && 'text-muted-foreground'
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, 'PPP')
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date('1900-01-01')
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      Create Project
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects?.length === 0 ? (
          <p className="text-center text-muted-foreground col-span-full">No projects yet. Create a new project to get started.</p>
        ) : (
          projects?.map((project) => {
            const completedTasks = project.tasks?.filter(t => t.status === 'completed').length || 0;
            const totalTasks = project.tasks?.length || 0;
            const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            const description = project.description || '';
            const truncatedDescription = description.length > 100 
              ? `${description.slice(0, 100)}...` 
              : description;

            return (
              <Card key={project.id} className="hover:shadow-md transition cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium">{project.name}</h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        {truncatedDescription}
                      </p>
                    </div>
                    <Badge variant={progress === 100 ? "default" : "secondary"}>
                      {progress.toFixed(0)}% Complete
                    </Badge>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Start: {new Date(project.start_date || '').toLocaleDateString()}</span>
                      <span>End: {new Date(project.end_date || '').toLocaleDateString()}</span>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
} 