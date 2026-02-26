import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    label: string;
    value: string | number;
    sub?: string;
    icon: LucideIcon;
    iconClassName?: string;
    valueClassName?: string;
    className?: string;
}

export function StatCard({
    label,
    value,
    sub,
    icon: Icon,
    iconClassName = "bg-primary/10 text-primary",
    valueClassName = "text-foreground",
    className,
}: StatCardProps) {
    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 truncate">{label}</p>
                        <p className={cn("text-2xl font-bold leading-none tracking-tight", valueClassName)}>{value}</p>
                        {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
                    </div>
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", iconClassName)}>
                        <Icon size={18} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function StatCardSkeleton({ className }: { className?: string }) {
    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-7 w-20" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                </div>
            </CardContent>
        </Card>
    );
}

