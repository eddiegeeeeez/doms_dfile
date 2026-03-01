"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LoginPage as LoginPageComponent } from "@/components/login-page";
import { useAuth } from "@/contexts/auth-context";
import { getDashboardPath } from "@/lib/role-routing";

export default function LoginPage() {
    const { login, isLoggedIn, user, isLoading } = useAuth();
    const router = useRouter();
    // Prevent the background /api/auth/me refresh from triggering a second push.
    const hasRedirectedRef = useRef(false);

    useEffect(() => {
        if (!isLoading && isLoggedIn && user && !hasRedirectedRef.current) {
            const dest = getDashboardPath(user.role);
            // Guard: never push to /login — that would loop if role is stale.
            if (dest !== "/login") {
                hasRedirectedRef.current = true;
                router.push(dest);
            }
        }
    // user and router intentionally omitted: isLoggedIn and isLoading changing
    // is sufficient signal; re-running on user reference change (background
    // /api/auth/me refresh) would double-push and cause the refresh loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn, isLoading]);

    if (isLoading) return null;

    return <LoginPageComponent onLogin={login} />;
}
