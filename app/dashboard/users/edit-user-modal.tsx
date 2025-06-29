'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from '@/utils/supabase/client';
//import { v5 as uuidv5 } from 'uuid';
import { Checkbox } from '@/components/ui/checkbox';

// Convert Clerk user ID to UUID format
// function clerkIdToUuid(clerkId: string): string {
//   // Use a namespace UUID for consistent generation
//   const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
//   return uuidv5(clerkId, NAMESPACE);
// }

interface Department {
  id: string;
  name: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    position?: string | null;
    department_id?: string | null;
    department_head?: boolean | null;
  };
  departments: Department[];
  onUserUpdated: () => void;
}

export function EditUserModal({
  isOpen,
  onClose,
  user,
  departments,
  onUserUpdated,
}: EditUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    position: user.position || '',
    department_id: user.department_id || 'none',
    department_head: user.department_head || false,
  });

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      //const supabaseId = clerkIdToUuid(user.id);
      const { error } = await supabase
        .from('users')
        .update({
          full_name: `${formData.firstName} ${formData.lastName}`,
          role: formData.role,
          position: formData.position,
          department_id:
            formData.department_id === 'none'
              ? null
              : formData.department_id,
          department_head: formData.department_head,
        })
        .eq('clerk_id', user.id);
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      console.log('Supabase update successful.');

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          position: formData.position,
          department_id:
            formData.department_id === 'none'
              ? null
              : formData.department_id,
          department_head: formData.department_head,
        }),
      });
      if (!res.ok) throw new Error('Failed to update user metadata');

      onUserUpdated();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] overflow-visible">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role */}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={formData.role}
              onValueChange={(val) =>
                setFormData((p) => ({ ...p, role: val }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="
                  w-[var(--radix-select-trigger-width)]
                  z-[1000]
                  bg-white dark:bg-gray-800
                  border border-gray-200 dark:border-gray-700
                  rounded-md
                  shadow-lg
                "
              >
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="sysadmin">System Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label>Department</Label>
            <Select
              value={formData.department_id}
              onValueChange={(val) =>
                setFormData((p) => ({ ...p, department_id: val }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="
                  w-[var(--radix-select-trigger-width)]
                  z-[1000]
                  bg-white dark:bg-gray-800
                  border border-gray-200 dark:border-gray-700
                  rounded-md
                  shadow-lg
                "
              >
                <SelectItem value="none">No Department</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* First Name */}
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input
              value={formData.firstName}
              onChange={(e) =>
                setFormData((p) => ({ ...p, firstName: e.target.value }))
              }
              placeholder="Enter first name"
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input
              value={formData.lastName}
              onChange={(e) =>
                setFormData((p) => ({ ...p, lastName: e.target.value }))
              }
              placeholder="Enter last name"
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} disabled />
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label>Position</Label>
            <Input
              value={formData.position}
              onChange={(e) =>
                setFormData((p) => ({ ...p, position: e.target.value }))
              }
              placeholder="Enter position"
            />
          </div>

          {/* Department Head */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="department_head"
              checked={formData.department_head}
              onCheckedChange={(checked: boolean) => setFormData(p => ({ ...p, department_head: checked }))}
            />
            <Label htmlFor="department_head">Department Head</Label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
