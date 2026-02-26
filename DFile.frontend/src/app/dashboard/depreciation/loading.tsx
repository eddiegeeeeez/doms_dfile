import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function DepreciationLoading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-7 w-52" />
                <Skeleton className="h-4 w-72" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="p-5">
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-8 w-24" />
                        </div>
                    </Card>
                ))}
            </div>
            <Card className="overflow-hidden">
                <div className="p-4 border-b border-border">
                    <Skeleton className="h-9 w-64" />
                </div>
                <div className="divide-y divide-border">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="px-5 py-3.5 flex gap-4 items-center">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 flex-1" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-2 flex-1 max-w-32" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
