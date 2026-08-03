"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/utils/supabase/client";
import { DepartmentForm } from "@/components/departments/department-form";
import { EditDepartmentDialog } from "@/components/departments/edit-department-dialog";
import { DeleteDepartmentDialog } from "@/components/departments/delete-department-dialog";
import { DepartmentCard } from "@/components/departments/department-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2Icon, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface Department {
  id: string;
  name: string;
  created_at: string;
  projectCount?: number;
  isSysadmin?: boolean;
}

export default function AllDepartmentsPage() {
  const { user } = useUser();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const router = useRouter()
  const hasAccess = user?.publicMetadata?.department_id || user?.publicMetadata?.role === 'sysadmin';
  const isSysadmin = user?.publicMetadata?.role === 'sysadmin';

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

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return departments;
    return departments.filter((dept) => dept.name.toLowerCase().includes(query));
  }, [departments, search]);

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
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="All Departments"
        description="Manage and organize your departments"
        actions={<DepartmentForm onSuccess={fetchDepartments} />}
      />

      {!loading && departments.length > 0 && (
        <div className="relative max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search departments..."
            className="pl-9"
          />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="glass-card animate-pulse p-5">
              <div className="h-8 w-8 bg-muted rounded-md mb-4"></div>
              <div className="h-5 bg-muted rounded w-3/4 mb-3"></div>
              <div className="flex gap-2">
                <div className="h-5 bg-muted rounded w-20"></div>
                <div className="h-5 bg-muted rounded w-20"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredDepartments.length === 0 ? (
        <EmptyState
          icon={Building2Icon}
          title={search ? "No departments match your search" : "No Departments Yet"}
          description={
            search
              ? "Try a different search term."
              : "Create a department to start organizing projects."
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredDepartments.map((department, index) => (
            <DepartmentCard
              key={department.id}
              department={department}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => router.push(`/dashboard/department/${department.id}`)}
              onEdit={() => handleEdit(department)}
              onDelete={() => handleDelete(department)}
            />
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
            isSysadmin={isSysadmin}
          />
          <DeleteDepartmentDialog
            department={selectedDepartment}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onSuccess={fetchDepartments}
            isSysadmin={isSysadmin}
          />
        </>
      )}
    </div>
  );
}
