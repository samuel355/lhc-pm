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
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Department {
  id: string;
  name: string;
  created_at: string;
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

    setDepartments(data || []);
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
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Departments</h1>
        <DepartmentForm onSuccess={fetchDepartments} />
      </div>

      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {departments.map((department) => (
            <Card key={department.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/department/${department.id}`)}>
              <CardHeader>
                <CardTitle>{department.name}</CardTitle>
                <CardDescription>
                  Created At:{" "}
                  {new Date(department.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Additional department details can go here if needed */}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(`/dashboard/department/${department.id}`)}
                  className="cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(department)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(department)}
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
