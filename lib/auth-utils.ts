import { User } from '@clerk/nextjs/server';

export interface ApprovalStatus {
  isApproved: boolean;
  hasDepartmentId: boolean;
  hasRole: boolean;
  departmentId?: string | null;
  role?: string | null;
  position?: string | null;
  departmentHead?: boolean | null;
}


/**
 * Check if a user is fully approved and has access to the dashboard
 */

export function checkUserApproval(user: User | null): ApprovalStatus {
  if (!user) {
    return {
      isApproved: false,
      hasDepartmentId: false,
      hasRole: false,
    };
  }

  // Check if user has any metadata at all
  if (!user.publicMetadata || Object.keys(user.publicMetadata).length === 0) {
    return {
      isApproved: false,
      hasDepartmentId: false,
      hasRole: false,
    };
  }

  const departmentId = user.publicMetadata.department_id as string | null;
  const role = user.publicMetadata.role as string | null;
  const position = user.publicMetadata.position as string | null;
  const departmentHead = user.publicMetadata.department_head as boolean | null;

  const hasDepartmentId = departmentId && 
                         departmentId !== '' && 
                         departmentId !== null;
  
  const hasRole = role && 
                 role !== '' && 
                 role !== null;

  const isApproved = hasDepartmentId && hasRole;

  return {
    isApproved: !!isApproved,
    hasDepartmentId: !!hasDepartmentId,
    hasRole: !!hasRole,
    departmentId,
    role,
    position,
    departmentHead,
  };
}

/**
 * Get user's department and role information for display
 */
export function getUserDisplayInfo(user: User | null) {
  const approvalStatus = checkUserApproval(user);
  
  return {
    departmentId: approvalStatus.departmentId,
    role: approvalStatus.role,
    position: approvalStatus.position,
    departmentHead: approvalStatus.departmentHead,
    isSysAdmin: approvalStatus.role === 'sysadmin',
    isDepartmentHead: approvalStatus.departmentHead === true,
  };
}

/**
 * Check if user has permission to access a specific department
 */
export function canAccessDepartment(user: User | null, targetDepartmentId: string): boolean {
  const approvalStatus = checkUserApproval(user);
  
  // Sys admins can access all departments
  if (approvalStatus.role === 'sysadmin') {
    return true;
  }
  
  // Users can only access their own department
  return approvalStatus.departmentId === targetDepartmentId;
}

/**
 * Check if user can create projects in a department
 */
export function canCreateProjects(user: User | null, departmentId: string): boolean {
  const approvalStatus = checkUserApproval(user);
  
  // Sys admins can create projects anywhere
  if (approvalStatus.role === 'sysadmin') {
    return true;
  }
  
  // Department heads can create projects in their department
  if (approvalStatus.departmentHead && approvalStatus.departmentId === departmentId) {
    return true;
  }
  
  return false;
}

/**
 * Check if user can manage users
 */
export function canManageUsers(user: User | null): boolean {
  const approvalStatus = checkUserApproval(user);
  return approvalStatus.role === 'sysadmin';
}

/**
 * Check if user can manage departments
 */
export function canManageDepartments(user: User | null): boolean {
  const approvalStatus = checkUserApproval(user);
  return approvalStatus.role === 'sysadmin';
}
