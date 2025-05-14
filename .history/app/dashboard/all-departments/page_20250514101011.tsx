'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@/utils/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { DepartmentForm } from '@/components/departments/department-form';
import { EditDepartmentDialog } from '@/components/departments/edit-department-dialog';
import { DeleteDepartmentDialog } from '@/components/departments/delete-department-dialog';

interface Department {
  id: string;
  name: string;
  created_at: string;
}

export default function AllDepartmentsPage() {
  const { user } = useUser();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchDepartments = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching departments:', error);
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

  if (user?.publicMetadata?.role !== 'sysadmin') {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">You don&apos;t have permission to view this page.</p>
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell className="font-medium">{department.name}</TableCell>
                  <TableCell>
                    {new Date(department.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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