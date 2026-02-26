"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard, ShoppingCart, QrCode, UserCheck, Wrench,
    TrendingDown, LogOut, LayoutGrid,
    DoorOpen, Building2, Menu, Bell, User, ChevronRight,
    ChevronsLeft, ChevronsRight, Settings
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/types/asset";

interface NavItem {
    href: string;
    label: string;
    icon: React.ElementType;
    allowedRoles?: UserRole[];
}

const mainNavItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/procurement", label: "Asset Acquisition", icon: ShoppingCart, allowedRoles: ['Admin', 'Procurement', 'Super Admin'] },
    { href: "/dashboard/inventory", label: "Asset Registration", icon: QrCode, allowedRoles: ['Admin', 'Procurement', 'Super Admin'] },
    { href: "/dashboard/allocation", label: "Asset Allocation", icon: UserCheck, allowedRoles: ['Admin', 'Super Admin'] },
    { href: "/dashboard/depreciation", label: "Asset Depreciation", icon: TrendingDown, allowedRoles: ['Admin', 'Finance', 'Super Admin'] },
    { href: "/dashboard/maintenance", label: "Maintenance & Repair", icon: Wrench, allowedRoles: ['Admin', 'Maintenance', 'Super Admin'] },
    { href: "/dashboard/tasks", label: "Task Management", icon: LayoutGrid, allowedRoles: ['Admin', 'Maintenance', 'Super Admin'] },
];

const adminNavItems: NavItem[] = [
    { href: "/dashboard/rooms", label: "Room Units", icon: DoorOpen, allowedRoles: ['Admin', 'Super Admin'] },
    { href: "/dashboard/organization", label: "Organization", icon: Building2, allowedRoles: ['Admin', 'Super Admin'] },
];

const superAdminNavItems: NavItem[] = [
    { href: "/dashboard/super-admin/dashboard", label: "Super Admin Control", icon: UserCheck, allowedRoles: ['Super Admin'] },
    { href: "/dashboard/super-admin/create-tenant", label: "Create Tenant", icon: Building2, allowedRoles: ['Super Admin'] },
];

const allNavItems = [...mainNavItems, ...adminNavItems, ...superAdminNavItems];

// ─── Sidebar NavItem ──────────────────────────────────────────────
function NavItemButton({
    item,
    isCollapsed,
    pathname,
    onNavigate,
}: {
    item: NavItem;
    isCollapsed: boolean;
    pathname: string;
    onNavigate?: () => void;
}) {
    const normalized = pathname?.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
    const isActive = item.href === "/dashboard"
        ? normalized === "/dashboard"
        : normalized.startsWith(item.href);

    const button = (
        <Link
            href={item.href}
            onClick={onNavigate}
            className={`group relative flex items-center gap-3 w-full rounded-lg transition-all duration-150
                ${isCollapsed ? "h-10 w-10 justify-center p-0 mx-auto" : "h-9 px-3"}
                ${isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
        >
            <item.icon
                size={16}
                className={`shrink-0 transition-colors
                    ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
            />
            {!isCollapsed && (
                <span className="text-sm font-medium leading-none truncate">{item.label}</span>
            )}
            {isActive && isCollapsed && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[var(--amber)] rounded-r-full -ml-px" />
            )}
        </Link>
    );

    if (isCollapsed) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">{item.label}</TooltipContent>
            </Tooltip>
        );
    }

    return button;
}

// ─── Nav Section ──────────────────────────────────────────────────
function NavSection({
    label,
    items,
    role,
    isCollapsed,
    pathname,
    onNavigate,
}: {
    label: string;
    items: NavItem[];
    role: UserRole;
    isCollapsed: boolean;
    pathname: string;
    onNavigate?: () => void;
}) {
    const visible = items.filter(i => !i.allowedRoles || i.allowedRoles.includes(role));
    if (!visible.length) return null;

    return (
        <div className="space-y-1">
            {!isCollapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 select-none">
                    {label}
                </p>
            )}
            {isCollapsed && (
                <div className="w-6 h-px bg-border/60 mx-auto mb-1" />
            )}
            {visible.map(item => (
                <NavItemButton
                    key={item.href}
                    item={item}
                    isCollapsed={isCollapsed}
                    pathname={pathname}
                    onNavigate={onNavigate}
                />
            ))}
        </div>
    );
}

