import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@clerk/nextjs";
import { Building2Icon, PlusIcon } from "lucide-react";

const departmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

interface DepartmentFormProps {
  onSuccess?: () => void;
}

export function DepartmentForm({ onSuccess }: DepartmentFormProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const isAdmin = user?.publicMetadata.role === "sysadmin";

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: DepartmentFormValues) => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      const { error } = await supabase
        .from("departments")
        .insert([{ name: values.name }]);

      if (error) throw error;

      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error creating department:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isAdmin && (
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="justify-center hover:bg-chart-1/10 hover:text-chart-1 hover:border-chart-1/50 transition-all duration-300"
          >
            <div className="flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              <span>Add Department</span>
            </div>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-chart-1/10">
              <Building2Icon className="w-5 h-5 text-chart-1" />
            </div>
            <div>
              <DialogTitle>Create New Department</DialogTitle>
              <p className="text-muted-foreground text-base leading-relaxed">
                Add a new department to organize your teams and projects.
              </p>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold flex items-center gap-2">
                      <Building2Icon className="w-4 h-4 text-primary" />
                      Department Name
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter department name" 
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                disabled={isLoading}
                className="hover:bg-primary/90 transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  "Create Department"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
