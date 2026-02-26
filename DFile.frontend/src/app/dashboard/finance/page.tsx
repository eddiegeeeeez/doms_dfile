"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, TrendingDown, FileBadge } from "lucide-react";

const FinanceDashboard = dynamic(() => import("@/components/finance-dashboard").then(m => ({ default: m.FinanceDashboard })), {
    loading: () => <Card className="p-5"><Skeleton className="h-64 w-full" /></Card>,
});
const DepreciationView = dynamic(() => import("@/components/depreciation-view").then(m => ({ default: m.DepreciationView })), {
    loading: () => <Card className="p-5"><Skeleton className="h-64 w-full" /></Card>,
});

export default function FinanceDashboardPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Finance & Assets</h2>
            </div>
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <PieChart className="h-4 w-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="depreciation" className="flex items-center gap-2">
                         <TrendingDown className="h-4 w-4" />
                         Depreciation Schedule
                    </TabsTrigger>
                    <TabsTrigger value="reports" disabled className="flex items-center gap-2 text-muted-foreground opacity-50 cursor-not-allowed">
                        <FileBadge className="h-4 w-4" />
                        Reports (Coming Soon)
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                    <FinanceDashboard />
                </TabsContent>
                <TabsContent value="depreciation" className="space-y-4">
                    <DepreciationView />
                </TabsContent>
            </Tabs>
        </div>
    );
}
