"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, FolderIcon, FileTextIcon, CalendarIcon, UploadIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { ProjectFormValues } from "./page";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import Image from "next/image";

export default function ProjectEditDialog({
  open,
  setOpen,
  onEditSubmit,
  form,
  projectError,
  attachments = [],
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onEditSubmit: (
    values: ProjectFormValues & { attachments?: string[] }
  ) => void;
  form: UseFormReturn<ProjectFormValues>;
  projectError: string | null;
  attachments?: string[];
}) {
  // File upload state
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Attachments state (for display)
  const existingAttachments: string[] = attachments;

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  // Upload files to Supabase Storage
  const handleUpload = async (projectId: string | null = null) => {
    setUploading(true);
    const supabase = createClient();
    const urls: string[] = [];
    for (const file of files) {
      const path = `projects/${projectId || "edit"}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("project-attachments")
        .upload(path, file, { upsert: true });
      if (error) {
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }
      const url = supabase.storage
        .from("project-attachments")
        .getPublicUrl(data.path).data.publicUrl;
      urls.push(url);
    }
    setUploading(false);
    return urls;
  };

  // Custom submit handler to handle file uploads
  const handleSubmit = async (values: ProjectFormValues) => {
    let attachmentUrls: string[] = existingAttachments || [];
    if (files.length > 0) {
      const uploaded = await handleUpload();
      attachmentUrls = [...attachmentUrls, ...uploaded];
    }
    onEditSubmit({ ...values, attachments: attachmentUrls });
    setFiles([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-chart-2/10">
              <FolderIcon className="w-5 h-5 text-chart-2" />
            </div>
            <div>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update the details of the project.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {projectError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{projectError}</AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="grid gap-6 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold flex items-center gap-2">
                      <FolderIcon className="w-4 h-4 text-primary" />
                      Project Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter project name"
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
                render={({ field: { onChange, onBlur, name, value, ref } }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold flex items-center gap-2">
                      <FileTextIcon className="w-4 h-4 text-primary" />
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter project description"
                        className="resize-none transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        rows={4}
                        name={name}
                        ref={ref}
                        onBlur={onBlur}
                        onChange={onChange}
                        value={value === null ? "" : value || ""}
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
                      <FormLabel className="text-sm font-semibold flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-chart-2" />
                        Start Date
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal transition-all duration-300 hover:border-chart-2/50 hover:bg-chart-2/5",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 glass-card" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
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
                      <FormLabel className="text-sm font-semibold flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-chart-3" />
                        End Date
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal transition-all duration-300 hover:border-chart-3/50 hover:bg-chart-3/5",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 glass-card" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* File upload UI */}
              <div className="space-y-3">
                <FormLabel className="text-sm font-semibold flex items-center gap-2">
                  <UploadIcon className="w-4 h-4 text-chart-4" />
                  Attachments (pictures/documents)
                </FormLabel>
                <Input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="transition-all duration-300 focus:ring-2 focus:ring-chart-4/20 focus:border-chart-4"
                />
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Selected files:</p>
                    <div className="space-y-1">
                      {files.map((file) => (
                        <div key={file.name} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                          <FileTextIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-chart-2">
                    <div className="w-4 h-4 border-2 border-chart-2 border-t-transparent rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </div>
                )}
              </div>
              {attachments && attachments.length > 0 && (
                <div className="space-y-3">
                  <FormLabel className="text-sm font-semibold flex items-center gap-2">
                    <FileTextIcon className="w-4 h-4 text-muted-foreground" />
                    Existing Attachments
                  </FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {attachments.map((url) => {
                      const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                      const isPdf = url.match(/\.pdf$/i);

                      return (
                        <div
                          key={url}
                          className="group relative overflow-hidden rounded-lg border border-border/50 hover:border-primary/50 transition-all duration-300"
                        >
                          {isImage ? (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                              <Image
                                width={100}
                                height={100}
                                src={url}
                                alt="attachment"
                                className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </a>
                          ) : (
                            <div className="p-4 bg-muted/50 flex items-center justify-center h-24">
                              <FileTextIcon className={cn("w-8 h-8", isPdf ? "text-destructive" : "text-muted-foreground")} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-white/90 text-black text-xs rounded-full font-medium"
                            >
                              View
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="hover:bg-muted/50 transition-all duration-300"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={uploading} className="hover:bg-primary/90 transition-all duration-300">
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
