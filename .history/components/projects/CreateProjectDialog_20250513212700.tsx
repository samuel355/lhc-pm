'use client';
import { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { createClient } from '@/utils/supabase/client';

type FormValues = { name: string; description: string; start_date: string; end_date: string };

export default function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const form = useForm<FormValues>({ defaultValues: { name: '', description: '', start_date: '', end_date: '' } });

  async function onSubmit(values: FormValues) {
    const supabase = createClient();
    await supabase.from('projects').insert(values);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">New Project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>Enter project details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField name="name" render={({ field }) => <Input placeholder="Name" {...field} />} />
          <FormField name="description" render={({ field }) => <Textarea placeholder="Description" {...field} />} />
          <FormField name="start_date" render={({ field }) => <Input type="date" {...field} />} />
          <FormField name="end_date" render={({ field }) => <Input type="date" {...field} />} />
          <div className="mt-4 flex justify-end">
            <Button type="submit">Create</Button>
          </div>
        </form>
        <DialogClose asChild>
          <Button variant="ghost">Cancel</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}