'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Eye, Pencil, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { createClient } from '@/utils/supabase/client';
import { EditUserModal } from './edit-user-modal';
import { ViewUserModal } from './view-user-modal';
import { toast } from "sonner";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  position?: string;
  department: string;
  department_id?: string | null;
  department_head?: boolean | null;
}

interface Department {
  id: string;
  name: string;
}

export default function UsersPage() {
  const { user: currentUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const isSysAdmin = currentUser?.publicMetadata?.role === 'sysadmin';
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersResponse = await fetch('/api/users');
        if (!usersResponse.ok) throw new Error('Failed to fetch users');
        const usersData = await usersResponse.json();
        setUsers(usersData.map((user: User) => ({
          ...user,
          department: user.department || '-',
        })));

        // Fetch departments
        const { data: departmentsData, error } = await supabase
          .from('departments')
          .select('id, name');

        if (error) throw error;
        setDepartments(departmentsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;

    return matchesSearch && matchesRole && matchesDepartment;
  });

  const uniqueRoles = Array.from(new Set(users.map(user => user.role)));
  const uniqueDepartments = Array.from(new Set(users.map(user => user.department).filter(Boolean)));

  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleEdit = (user: User) => {
    if (!isSysAdmin) return;
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (!isSysAdmin) return;

    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete user');

        toast.success('User deleted successfully');
        handleUserUpdated();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  const handleUserUpdated = async () => {
    // Refresh users data
    const response = await fetch('/api/users');
    if (response.ok) {
      const data = await response.json();
      setUsers(data.map((user: User) => ({
        ...user,
        department: user.department || '-',
      })));
    }
  };

  // Sync users from Clerk to Supabase
  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/users/sync', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to sync users');
      
      toast.success('Users synced successfully');
      handleUserUpdated(); // Refresh the user list
    } catch (error) {
      console.error('Error syncing users:', error);
      toast.error('Failed to sync users');
    } finally {
      setSyncing(false);
    }
  };

  const returnDepName = (id: string) => {
    const department = departments.find(dept => dept.id === id);
    return department ? department.name : '-';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-muted-foreground animate-pulse">Loading users...</div>
          <div className="space-y-4 w-full max-w-md mt-4">
            <Skeleton className="h-8 w-full animate-pulse" />
            <Skeleton className="h-8 w-full animate-pulse" />
            <Skeleton className="h-8 w-full animate-pulse" />
            <Skeleton className="h-8 w-full animate-pulse" />
            <Skeleton className="h-8 w-full animate-pulse" />
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Users</CardTitle>
            {isSysAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Users'}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    Role <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem
                    checked={roleFilter === 'all'}
                    onCheckedChange={() => setRoleFilter('all')}
                  >
                    All Roles
                  </DropdownMenuCheckboxItem>
                  {uniqueRoles.map((role) => (
                    <DropdownMenuCheckboxItem
                      key={role}
                      checked={roleFilter === role}
                      onCheckedChange={() => setRoleFilter(role)}
                    >
                      {role}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Department <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem
                    checked={departmentFilter === 'all'}
                    onCheckedChange={() => setDepartmentFilter('all')}
                  >
                    All Departments
                  </DropdownMenuCheckboxItem>
                  {uniqueDepartments.map((dept) => (
                    <DropdownMenuCheckboxItem
                      key={dept}
                      checked={departmentFilter === dept}
                      onCheckedChange={() => setDepartmentFilter(dept || '')}
                    >
                      {dept}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>First Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      return (
                        <TableRow key={user.id}>
                          <TableCell>{user.firstName}</TableCell>
                          <TableCell>{user.lastName}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell>{user.position || '-'}</TableCell>
                          <TableCell>{returnDepName(user.department_id || '')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleView(user)}
                                className='cursor-pointer'
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {isSysAdmin && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(user)}
                                    className='cursor-pointer'
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(user.id)}
                                    className='cursor-pointer'
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedUser && (
        <>
          <EditUserModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedUser(null);
            }}
            user={selectedUser as User}
            departments={departments}
            onUserUpdated={handleUserUpdated}
          />
          <ViewUserModal
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedUser(null);
            }}
            user={selectedUser as User}
            departments={departments}
          />
        </>
      )}
    </div>
  );
} 