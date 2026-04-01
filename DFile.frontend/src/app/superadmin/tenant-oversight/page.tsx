"use client";

import dynamic from "next/dynamic";
import { Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const TenantList = dynamic(() => import("@/components/tenant-list").then(m => ({ default: m.TenantList })), {
    loading: () => (
        <Card className="p-6">
            <Skeleton className="h-72 w-full" />
        </Card>
    ),
});

export default function TenantOversightPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Tenant Oversight</h1>
                    <p className="text-sm text-muted-foreground">
                        Monitor and manage platform tenants. New organizations are created through self-service
                        registration (sign-up), not from this screen.
                    </p>
                </div>
            </div>

            <TenantList />
        </div>
    );
}
