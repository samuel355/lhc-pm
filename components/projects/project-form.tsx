import { useState, useRef } from 'react';
import { useProjectStore } from '@/lib/store/project-store';
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
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  departmentId: string;
  project?: {
    id: string;
    name: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    attachments: string[];
  };
  onSuccess?: () => void;
}

export function ProjectForm({ departmentId, project, onSuccess }: ProjectFormProps) {
  const [open, setOpen] = useState(false);
  const { createProject, updateProject } = useProjectStore();
  const { user } = useUser();

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSysAdmin = user?.publicMetadata?.role === 'sysadmin';
  const userDepartmentId = user?.publicMetadata?.department_id as string | undefined;
  const canCreateProject = isSysAdmin || userDepartmentId === departmentId;

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
      start_date: project?.start_date ? new Date(project.start_date) : undefined,
      end_date: project?.end_date ? new Date(project.end_date) : undefined,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async (projectId: string | null = null) => {
    setUploading(true);
    const supabase = createClient();
    const urls: string[] = [];
    for (const file of files) {
      const path = `projects/${projectId || 'new'}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('project-attachments')
        .upload(path, file, { upsert: true });
      if (error) {
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }
      const url = supabase.storage.from('project-attachments').getPublicUrl(data.path).data.publicUrl;
      urls.push(url);
    }
    setUploading(false);
    return urls;
  };

  const onSubmit = async (values: ProjectFormValues) => {
    if (!canCreateProject) {
      toast.error('You do not have permission to create projects in this department');
      return;
    }

    try {
      let attachmentUrls: string[] = project?.attachments || [];
      if (files.length > 0) {
        attachmentUrls = [...attachmentUrls, ...await handleUpload(project?.id || null)];
      }
      if (project) {
        await updateProject(project.id, {
          ...values,
          start_date: values.start_date?.toISOString() || null,
          end_date: values.end_date?.toISOString() || null,
          attachments: attachmentUrls,
        });
      } else {
        await createProject({
          ...values,
          department_id: departmentId,
          start_date: values.start_date?.toISOString() || null,
          end_date: values.end_date?.toISOString() || null,
          created_by: user?.id || null,
          description: values.description || null,
          attachments: attachmentUrls,
        });
      }
      setFiles([]);
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project');
    }
  };

  if (!canCreateProject) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={project ? 'outline' : 'default'}>
          {project ? 'Edit Project' : 'New Project'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'Create New Project'}</DialogTitle>
          <DialogDescription>
            {project ? 'Update your project details below.' : 'Fill in the details to create a new project.'}
          </DialogDescription>
        </DialogHeader>
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
              <div>
                <FormLabel>Attachments (pictures/documents)</FormLabel>
                <Input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                />
                {files.length > 0 && (
                  <ul className="mt-2 text-sm text-muted-foreground">
                    {files.map((file) => (
                      <li key={file.name}>{file.name}</li>
                    ))}
                  </ul>
                )}
                {uploading && <p className="text-xs text-blue-500 mt-1">Uploading...</p>}
              </div>
              {project?.attachments && project.attachments.length > 0 && (
                <div className="mt-2">
                  <FormLabel>Existing Attachments</FormLabel>
                  <ul className="text-sm text-muted-foreground">
                    {project.attachments.map((url) => (
                      <li key={url}>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
                          {url.split('/').pop()}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {project ? 'Save Changes' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 