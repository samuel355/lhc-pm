import { createClient } from '@/utils/supabase/server';
import { DBDepartment } from '@/lib/types/db';
import { Card, CardContent } from '@/components/ui/card';
import { cookies } from 'next/headers';

export default async function DepartmentsPage() {
  const supabase = await createClient(cookies());
  const { data: departments, error } = await supabase
    .from('departments')
    .select('*')
    .order('name');

  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Departments</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments?.map((dept: DBDepartment) => (
          <Card key={dept.id} className="border-muted-foreground/20 hover:shadow-md transition">
            <CardContent className="p-4">
              <div className="text-lg font-medium">{dept.name}</div>
              <div className="text-muted-foreground text-sm mt-1">
                Created at: {new Date(dept.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
