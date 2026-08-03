'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTrigger,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  UserIcon,
  ShieldIcon,
  Building2Icon,
  CrownIcon,
  PlusIcon,
  MailIcon,
  KeyIcon,
  DicesIcon,
  EyeIcon,
  EyeOffIcon,
  CopyIcon,
  CheckIcon,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Department {
  id: string;
  name: string;
}

interface CreateUserModalProps {
  departments: Department[];
  onUserCreated: () => void;
}

function generatePassword() {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const array = new Uint32Array(14);
  crypto.getRandomValues(array);
  return Array.from(array, (n) => chars[n % chars.length]).join('');
}

const initialFormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'member',
  position: '',
  department_id: 'none',
  department_head: false,
};

export function CreateUserModal({ departments, onUserCreated }: CreateUserModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

  const resetAndClose = () => {
    setOpen(false);
    setFormData(initialFormData);
    setError(null);
    setCreatedCredentials(null);
    setShowPassword(false);
    setCopied(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          position: formData.position,
          department_id: formData.department_id === 'none' ? null : formData.department_id,
          department_head: formData.department_head,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      toast.success('User created successfully');
      setCreatedCredentials({ email: formData.email, password: formData.password });
      onUserCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!createdCredentials) return;
    await navigator.clipboard.writeText(
      `Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`
    );
    setCopied(true);
    toast.success('Credentials copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : resetAndClose())}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 hover:bg-primary/90 transition-all duration-300">
          <PlusIcon className="h-4 w-4" />
          New User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] overflow-visible">
        {createdCredentials ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-chart-3/10">
                  <CheckIcon className="w-5 h-5 text-chart-3" />
                </div>
                <div>
                  <DialogTitle>User Created</DialogTitle>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Share these credentials with the new user - the password won&apos;t be shown again.
                  </p>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium">{createdCredentials.email}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Password</span>
                  <span className="text-sm font-mono font-medium">{createdCredentials.password}</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyCredentials}
                className="w-full flex items-center gap-2"
              >
                {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy Credentials'}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={resetAndClose}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <PlusIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle>Create New User</DialogTitle>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Set up an account directly - no invitation email is sent.
                  </p>
                </div>
              </div>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-primary" />
                      First Name
                    </Label>
                    <Input
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-primary" />
                      Last Name
                    </Label>
                    <Input
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <MailIcon className="w-4 h-4 text-primary" />
                    Email
                  </Label>
                  <Input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    placeholder="user@example.com"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <KeyIcon className="w-4 h-4 text-primary" />
                    Password
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        required
                        minLength={8}
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                        placeholder="At least 8 characters"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setFormData((p) => ({ ...p, password: generatePassword() }));
                        setShowPassword(true);
                      }}
                      className="shrink-0"
                      title="Generate a secure password"
                    >
                      <DicesIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <ShieldIcon className="w-4 h-4 text-primary" />
                    Role
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(val) => setFormData((p) => ({ ...p, role: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="glass-card z-[1000]" position="popper">
                      <SelectItem value="member">
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                        <span>Member</span>
                      </SelectItem>
                      <SelectItem value="admin">
                        <ShieldIcon className="w-4 h-4 text-chart-2" />
                        <span>Admin</span>
                      </SelectItem>
                      <SelectItem value="sysadmin">
                        <CrownIcon className="w-4 h-4 text-chart-3" />
                        <span>System Admin</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Building2Icon className="w-4 h-4 text-primary" />
                    Department
                  </Label>
                  <Select
                    value={formData.department_id}
                    onValueChange={(val) => setFormData((p) => ({ ...p, department_id: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="glass-card z-[1000]" position="popper">
                      <SelectItem value="none">
                        <Building2Icon className="w-4 h-4 text-muted-foreground" />
                        <span>No Department</span>
                      </SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          <Building2Icon className="w-4 h-4 text-chart-1" />
                          <span>{d.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-primary" />
                    Position
                  </Label>
                  <Input
                    value={formData.position}
                    onChange={(e) => setFormData((p) => ({ ...p, position: e.target.value }))}
                    placeholder="Enter position (optional)"
                  />
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
                  <Checkbox
                    id="create_department_head"
                    checked={formData.department_head}
                    onCheckedChange={(checked: boolean) => setFormData((p) => ({ ...p, department_head: checked }))}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label htmlFor="create_department_head" className="text-sm font-semibold flex items-center gap-2">
                    <CrownIcon className="w-4 h-4 text-chart-3" />
                    Department Head
                  </Label>
                </div>
              </div>

              <DialogFooter className="gap-3">
                <Button type="button" variant="outline" onClick={resetAndClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </div>
                  ) : (
                    'Create User'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
