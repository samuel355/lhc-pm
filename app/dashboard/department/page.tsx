'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2, Building2 } from 'lucide-react';
import { DepartmentForm } from '@/components/departments/department-form';
import { EditDepartmentDialog } from '@/components/departments/edit-department-dialog';
import { DeleteDepartmentDialog } from '@/components/departments/delete-department-dialog';
import Link from 'next/link';

interface Department {
  id: string;
  name: string;
  created_at: string;
  projects_count?: number;
}

export default function DepartmentsPage() {
  const { user } = useUser();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchDepartments = async () => {
    const supabase = createClient();
    const { data: depts, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .order('created_at', { ascending: false });

    if (deptError) {
      console.error('Error fetching departments:', deptError);
      return;
    }

    // Get project counts for each department
    const deptsWithCounts = await Promise.all(
      depts.map(async (dept) => {
        const { count } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('department_id', dept.id);

        return {
          ...dept,
          projects_count: count || 0
        };
      })
    );

    setDepartments(deptsWithCounts);
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

  const isAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'sysadmin';
  const isDepartmentHead = user?.publicMetadata?.role === 'department_head';

  if (!isAdmin && !isDepartmentHead) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Departments</h1>
        {isAdmin && <DepartmentForm onSuccess={fetchDepartments} />}
      </div>

      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((department) => (
            <Card key={department.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  <Link 
                    href={`/dashboard/department/${department.id}`}
                    className="hover:underline"
                  >
                    {department.name}
                  </Link>
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {department.projects_count} {department.projects_count === 1 ? 'Project' : 'Projects'}
                  </div>
                  <div className="flex gap-2">
                    {(isAdmin || (isDepartmentHead && department.id === user.publicMetadata.department_id)) && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(department)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(department)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
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
