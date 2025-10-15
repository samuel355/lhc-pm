"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/utils/supabase/client";
import { DepartmentForm } from "@/components/departments/department-form";
import { EditDepartmentDialog } from "@/components/departments/edit-department-dialog";
import { DeleteDepartmentDialog } from "@/components/departments/delete-department-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, Building2Icon } from "lucide-react";
import { useRouter } from "next/navigation";

interface Department {
  id: string;
  name: string;
  created_at: string;
  projectCount?: number;
}

export default function AllDepartmentsPage() {
  const { user } = useUser();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const router = useRouter()
  const hasAccess = user?.publicMetadata?.department_id;

  const fetchDepartments = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching departments:", error);
      return;
    }

    // Fetch project counts for each department
    const departmentsWithCounts = await Promise.all(
      (data || []).map(async (dept) => {
        const { count } = await supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("department_id", dept.id);
        return {
          ...dept,
          projectCount: count ?? 0,
        };
      })
    );

    setDepartments(departmentsWithCounts);
    setLoading(false);
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (department: Department) => {
    setSelectedDepartment(department);
    setIsDeleteDialogOpen(true);
  };

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          You don&apos;t have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 animate-slide-up">
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            All Departments
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage and organize your departments
          </p>
        </div>
        <DepartmentForm onSuccess={fetchDepartments} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="glass-card animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-1/3"></div>
              </CardContent>
              <CardFooter>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-muted rounded"></div>
                  <div className="h-8 w-8 bg-muted rounded"></div>
                  <div className="h-8 w-8 bg-muted rounded"></div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {departments.map((department, index) => (
            <Card 
              key={department.id} 
              className="glass-card group hover:shadow-2xl hover:shadow-primary/10 dark:hover:shadow-primary/20 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors duration-300">
                      {department.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Created {new Date(department.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </CardDescription>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                    <Building2Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    {department.projectCount === 0 ? (
                      <span className="text-sm text-muted-foreground">No Projects</span>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-primary">{department.projectCount}</div>
                        <span className="text-sm text-muted-foreground">
                          {department.projectCount === 1 ? 'Project' : 'Projects'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(`/dashboard/department/${department.id}`)}
                  className="hover:bg-primary/10 hover:text-primary transition-colors duration-300"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(department);
                    }}
                    className="hover:bg-chart-2/10 hover:text-chart-2 transition-colors duration-300"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(department);
                    }}
                    className="hover:bg-destructive/10 hover:text-destructive transition-colors duration-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {selectedDepartment && (
        <>
          <EditDepartmentDialog
            department={selectedDepartment}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSuccess={fetchDepartments}
          />
          <DeleteDepartmentDialog
            department={selectedDepartment}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onSuccess={fetchDepartments}
          />
        </>
      )}
    </div>
  );
}
