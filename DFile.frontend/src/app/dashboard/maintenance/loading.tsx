import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function MaintenanceLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-52" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-9 w-40" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="p-5">
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-8 w-12" />
                        </div>
                    </Card>
                ))}
            </div>
            <Card className="overflow-hidden">
                <div className="p-4 border-b border-border flex gap-3">
                    <Skeleton className="h-9 flex-1 max-w-sm" />
                    <Skeleton className="h-9 w-36" />
                </div>
                <div className="divide-y divide-border">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="px-5 py-3.5 flex gap-4 items-center">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 flex-1" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
