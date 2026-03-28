import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
    showHeader?: boolean;
}

export function TableSkeleton({ rows = 5, columns = 5, showHeader = true }: TableSkeletonProps) {
    return (
        <div className="rounded-md border overflow-hidden">
            {showHeader && (
                <div className="bg-muted/50 px-4 py-3 flex items-center gap-4">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton key={`h-${i}`} className="h-4 flex-1" />
                    ))}
                </div>
            )}
            <div className="divide-y divide-border">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={`r-${i}`} className="px-4 py-3 flex items-center gap-4">
                        {Array.from({ length: columns }).map((_, j) => (
                            <Skeleton
                                key={`c-${i}-${j}`}
                                className={`h-4 ${j === 0 ? "w-32" : "flex-1"}`}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

interface StatCardSkeletonGridProps {
    count?: number;
}

export function StatCardSkeletonGrid({ count = 4 }: StatCardSkeletonGridProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-xl border p-4 space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-3 w-20" />
                </div>
            ))}
        </div>
    );
}
