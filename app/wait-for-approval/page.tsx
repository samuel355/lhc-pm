"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, Loader2 } from "lucide-react";

export default function WaitForApprovalPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }

    if (isLoaded && user) {
      if (user.publicMetadata && user.publicMetadata.department_id) {
        router.push("/dashboard");
      }
    }
  }, [user, isLoaded, router]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/users/sync', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to sync users');
      toast.success('Users synced successfully');
    } catch (error) {
      console.error('Error syncing users:', error);
      toast.error('Failed to sync users');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Pending Approval</CardTitle>
          <CardDescription>
            Your account is awaiting approval by a sysadmin.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            Please wait while a sysadmin adds you to a department. Once
            you&apos;ve been added, you will gain access to the dashboard.
          </p>
          {user?.emailAddresses?.[0]?.emailAddress === 'samueloseiboatenglistowell57@gmail.com' && (
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 mt-4"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {syncing ? 'Syncing...' : 'Sync Clerk with Supabase'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
