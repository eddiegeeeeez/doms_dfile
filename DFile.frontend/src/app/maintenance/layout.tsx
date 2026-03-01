"use client";

import { AppShell, NavSection } from "@/components/app-shell";
import { LayoutDashboard, Wrench, CalendarClock, HeartPulse } from "lucide-react";
import { UserRole } from "@/types/asset";

const REQUIRED_ROLES: UserRole[] = ["Maintenance"];

const navSections: NavSection[] = [
    {
        label: "Maintenance",
        items: [
            { href: "/maintenance/dashboard",       label: "Dashboard",        icon: LayoutDashboard },
            { href: "/maintenance/work-orders",     label: "Work Orders",      icon: Wrench },
            { href: "/maintenance/schedules",       label: "Schedules",        icon: CalendarClock },
            { href: "/maintenance/asset-condition",  label: "Asset Condition",  icon: HeartPulse },
        ],
    },
];

export default function MaintenanceLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppShell
            navSections={navSections}
            requiredRoles={REQUIRED_ROLES}
            homePath="/maintenance/dashboard"
        >
            {children}
        </AppShell>
    );
}
