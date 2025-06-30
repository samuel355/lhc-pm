"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function WaitForApprovalPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

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
          {/* <p className="text-center my-3 font-bold text-primary">Or</p>
          <Link className="w-full" href={'/sign-in'}>Sign in</Link> */}
        </CardContent>
      </Card>
    </div>
  );
}
