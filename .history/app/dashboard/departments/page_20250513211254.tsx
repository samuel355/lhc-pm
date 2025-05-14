// app/dashboard/departments/page.tsx
import { createClient } from '@/utils/supabase/server';
import { DBDepartment } from '@/lib/types/db';

export default async function DepartmentsPage() {
  const supabase = await createClient();
  const { data: departments, error } = await supabase
    .from('departments')
    .select('*')
    .order('name');

  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Departments</h2>
      <ul className="space-y-2">
        {departments?.map((dept: DBDepartment) => (
          <li key={dept.id} className="p-4 border rounded-md bg-card text-card-foreground">
            {dept.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
