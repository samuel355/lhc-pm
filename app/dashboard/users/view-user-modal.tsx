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
import { UserIcon, ShieldIcon, Building2Icon, CrownIcon, MailIcon, BriefcaseIcon, EyeIcon } from 'lucide-react';

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
    position?: string | null;
    department?: string | null;
    department_id?: string | null;
    department_head?: boolean | null;
  };
  departments: Department[];
}

export function ViewUserModal({
  isOpen,
  onClose,
  user,
}: ViewUserModalProps) {
  const departmentName = user.department || 'No Department';
  
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'sysadmin':
        return <CrownIcon className="w-4 h-4 text-chart-3" />;
      case 'admin':
        return <ShieldIcon className="w-4 h-4 text-chart-2" />;
      default:
        return <UserIcon className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'sysadmin':
        return 'text-chart-3';
      case 'admin':
        return 'text-chart-2';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-chart-1/10">
              <EyeIcon className="w-5 h-5 text-chart-1" />
            </div>
            <div>
              <DialogTitle>User Details</DialogTitle>
              <p className="text-muted-foreground text-base leading-relaxed">
                View user information and permissions.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-6 py-4">
            {/* Role */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <ShieldIcon className="w-4 h-4 text-primary" />
                Role
              </Label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                {getRoleIcon(user.role)}
                <span className={`font-medium capitalize ${getRoleColor(user.role)}`}>
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Department */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Building2Icon className="w-4 h-4 text-primary" />
                Department
              </Label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                <Building2Icon className="w-4 h-4 text-chart-1" />
                <span className="font-medium">{departmentName}</span>
              </div>
            </div>

            {/* First Name */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-primary" />
                First Name
              </Label>
              <Input 
                value={user.firstName} 
                disabled 
                className="bg-muted/50 text-muted-foreground"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-primary" />
                Last Name
              </Label>
              <Input 
                value={user.lastName} 
                disabled 
                className="bg-muted/50 text-muted-foreground"
              />
            </div>

            {/* Email */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <MailIcon className="w-4 h-4 text-primary" />
                Email
              </Label>
              <Input 
                value={user.email} 
                disabled 
                className="bg-muted/50 text-muted-foreground"
              />
            </div>

            {/* Position */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <BriefcaseIcon className="w-4 h-4 text-primary" />
                Position
              </Label>
              <Input 
                value={user.position || 'Not specified'} 
                disabled 
                className="bg-muted/50 text-muted-foreground"
              />
            </div>

            {/* Department Head */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <CrownIcon className="w-4 h-4 text-primary" />
                Department Head
              </Label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                <CrownIcon className={`w-4 h-4 ${user.department_head ? 'text-chart-3' : 'text-muted-foreground'}`} />
                <span className={`font-medium ${user.department_head ? 'text-chart-3' : 'text-muted-foreground'}`}>
                  {user.department_head ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="hover:bg-muted/50 transition-all duration-300"
            >
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
} 