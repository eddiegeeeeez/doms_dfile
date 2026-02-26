"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Optionally log to an error reporting service
    }, [error]);

    return (
        <div className="flex-1 flex items-center justify-center px-4 py-16">
            <div className="text-center max-w-md space-y-6">
                <div className="mx-auto w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-destructive" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
                    <p className="text-sm text-muted-foreground">
                        An error occurred while loading this page. Please try again.
                    </p>
                </div>
                <Button onClick={reset} variant="outline" className="gap-2">
                    <RotateCcw size={14} />
                    Try Again
                </Button>
            </div>
        </div>
    );
}
