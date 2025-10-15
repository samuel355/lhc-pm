-- Drop existing foreign key constraints
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_created_by_fkey;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_project_id_fkey;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_department_id_fkey;

--  department_id to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS department_id uuid;
ALTER TABLE public.projects ADD CONSTRAINT projects_department_id_fkey 
    FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;

-- position column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS position text;

-- foreign key constraints with proper references
ALTER TABLE public.projects ADD CONSTRAINT projects_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.tasks ADD CONSTRAINT tasks_assigned_to_fkey 
    FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.tasks ADD CONSTRAINT tasks_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.users ADD CONSTRAINT users_department_id_fkey 
    FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;

--  indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_department_id ON public.projects(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON public.users(department_id);

-- Update existing projects to have department_id based on creator's department
UPDATE public.projects p
SET department_id = u.department_id
FROM public.users u
WHERE p.created_by = u.id
AND p.department_id IS NULL; 