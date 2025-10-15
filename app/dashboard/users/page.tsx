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
    <div className="container mx-auto py-8 space-y-8 animate-slide-up">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          User Management
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage users, roles, and department assignments
        </p>
      </div>

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
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-semibold">Users</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
              </p>
            </div>
            {isSysAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition-colors duration-300"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Users'}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto hover:bg-accent/50 transition-colors duration-300">
                    Role <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card">
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
                  <Button variant="outline" className="hover:bg-accent/50 transition-colors duration-300">
                    Department <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card">
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
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mb-4">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-semibold">First Name</TableHead>
                      <TableHead className="font-semibold">Last Name</TableHead>
                      <TableHead className="font-semibold">Username</TableHead>
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Role</TableHead>
                      <TableHead className="font-semibold">Position</TableHead>
                      <TableHead className="font-semibold">Department</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      return (
                        <TableRow key={user.id} className="hover:bg-muted/20 transition-colors duration-200">
                          <TableCell className="font-medium">{user.firstName}</TableCell>
                          <TableCell className="font-medium">{user.lastName}</TableCell>
                          <TableCell className="text-muted-foreground">{user.username}</TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'sysadmin' ? 'bg-primary/10 text-primary' :
                              user.role === 'admin' ? 'bg-chart-2/10 text-chart-2' :
                              user.role === 'department_head' ? 'bg-chart-3/10 text-chart-3' :
                              'bg-muted/10 text-muted-foreground'
                            }`}>
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.position || '-'}</TableCell>
                          <TableCell className="text-muted-foreground">{returnDepName(user.department_id || '')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleView(user)}
                                className='cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors duration-300'
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {isSysAdmin && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(user)}
                                    className='cursor-pointer hover:bg-chart-2/10 hover:text-chart-2 transition-colors duration-300'
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(user.id)}
                                    className='cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors duration-300'
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