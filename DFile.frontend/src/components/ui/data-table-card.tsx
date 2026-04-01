import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DataTableCardProps {
    className?: string;
    /** Toolbar inside the card (filters, actions). Renders above the scroll region. */
    toolbar?: ReactNode;
    /** Table (or fragment with Table). Scrolls vertically/horizontally when needed. */
    children: ReactNode;
    /** Pagination / footer — fixed below the scroll region. */
    footer: ReactNode;
}

/**
 * Column flex layout: toolbar shrink-0, scrollable table flex-1 min-h-0, footer shrink-0.
 * Max height is viewport-relative so inner scroll works without fixed min-h-[520px].
 */
export function DataTableCard({ className, toolbar, children, footer }: DataTableCardProps) {
    return (
        <div
            className={cn(
                "rounded-md border overflow-hidden flex flex-col min-h-0",
                "max-h-[min(70vh,calc(100dvh-10rem))]",
                className
            )}
        >
            {toolbar != null && (
                <div className="shrink-0 border-b border-border/40 bg-background">{toolbar}</div>
            )}
            <div className="flex-1 min-h-0 overflow-auto">{children}</div>
            <div className="shrink-0 bg-background">{footer}</div>
        </div>
    );
}