// ─── Breadcrumb ───────────────────────────────────────────────────
function Breadcrumb({ pathname }: { pathname: string }) {
    const normalized = pathname?.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
    const sorted = [...allNavItems].sort((a, b) => b.href.length - a.href.length);
    const current = sorted.find(i => normalized.startsWith(i.href));
    const label = current?.label ?? "Dashboard";

    const segments = normalized.split('/').filter(Boolean).slice(1); // remove "dashboard" prefix
    const crumbs = [{ label: "Dashboard", href: "/dashboard" }];

    if (segments.length > 0 && normalized !== "/dashboard") {
        const parent = allNavItems.find(i => i.href === "/dashboard/" + segments[0]);
        if (parent) crumbs.push({ label: parent.label, href: parent.href });
        if (segments.length > 1) {
            const sub = allNavItems.find(i => i.href === "/dashboard/" + segments.slice(0, 2).join('/'));
            if (sub && sub.href !== parent?.href) crumbs.push({ label: sub.label, href: sub.href });
        }
    }

    if (crumbs.length === 1) return (
        <h1 className="text-sm font-semibold text-foreground">{label}</h1>
    );

    return (
        <nav className="flex items-center gap-1.5 text-sm">
            {crumbs.map((c, i) => (
                <span key={c.href} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight size={13} className="text-muted-foreground/50" />}
                    {i === crumbs.length - 1 ? (
                        <span className="font-semibold text-foreground">{c.label}</span>
                    ) : (
                        <Link href={c.href} className="text-muted-foreground hover:text-foreground transition-colors">
                            {c.label}
                        </Link>
                    )}
                </span>
            ))}
        </nav>
    );
}

