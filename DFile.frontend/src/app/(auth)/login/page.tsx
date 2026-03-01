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
        if (isLoading || hasRedirectedRef.current) return;
        if (isLoggedIn && user) {
            const dest = getDashboardPath(user.role);
            if (dest && dest !== "/login") {
                hasRedirectedRef.current = true;
                router.push(dest);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn, isLoading]);

    if (isLoading) return null;

    return <LoginPageComponent onLogin={login} />;
}
