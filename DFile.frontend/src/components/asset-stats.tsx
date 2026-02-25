"use client";

import { Package, BarChart3, AlertTriangle, PhilippinePeso } from "lucide-react";
import { useAssets } from "@/hooks/use-assets";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function AssetStats() {
    const { data: assets = [], isLoading } = useAssets();
    const activeAssets = assets.filter(a => a.status !== 'Archived');

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="p-5">
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-8 w-20" />
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    const totalAssets = activeAssets.length;

    // "Pending Review" proxy
    const pendingReviewCount = activeAssets.filter(a => a.status === "Available" && (a.room === "—" || !a.room)).length;

    // Calculate Values
    const originalValue = assets.reduce((sum, a) => sum + (a.purchasePrice || a.value || 0), 0);
    const bookValue = assets.reduce((sum, a) => sum + (a.currentBookValue || a.value || 0), 0);

    const formatCurrency = (val: number) => {
        if (val >= 1000000) return `₱${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `₱${(val / 1000).toFixed(1)}K`;
        return `₱${val.toLocaleString()}`;
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Assets</p>
                <div className="flex items-center justify-between mt-3">
                    <h3 className="text-3xl font-bold text-primary">{totalAssets.toLocaleString()}</h3>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <Package size={24} />
                    </div>
                </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unallocated / Pending</p>
                <div className="flex items-center justify-between mt-3">
                    <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-400">{pendingReviewCount}</h3>
                    <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <AlertTriangle size={24} />
                    </div>
                </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Original Portfolio Value</p>
                <div className="flex items-center justify-between mt-3">
                    <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(originalValue)}</h3>
                    <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <PhilippinePeso size={24} />
                    </div>
                </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Book Value</p>
                <div className="flex items-center justify-between mt-3">
                    <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(bookValue)}</h3>
                    <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <BarChart3 size={24} />
                    </div>
                </div>
            </Card>
        </div>
    );
}
