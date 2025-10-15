"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect} from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { toast } from "sonner";
// import { RefreshCw, Loader2 } from "lucide-react";

export default function WaitForApprovalPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  //const [syncing, setSyncing] = useState(false);

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

  // const handleSync = async () => {
  //   try {
  //     setSyncing(true);
  //     const response = await fetch('/api/users/sync', {
  //       method: 'POST',
  //     });
  //     if (!response.ok) throw new Error('Failed to sync users');
  //     toast.success('Users synced successfully');
  //   } catch (error) {
  //     console.error('Error syncing users:', error);
  //     toast.error('Failed to sync users');
  //   } finally {
  //     setSyncing(false);
  //   }
  // };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-background/95 p-4">
      <div className="w-full max-w-md animate-scale-in">
        <Card className="glass-card shadow-2xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6 mx-auto">
              <div className="w-8 h-8 rounded-full bg-primary/20 animate-pulse"></div>
            </div>
            <CardTitle className="text-3xl font-bold mb-2">Pending Approval</CardTitle>
            <CardDescription className="text-base">
              Your account is awaiting approval by a system administrator
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
              <p className="text-muted-foreground leading-relaxed">
                Please wait while a system administrator adds you to a department. 
                Once you've been assigned to a department, you will gain access to the dashboard.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span>Waiting for approval...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
