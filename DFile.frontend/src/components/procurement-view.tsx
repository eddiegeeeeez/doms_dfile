"use client";

import { useState } from "react";
import { ShoppingCart, Clock, CheckCircle2, DollarSign, Plus, Package, Archive, RotateCcw, Search, Filter, Calendar as CalendarIcon, PhilippinePeso } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard, StatCardSkeleton } from "@/components/ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CurrencyCell } from "@/components/ui/currency-cell";
import { CurrencyHeader } from "@/components/ui/currency-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PurchaseOrder } from "@/types/asset";
import { usePurchaseOrders, useArchiveOrder } from "@/hooks/use-procurement";
import { Skeleton } from "@/components/ui/skeleton";

interface ProcurementViewProps {
    onNewOrder: () => void;
    onOrderClick?: (order: PurchaseOrder) => void;
}

export function ProcurementView({ onNewOrder, onOrderClick }: ProcurementViewProps) {
    const { data: orders = [], isLoading } = usePurchaseOrders();
    const archiveOrderMutation = useArchiveOrder();

    const [showArchived, setShowArchived] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [dateFilter, setDateFilter] = useState("All Time");

    // Filter Logic
    const filteredOrders = orders.filter(order => {
        // 1. Archive Status
        if (showArchived !== !!order.archived) return false;

        // 2. Text Search
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            order.id.toLowerCase().includes(query) ||
            order.assetName.toLowerCase().includes(query) ||
            (order.vendor && order.vendor.toLowerCase().includes(query));

        if (!matchesSearch) return false;

        // 3. Status Filter
        if (statusFilter !== "All" && order.status !== statusFilter) return false;

        // 4. Date Filter
        if (dateFilter !== "All Time") {
            const dateStr = order.purchaseDate || order.createdAt; // Use purchase date or created date
            if (!dateStr) return false;

            const date = new Date(dateStr);
            const now = new Date();

            if (dateFilter === "This Month") {
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }
            if (dateFilter === "Last Month") {
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
            }
            if (dateFilter === "This Year") {
                return date.getFullYear() === now.getFullYear();
            }
        }

        return true;
    });

    const activeOrders = orders.filter(o => !o.archived);
    const archivedOrders = orders.filter(o => o.archived);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(val);
    const formatDecimal = (val: number) => new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

    // Summary stats
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === "Pending").length;
    const approvedOrders = orders.filter(o => o.status === "Approved" || o.status === "Delivered").length;
    const totalSpend = orders.reduce((sum, o) => sum + o.purchasePrice, 0);

    const statusVariant: Record<string, "warning" | "info" | "success" | "danger" | "muted"> = {
        Pending: "warning",
        Approved: "info",
        Delivered: "success",
        Cancelled: "danger",
    };

    const summaryCards = [
        { label: "Total Orders", value: totalOrders.toString(), icon: ShoppingCart, iconBg: "bg-primary/10", iconText: "text-primary", valueColor: "text-primary" },
        { label: "Pending Approval", value: pendingOrders.toString(), icon: Clock, iconBg: "bg-amber-500/10", iconText: "text-amber-600", valueColor: "text-amber-600" },
        { label: "Approved / Delivered", value: approvedOrders.toString(), icon: CheckCircle2, iconBg: "bg-emerald-500/10", iconText: "text-emerald-600", valueColor: "text-emerald-600" },
        { label: "Total Spend", value: formatCurrency(totalSpend), icon: PhilippinePeso, iconBg: "bg-blue-500/10", iconText: "text-blue-600", valueColor: "text-blue-600" },
    ];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <StatCardSkeleton key={i} />
                    ))}
                </div>
                <div className=" border border-border p-6 space-y-4">
                    <Skeleton className="h-8 w-full mb-4" />
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">


            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryCards.map((stat, i) => (
                    <StatCard key={i} label={stat.label} value={stat.value} icon={stat.icon} valueClassName={stat.valueColor} iconClassName={`${stat.iconBg} ${stat.iconText}`} />
                ))}
            </div>

            {/* Search and Filters Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex flex-1 gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search orders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-sm"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[160px] h-9 text-sm">
                            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Status</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Ordered">Ordered</SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="w-[160px] h-9 text-sm">
                            <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All Time">All Time</SelectItem>
                            <SelectItem value="This Month">This Month</SelectItem>
                            <SelectItem value="Last Month">Last Month</SelectItem>
                            <SelectItem value="This Year">This Year</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <Button onClick={onNewOrder} size="sm" className="h-10 text-sm bg-primary text-primary-foreground shadow-sm">
                        <Plus size={16} className="mr-2" />
                        New Order
                    </Button>
                    <Button variant={showArchived ? "default" : "outline"} size="sm" className="h-10 text-sm w-[160px] justify-start" onClick={() => setShowArchived(!showArchived)}>
                        {showArchived ? <><RotateCcw size={16} className="mr-2" />Show Active ({activeOrders.length})</> : <><Archive size={16} className="mr-2" />Show Archive ({archivedOrders.length})</>}
                    </Button>
                </div>
            </div>

            {/* Orders Table */}
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table className="w-full table-fixed">
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-muted/50">
                                    <TableHead className="px-6 py-4 text-left align-middle text-xs font-medium text-muted-foreground w-[100px]">Order ID</TableHead>
                                    <TableHead className="px-6 py-4 text-left align-middle text-xs font-medium text-muted-foreground w-[20%]">Asset</TableHead>
                                    <TableHead className="px-6 py-4 text-left align-middle text-xs font-medium text-muted-foreground w-[15%]">Category</TableHead>
                                    <TableHead className="px-6 py-4 text-left align-middle text-xs font-medium text-muted-foreground w-[15%]">Vendor</TableHead>
                                    <CurrencyHeader className="w-[100px] px-6 py-4">Price</CurrencyHeader>
                                    <TableHead className="px-6 py-4 text-center align-middle text-xs font-medium text-muted-foreground w-[120px]">Purchase Date</TableHead>
                                    <TableHead className="px-6 py-4 text-center align-middle text-xs font-medium text-muted-foreground w-[100px]">Useful Life</TableHead>
                                    <TableHead className="px-6 py-4 text-center align-middle text-xs font-medium text-muted-foreground w-[150px]">Status</TableHead>
                                    <TableHead className="px-6 py-4 text-left align-middle text-xs font-medium text-muted-foreground w-[100px]">Asset ID</TableHead>
                                    <TableHead className="px-6 py-4 text-center align-middle text-xs font-medium text-muted-foreground w-[80px]">{showArchived ? "Restore" : "Archive"}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-24 text-center text-muted-foreground text-sm">
                                            {showArchived ? "No archived orders yet" : "No purchase orders match your search"}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <TableRow key={order.id} className="hover:bg-muted/5 transition-colors cursor-pointer" onClick={() => onOrderClick?.(order)}>
                                            <TableCell className="px-6 py-4 align-middle font-mono text-xs text-muted-foreground text-left">{order.id}</TableCell>
                                            <TableCell className="px-6 py-4 align-middle text-left">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-normal text-foreground">{order.assetName}</span>
                                                    {order.manufacturer && (
                                                        <span className="text-xs text-muted-foreground font-normal">{order.manufacturer} {order.model}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 align-middle text-left">
                                                <span className="text-sm font-normal text-foreground inline-flex">{order.category}</span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 align-middle text-sm text-foreground text-left">{order.vendor || "—"}</TableCell>
                                            <TableCell className="px-6 py-4 align-middle text-sm font-normal">
                                                <CurrencyCell value={order.purchasePrice} />
                                            </TableCell>
                                            <TableCell className="px-6 py-4 align-middle text-center text-sm text-muted-foreground">{order.purchaseDate}</TableCell>
                                            <TableCell className="px-6 py-4 align-middle text-center text-sm text-muted-foreground">{order.usefulLifeYears} yrs</TableCell>
                                            <TableCell className="px-6 py-4 align-middle text-center">
                                                <Badge variant={statusVariant[order.status] ?? "muted"}>{order.status}</Badge>
                                            </TableCell>
                                            <TableCell className="px-6 py-4 align-middle text-left font-mono text-xs text-muted-foreground">
                                                {order.assetId || "—"}
                                            </TableCell>
                                            <TableCell className="px-6 py-4 align-middle text-center">
                                                <div className="flex items-center justify-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            archiveOrderMutation.mutate(order.id);
                                                        }}
                                                        className={`h-7 w-7 rounded-md transition-colors ${order.archived ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'}`}
                                                        title={order.archived ? 'Restore' : 'Archive'}
                                                    >
                                                        {order.archived ? <RotateCcw size={14} /> : <Archive size={14} />}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                     <div className="p-4 border-t border-border bg-muted/5 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground font-normal">
                            Showing {filteredOrders.length} orders
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
