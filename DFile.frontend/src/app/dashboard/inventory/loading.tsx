import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function InventoryLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-44" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-36" />
                    <Skeleton className="h-9 w-40" />
                </div>
            </div>
            <Card className="overflow-hidden">
                <div className="p-4 border-b border-border flex gap-3">
                    <Skeleton className="h-9 flex-1 max-w-sm" />
                    <Skeleton className="h-9 w-36" />
                    <Skeleton className="h-9 w-36" />
                </div>
                <div className="divide-y divide-border">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="px-5 py-3.5 flex gap-4 items-center">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 flex-1" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
