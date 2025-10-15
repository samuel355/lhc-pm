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
import { Checkbox } from '@/components/ui/checkbox';
import { UserIcon, ShieldIcon, Building2Icon, CrownIcon, EditIcon } from 'lucide-react';

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
      <DialogContent className="sm:max-w-[500px] overflow-visible">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-chart-2/10">
              <EditIcon className="w-5 h-5 text-chart-2" />
            </div>
            <div>
              <DialogTitle>Edit User</DialogTitle>
              <p className="text-muted-foreground text-base leading-relaxed">
                Update user information and permissions.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 py-4">
            {/* Role */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <ShieldIcon className="w-4 h-4 text-primary" />
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={(val) =>
                  setFormData((p) => ({ ...p, role: val }))
                }
              >
                <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="glass-card z-[1000]" position="popper">
                  <SelectItem value="member" className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                    <span>Member</span>
                  </SelectItem>
                  <SelectItem value="admin" className="flex items-center gap-2">
                    <ShieldIcon className="w-4 h-4 text-chart-2" />
                    <span>Admin</span>
                  </SelectItem>
                  <SelectItem value="sysadmin" className="flex items-center gap-2">
                    <CrownIcon className="w-4 h-4 text-chart-3" />
                    <span>System Admin</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Department */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Building2Icon className="w-4 h-4 text-primary" />
                Department
              </Label>
              <Select
                value={formData.department_id}
                onValueChange={(val) =>
                  setFormData((p) => ({ ...p, department_id: val }))
                }
              >
                <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="glass-card z-[1000]" position="popper">
                  <SelectItem value="none" className="flex items-center gap-2">
                    <Building2Icon className="w-4 h-4 text-muted-foreground" />
                    <span>No Department</span>
                  </SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="flex items-center gap-2">
                      <Building2Icon className="w-4 h-4 text-chart-1" />
                      <span>{d.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* First Name */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-primary" />
                First Name
              </Label>
              <Input
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, firstName: e.target.value }))
                }
                placeholder="Enter first name"
                className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-primary" />
                Last Name
              </Label>
              <Input
                value={formData.lastName}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, lastName: e.target.value }))
                }
                placeholder="Enter last name"
                className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
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
                <UserIcon className="w-4 h-4 text-primary" />
                Position
              </Label>
              <Input
                value={formData.position}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, position: e.target.value }))
                }
                placeholder="Enter position"
                className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Department Head */}
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
              <Checkbox
                id="department_head"
                checked={formData.department_head}
                onCheckedChange={(checked: boolean) => setFormData(p => ({ ...p, department_head: checked }))}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor="department_head" className="text-sm font-semibold flex items-center gap-2">
                <CrownIcon className="w-4 h-4 text-chart-3" />
                Department Head
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              type="button"
              className="hover:bg-muted/50 transition-all duration-300"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="hover:bg-primary/90 transition-all duration-300"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