// ─── Sidebar Content (shared between desktop + mobile) ────────────
function SidebarContent({
    user,
    onLogoutRequest,
    isCollapsed,
    pathname,
    onNavigate,
    onToggleCollapse,
    showCollapseButton = true,
}: {
    user: { name: string; role: UserRole; roleLabel: string };
    onLogoutRequest: () => void;
    isCollapsed: boolean;
    pathname: string;
    onNavigate?: () => void;
    onToggleCollapse?: () => void;
    showCollapseButton?: boolean;
}) {
    return (
        <div className="flex flex-col h-full">
            {/* Logo + Collapse Toggle */}
            <div className={`flex items-center shrink-0 border-b border-border/60 ${isCollapsed ? "h-[57px] justify-center" : "h-[57px] px-4 justify-between"}`}>
                {!isCollapsed && (
                    <Link href="/dashboard" className="flex items-center">
                        <Image src="/d_file.svg" alt="DFile" width={120} height={40} className="h-9 w-auto object-contain" priority />
                    </Link>
                )}
                {showCollapseButton && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onToggleCollapse}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                            >
                                {isCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">{isCollapsed ? "Expand sidebar" : "Collapse sidebar"}</TooltipContent>
                    </Tooltip>
                )}
            </div>

            {/* Nav */}
            <nav className={`flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-5 ${isCollapsed ? "px-2" : "px-3"}`}>
                <NavSection
                    label="Asset Management"
                    items={mainNavItems}
                    role={user.role}
                    isCollapsed={isCollapsed}
                    pathname={pathname}
                    onNavigate={onNavigate}
                />
                <NavSection
                    label="Administrator"
                    items={adminNavItems}
                    role={user.role}
                    isCollapsed={isCollapsed}
                    pathname={pathname}
                    onNavigate={onNavigate}
                />
                <NavSection
                    label="Super Admin"
                    items={superAdminNavItems}
                    role={user.role}
                    isCollapsed={isCollapsed}
                    pathname={pathname}
                    onNavigate={onNavigate}
                />
            </nav>

            {/* Profile Footer */}
            <div className={`shrink-0 border-t border-border/60 ${isCollapsed ? "p-2" : "p-3"}`}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className={`flex items-center gap-2.5 w-full rounded-lg p-2 hover:bg-muted transition-colors group
                                ${isCollapsed ? "justify-center" : ""}`}
                        >
                            <Avatar className="h-7 w-7 shrink-0 ring-2 ring-primary/20 ring-offset-1 ring-offset-background">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                    {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                </AvatarFallback>
                            </Avatar>
                            {!isCollapsed && (
                                <div className="flex-1 text-left min-w-0">
                                    <p className="text-xs font-semibold text-foreground truncate leading-tight">{user.name}</p>
                                    <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">{user.roleLabel}</p>
                                </div>
                            )}
                            {!isCollapsed && (
                                <Settings size={13} className="text-muted-foreground/60 group-hover:text-muted-foreground shrink-0" />
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align={isCollapsed ? "center" : "start"} className="w-52 mb-1">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col gap-0.5">
                                <p className="text-sm font-semibold text-foreground">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.roleLabel}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={onLogoutRequest}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                        >
                            <LogOut size={14} className="mr-2" />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

// ─── Layout ───────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, isLoggedIn, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);

    useEffect(() => {
        if (isLoading) return;
        if (!isLoggedIn) { router.push("/login"); return; }
        if (pathname === "/dashboard") return;
        const currentItem = allNavItems.find(item => item.href === pathname);
        if (currentItem?.allowedRoles && user && !currentItem.allowedRoles.includes(user.role)) {
            router.push("/dashboard");
        }
    }, [isLoading, isLoggedIn, router, pathname, user]);

    if (isLoading || !user) return null;

    // Page title suppression (maintenance & finance have their own headings)
    const hideBreadcrumb = (
        (pathname === "/dashboard" && user.role === 'Finance') ||
        pathname.startsWith("/dashboard/maintenance")
    );

    return (
        <TooltipProvider delayDuration={200}>
            <div className="min-h-screen bg-background flex">

                {/* ── Desktop Sidebar ── */}
                <aside className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-card border-r border-border/60
                    shadow-[1px_0_20px_-10px_rgba(0,0,0,0.12)] transition-[width] duration-200 ease-in-out
                    ${isCollapsed ? "w-[60px]" : "w-64"}`}
                >
                    <SidebarContent
                        user={user}
                        onLogoutRequest={() => setIsLogoutOpen(true)}
                        isCollapsed={isCollapsed}
                        pathname={pathname}
                        onToggleCollapse={() => setIsCollapsed(v => !v)}
                    />
                </aside>

                {/* ── Mobile Sidebar ── */}
                <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
                    <SheetContent side="left" className="w-64 p-0 bg-card" showCloseButton={false}>
                        <SheetTitle className="sr-only">Navigation</SheetTitle>
                        <SidebarContent
                            user={user}
                            onLogoutRequest={() => setIsLogoutOpen(true)}
                            isCollapsed={false}
                            pathname={pathname}
                            onNavigate={() => setIsMobileSidebarOpen(false)}
                            showCollapseButton={false}
                        />
                    </SheetContent>
                </Sheet>

                {/* ── Main ── */}
                <div className={`flex-1 flex flex-col min-w-0 min-h-screen transition-[margin] duration-200 ease-in-out
                    ${isCollapsed ? "lg:ml-[60px]" : "lg:ml-64"}`}>

                    {/* Top Header */}
                    <header className="h-[57px] bg-card border-b border-border/60 flex items-center px-4 sm:px-6 gap-3 sticky top-0 z-30">
                        {/* Mobile hamburger */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 lg:hidden text-muted-foreground"
                            onClick={() => setIsMobileSidebarOpen(true)}
                        >
                            <Menu size={18} />
                        </Button>

                        {/* Breadcrumb */}
                        <div className="flex-1 min-w-0">
                            {!hideBreadcrumb && <Breadcrumb pathname={pathname} />}
                        </div>

                        {/* Right controls */}
                        <div className="flex items-center gap-1">
                            <ThemeToggle />

                            <Button variant="ghost" size="icon" className="h-8 w-8 relative text-muted-foreground hover:text-foreground">
                                <Bell size={16} />
                                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--amber)] border border-card" />
                            </Button>

                            <Separator orientation="vertical" className="h-5 mx-1" />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors">
                                        <Avatar className="h-7 w-7 ring-2 ring-primary/20 ring-offset-1 ring-offset-background">
                                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                                {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-left hidden sm:block">
                                            <p className="text-xs font-semibold text-foreground leading-tight">{user.name}</p>
                                            <p className="text-[10px] text-muted-foreground leading-tight">{user.roleLabel}</p>
                                        </div>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel className="font-normal">
                                        <p className="text-sm font-semibold">{user.name}</p>
                                        <p className="text-xs text-muted-foreground">{user.roleLabel}</p>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => setIsLogoutOpen(true)}
                                        className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                                    >
                                        <LogOut size={14} className="mr-2" />
                                        Sign out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>

                    {/* Content */}
                    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] w-full mx-auto">
                        {children}
                    </main>
                </div>
            </div>

            {/* ── Logout Confirmation Dialog ── */}
            <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Sign Out</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to sign out of DFile? Any unsaved changes will be lost.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsLogoutOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => { logout(); setIsLogoutOpen(false); }}
                        >
                            <LogOut size={14} className="mr-2" />
                            Sign Out
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}

