"use client";

import { AppShell, NavSection } from "@/components/app-shell";
import { LayoutDashboard, Users, ShieldCheck, Building2, MapPin, Tag } from "lucide-react";
import { UserRole } from "@/types/asset";

const REQUIRED_ROLES: UserRole[] = ["Admin"];

const navSections: NavSection[] = [
    {
        label: "Organization",
        items: [
            { href: "/tenant/dashboard",         label: "Dashboard",         icon: LayoutDashboard },
            { href: "/tenant/users",             label: "Users",             icon: Users },
            { href: "/tenant/roles",             label: "Roles",             icon: ShieldCheck },
            { href: "/tenant/departments",       label: "Departments",       icon: Building2 },
        ],
    },
    {
        label: "Configuration",
        items: [
            { href: "/tenant/locations",         label: "Locations",         icon: MapPin },
            { href: "/tenant/asset-categories",  label: "Asset Categories",  icon: Tag },
        ],
    },
];

export default function TenantLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppShell
            navSections={navSections}
            requiredRoles={REQUIRED_ROLES}
            homePath="/tenant/dashboard"
        >
            {children}
        </AppShell>
    );
}
