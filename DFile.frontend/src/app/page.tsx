"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getDashboardPath } from "@/lib/role-routing";

export default function Home() {
  const router = useRouter();
  const { isLoggedIn, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isLoggedIn && user) {
        router.push(getDashboardPath(user.role));
      } else {
        router.push("/login");
      }
    }
  // user is intentionally omitted: when isLoggedIn flips true, user is already
  // set in the same React batch. Re-running on user reference changes (background
  // /api/auth/me refresh) would double-push and cause the refresh loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-muted"></div>
          <div className="h-4 w-32 rounded bg-muted"></div>
        </div>
      </div>
    );
  }

  return null;
}
