"use client";

import { useState, useMemo } from "react";
import {
    ShoppingCart, Search, Filter, DollarSign, Package, CheckCircle2, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CurrencyCell } from "@/components/ui/currency-cell";
import { PurchaseOrder } from "@/types/asset";
import { usePurchaseOrders, useUpdateOrder } from "@/hooks/use-procurement";
import { Skeleton } from "@/components/ui/skeleton";

const statusVariant: Record<string, "info" | "success" | "warning" | "danger" | "muted"> = {
    Pending: "warning",
    Approved: "success",
    Delivered: "info",
    Cancelled: "danger",
};

export default function ProcurementApprovalsPage() {
    const { data: orders = [], isLoading } = usePurchaseOrders();
    const updateMutation = useUpdateOrder();

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [detailOrder, setDetailOrder] = useState<PurchaseOrder | null>(null);

    const activeOrders = useMemo(() => orders.filter((o) => !o.archived), [orders]);

    const filteredOrders = useMemo(() => {
        return activeOrders.filter((o) => {
            if (statusFilter !== "all" && o.status !== statusFilter) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return (
                    o.assetName.toLowerCase().includes(q) ||
                    o.id.toLowerCase().includes(q) ||
                    o.vendor?.toLowerCase().includes(q) ||
                    o.requestedBy?.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [activeOrders, searchQuery, statusFilter]);

    const handleStatusChange = async (order: PurchaseOrder, newStatus: string) => {
        await updateMutation.mutateAsync({
            id: order.id,
            payload: {
                assetName: order.assetName,
                category: order.category,
                vendor: order.vendor,
                manufacturer: order.manufacturer,
                model: order.model,
                serialNumber: order.serialNumber,
                purchasePrice: order.purchasePrice,
                purchaseDate: order.purchaseDate,
                usefulLifeYears: order.usefulLifeYears,
                requestedBy: order.requestedBy,
                status: newStatus,
            },
        });
        setDetailOrder(null);
    };

    const pendingCount = activeOrders.filter((o) => o.status === "Pending").length;
    const approvedCount = activeOrders.filter((o) => o.status === "Approved").length;
    const totalValue = activeOrders
        .filter((o) => o.status === "Approved" || o.status === "Delivered")
        .reduce((sum, o) => sum + o.purchasePrice, 0);

    if (isLoading) {
        return <Card className="p-6"><Skeleton className="h-[400px] w-full" /></Card>;
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Orders</p>
                            <p className="text-2xl font-bold">{activeOrders.length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Package className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Pending Approval</p>
                            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Approved</p>
                            <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Approved Value</p>
                            <CurrencyCell value={totalValue} className="text-2xl font-bold text-blue-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Table */}
            <Card className="overflow-hidden">
                <div className="px-6 py-5 border-b border-border/40 flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Procurement Approvals</h3>
                        <p className="text-sm text-muted-foreground">Review and approve procurement requests</p>
                    </div>
                </div>

                <div className="px-6 py-4 border-b border-border/40 flex flex-col lg:flex-row gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search orders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10" />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] h-10">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-muted-foreground" />
                                <SelectValue placeholder="Filter by Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-b border-border/40">
                                <TableHead>Order ID</TableHead>
                                <TableHead>Asset Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Requested By</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-center">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.length === 0 ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                                        No purchase orders match your filters
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => (
                                    <TableRow key={order.id} className="cursor-pointer" onClick={() => setDetailOrder(order)}>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{order.id}</TableCell>
                                        <TableCell className="font-medium">{order.assetName}</TableCell>
                                        <TableCell className="text-muted-foreground">{order.category || "—"}</TableCell>
                                        <TableCell className="text-muted-foreground">{order.vendor || "—"}</TableCell>
                                        <TableCell><CurrencyCell value={order.purchasePrice} /></TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariant[order.status] ?? "muted"}>{order.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{order.requestedBy || "—"}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {order.status === "Pending" && (
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10"
                                                        onClick={(e) => { e.stopPropagation(); handleStatusChange(order, "Approved"); }}
                                                        title="Approve"
                                                    >
                                                        <CheckCircle2 size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                        onClick={(e) => { e.stopPropagation(); handleStatusChange(order, "Cancelled"); }}
                                                        title="Reject"
                                                    >
                                                        <XCircle size={14} />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="px-6 py-4 border-t border-border/40 bg-muted/20">
                    <span className="text-sm text-muted-foreground font-medium">
                        Showing {filteredOrders.length} of {activeOrders.length} orders
                    </span>
                </div>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={!!detailOrder} onOpenChange={(open) => { if (!open) setDetailOrder(null); }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader><DialogTitle>Order Details — {detailOrder?.id}</DialogTitle></DialogHeader>
                    {detailOrder && (
                        <div className="space-y-3 py-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="text-muted-foreground">Asset Name</span><p className="font-medium">{detailOrder.assetName}</p></div>
                                <div><span className="text-muted-foreground">Category</span><p className="font-medium">{detailOrder.category || "—"}</p></div>
                                <div><span className="text-muted-foreground">Vendor</span><p className="font-medium">{detailOrder.vendor || "—"}</p></div>
                                <div><span className="text-muted-foreground">Manufacturer</span><p className="font-medium">{detailOrder.manufacturer || "—"}</p></div>
                                <div><span className="text-muted-foreground">Model</span><p className="font-medium">{detailOrder.model || "—"}</p></div>
                                <div><span className="text-muted-foreground">Serial Number</span><p className="font-medium">{detailOrder.serialNumber || "—"}</p></div>
                                <div><span className="text-muted-foreground">Purchase Price</span><CurrencyCell value={detailOrder.purchasePrice} className="font-medium" /></div>
                                <div><span className="text-muted-foreground">Useful Life</span><p className="font-medium">{detailOrder.usefulLifeYears} years</p></div>
                                <div><span className="text-muted-foreground">Requested By</span><p className="font-medium">{detailOrder.requestedBy || "—"}</p></div>
                                <div><span className="text-muted-foreground">Created</span><p className="font-medium">{detailOrder.createdAt ? new Date(detailOrder.createdAt).toLocaleDateString() : "—"}</p></div>
                            </div>
                            <div className="pt-3 border-t">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <div className="flex items-center gap-3 mt-1">
                                    <Badge variant={statusVariant[detailOrder.status] ?? "muted"} className="text-sm">
                                        {detailOrder.status}
                                    </Badge>
                                    {detailOrder.status === "Pending" && (
                                        <div className="flex gap-2">
                                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleStatusChange(detailOrder, "Approved")}>
                                                Approve
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleStatusChange(detailOrder, "Cancelled")}>
                                                Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
