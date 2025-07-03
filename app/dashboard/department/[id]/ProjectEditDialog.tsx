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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update the details of the project.
          </DialogDescription>
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
            className="space-y-4"
          >
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
                render={({ field: { onChange, onBlur, name, value, ref } }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter project description"
                        className="resize-none"
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
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
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
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
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
                {uploading && (
                  <p className="text-xs text-blue-500 mt-1">Uploading...</p>
                )}
              </div>
              {attachments && attachments.length > 0 && (
                <div className="mt-2">
                  <FormLabel>Existing Attachments</FormLabel>
                  <div className="mt-4 w-full">
                    <div className="flex flex-wrap gap-4">
                      {attachments?.map((url) => {
                        const isImage = url.match(
                          /\.(jpg|jpeg|png|gif|webp)$/i
                        );
                        const isPdf = url.match(/\.pdf$/i);

                        return (
                          <div
                            key={url}
                            className="flex flex-col items-center max-w-[120px]"
                          >
                            {isImage ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Image
                                  width={100}
                                  height={100}
                                  src={url}
                                  alt="attachment"
                                  className="w-24 h-24 object-cover rounded border"
                                />
                              </a>
                            ) : isPdf ? (
                              <object
                                data={url}
                                type="application/pdf"
                                width="100"
                                height="100"
                                className="border rounded"
                              >
                                {/* Fallback to link if object/embed fails */}
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline text-sm break-all"
                                >
                                  View PDF
                                </a>
                              </object>
                            ) : (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-sm break-all"
                              >
                                {url.split("/").pop()}
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
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
                Update Project
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
