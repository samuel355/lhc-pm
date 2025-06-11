'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Department {
  id: string;
  name: string;
}

interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    position?: string;
    department_id?: string;
    department_head?: boolean;
  };
  departments: Department[];
}

export function ViewUserModal({
  isOpen,
  onClose,
  user,
  departments,
}: ViewUserModalProps) {
  const departmentName = user.department_id
    ? departments.find((d) => d.id === user.department_id)?.name
    : 'No Department';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Role */}
          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={user.role} disabled />
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label>Department</Label>
            <Input value={departmentName} disabled />
          </div>

          {/* First Name */}
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input value={user.firstName} disabled />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input value={user.lastName} disabled />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} disabled />
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label>Position</Label>
            <Input value={user.position || ''} disabled />
          </div>

          {/* Department Head */}
          <div className="space-y-2">
            <Label>Department Head</Label>
            <Input value={user.department_head ? 'Yes' : 'No'} disabled />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
} 