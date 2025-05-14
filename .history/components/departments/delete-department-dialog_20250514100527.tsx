'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface Department {
  id: string;
  name: string;
}

interface DeleteDepartmentDialogProps {
  department: Department;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteDepartmentDialog({
  department,
  open,
  onOpenChange,
  onSuccess,
}: DeleteDepartmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);

    try {
      const supabase = createClient();
      
      // First, check if there are any projects in this department
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('department_id', department.id);

      if (projects && projects.length > 0) {
        toast({
          title: 'Cannot Delete Department',
          description: 'This department has associated projects. Please delete or reassign the projects first.',
          variant: 'destructive',
        });
        return;
      }

      // If no projects, proceed with deletion
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', department.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Department deleted successfully.',
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete department. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Department</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the department "{department.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Department'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 