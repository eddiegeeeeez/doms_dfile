"use client";

import { useState, useMemo } from "react";
import {
    ColumnDef,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    QrCode, FileBarChart, ArrowUpDown, ArrowUp, ArrowDown,
    Archive, RotateCcw, Search, Filter, Package, SlidersHorizontal,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    DropdownMenu, DropdownMenuCheckboxItem,
    DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QRCodeModal } from "@/components/modals/qr-code-modal";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CurrencyCell } from "@/components/ui/currency-cell";
import { Asset } from "@/types/asset";
import { useAssets, useArchiveAsset, useRestoreAsset } from "@/hooks/use-assets";
import { Skeleton } from "@/components/ui/skeleton";

const statusVariant: Record<string, "success" | "info" | "warning" | "danger"> = {
    "In Use": "success",
    "Available": "info",
    "Maintenance": "warning",
    "Disposed": "danger",
};

function SortableHeader({ column, children }: { column: { toggleSorting: (asc: boolean) => void; getIsSorted: () => false | "asc" | "desc" }; children: React.ReactNode }) {
    const sorted = column.getIsSorted();
    return (
        <Button
            variant="ghost"
            className="h-auto p-0 text-xs font-medium text-muted-foreground hover:bg-transparent"
            onClick={() => column.toggleSorting(sorted === "asc")}
        >
            {children}
            {sorted === "asc" ? (
                <ArrowUp size={14} className="ml-1" />
            ) : sorted === "desc" ? (
                <ArrowDown size={14} className="ml-1" />
            ) : (
                <ArrowUpDown size={14} className="ml-1 opacity-50" />
            )}
        </Button>
    );
}

interface AssetTableProps {
    onAssetClick?: (asset: Asset) => void;
}

export function AssetTable({ onAssetClick }: AssetTableProps) {
    const { data: assets = [], isLoading } = useAssets();
    const archiveAssetMutation = useArchiveAsset();
    const restoreAssetMutation = useRestoreAsset();

    const [showArchived, setShowArchived] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [selectedAssetForQR, setSelectedAssetForQR] = useState<Asset | null>(null);
    const [pageInput, setPageInput] = useState("");

    const uniqueCategories = useMemo(
        () => Array.from(new Set(assets.map((a) => a.cat))).sort(),
        [assets],
    );

    const filteredAssets = useMemo(() => {
        return assets.filter((asset) => {
            if (showArchived ? asset.status !== "Archived" : asset.status === "Archived") return false;

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const match =
                    asset.desc.toLowerCase().includes(q) ||
                    asset.id.toLowerCase().includes(q) ||
                    asset.model?.toLowerCase().includes(q) ||
                    asset.serialNumber?.toLowerCase().includes(q);
                if (!match) return false;
            }

            if (statusFilter !== "All" && asset.status !== statusFilter) return false;
            if (categoryFilter !== "All" && asset.cat !== categoryFilter) return false;

            return true;
        });
    }, [assets, showArchived, searchQuery, statusFilter, categoryFilter]);

    const columns = useMemo<ColumnDef<Asset>[]>(
        () => [
            {
                accessorKey: "id",
                header: ({ column }) => <SortableHeader column={column}>Asset ID</SortableHeader>,
                cell: ({ row }) => (
                    <span className="font-mono text-xs text-muted-foreground">
                        {row.getValue("id")}
                    </span>
                ),
            },
            {
                accessorKey: "desc",
                header: ({ column }) => <SortableHeader column={column}>Asset Name</SortableHeader>,
                cell: ({ row }) => (
                    <span className="text-sm text-foreground">{row.getValue("desc")}</span>
                ),
            },
            {
                accessorKey: "cat",
                header: ({ column }) => <SortableHeader column={column}>Category</SortableHeader>,
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">{row.getValue("cat")}</span>
                ),
            },
            {
                accessorKey: "status",
                header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
                cell: ({ row }) => {
                    const status = row.getValue("status") as string;
                    return <Badge variant={statusVariant[status] ?? "muted"}>{status}</Badge>;
                },
            },
            {
                accessorKey: "room",
                header: ({ column }) => <SortableHeader column={column}>Room</SortableHeader>,
                cell: ({ row }) => (
                    <span className="text-sm text-muted-foreground">{row.getValue("room")}</span>
                ),
            },
            {
                accessorKey: "value",
                header: ({ column }) => (
                    <div className="flex justify-end">
                        <SortableHeader column={column}>Value</SortableHeader>
                    </div>
                ),
                cell: ({ row }) => <CurrencyCell value={row.getValue("value") as number} />,
            },
            {
                id: "qr",
                enableHiding: false,
                header: () => (
                    <span className="text-xs font-medium text-muted-foreground">QR</span>
                ),
                cell: ({ row }) => (
                    <div className="text-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAssetForQR(row.original);
                            }}
                            aria-label="Show QR code"
                        >
                            <QrCode size={15} />
                        </Button>
                    </div>
                ),
            },
            {
                id: "actions",
                enableHiding: false,
                header: () => (
                    <span className="text-xs font-medium text-muted-foreground text-center block">
                        {showArchived ? "Restore" : "Archive"}
                    </span>
                ),
                cell: ({ row }) => {
                    const asset = row.original;
                    const isArchived = asset.status === "Archived";
                    return (
                        <div className="text-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-7 w-7 ${isArchived ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"}`}
                                title={isArchived ? "Restore" : "Archive"}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isArchived) {
                                        restoreAssetMutation.mutate(asset.id);
                                    } else {
                                        archiveAssetMutation.mutate(asset.id);
                                    }
                                }}
                                aria-label={isArchived ? "Restore asset" : "Archive asset"}
                            >
                                {isArchived ? <RotateCcw size={15} /> : <Archive size={15} />}
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [showArchived, archiveAssetMutation, restoreAssetMutation],
    );

    const table = useReactTable({
        data: filteredAssets,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        state: { sorting, columnVisibility },
        initialState: { pagination: { pageSize: 10 } },
    });

    const handleExportCSV = () => {
        const rows = table.getSortedRowModel().rows.map((row) => {
            const a = row.original;
            return [a.id, `"${a.desc.replace(/"/g, '""')}"`, a.cat, a.status, a.room, a.value.toFixed(2)];
        });
        const csv = [
            "Asset ID,Asset Name,Category,Status,Room,Value",
            ...rows.map((r) => r.join(",")),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `fleet_report_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePageInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            const page = Number(pageInput);
            if (page >= 1 && page <= table.getPageCount()) {
                table.setPageIndex(page - 1);
            }
            setPageInput("");
        }
    };

    if (isLoading) {
        return (
            <Card className="overflow-hidden">
                <div className="p-5 border-b border-border">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-8 w-28" />
                    </div>
                </div>
                <div className="p-5 flex gap-3">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 w-36" />
                    <Skeleton className="h-9 w-36" />
                </div>
                <div className="divide-y divide-border">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="px-5 py-3.5 flex gap-4 items-center">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 flex-1" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <QRCodeModal
                open={!!selectedAssetForQR}
                onOpenChange={(open) => !open && setSelectedAssetForQR(null)}
                asset={selectedAssetForQR}
            />

            <Card className="overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 justify-between items-center">
                    <div className="flex flex-1 gap-2 w-full sm:w-auto items-center">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Search assets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-sm"
                                aria-label="Search assets"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[160px] h-9 text-sm">
                                <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Status</SelectItem>
                                {Object.keys(statusVariant).map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[160px] h-9 text-sm">
                                <Package className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Categories</SelectItem>
                                {uniqueCategories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 text-sm">
                                    <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                                    Columns
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                {table
                                    .getAllColumns()
                                    .filter((col) => col.getCanHide())
                                    .map((column) => (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize text-sm"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(v) => column.toggleVisibility(!!v)}
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="outline" size="sm" className="h-9 text-sm" onClick={handleExportCSV}>
                            <FileBarChart size={14} className="mr-1.5" />
                            Export
                        </Button>
                        <Button
                            variant={showArchived ? "default" : "outline"}
                            size="sm"
                            className="h-9 text-sm"
                            onClick={() => setShowArchived(!showArchived)}
                        >
                            {showArchived ? (
                                <>
                                    <RotateCcw size={14} className="mr-1.5" />
                                    Active ({assets.filter((a) => a.status !== "Archived").length})
                                </>
                            ) : (
                                <>
                                    <Archive size={14} className="mr-1.5" />
                                    Archived ({assets.filter((a) => a.status === "Archived").length})
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table className="w-full">
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className="cursor-pointer hover:bg-muted/5 transition-colors"
                                        onClick={() => onAssetClick?.(row.original)}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center text-muted-foreground text-sm"
                                    >
                                        {showArchived ? "No archived assets yet" : "No assets match your search"}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Footer */}
                <div className="px-4 py-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                            {table.getFilteredRowModel().rows.length === 0
                                ? "No results"
                                : `${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–${Math.min(
                                      (table.getState().pagination.pageIndex + 1) *
                                          table.getState().pagination.pageSize,
                                      table.getFilteredRowModel().rows.length,
                                  )} of ${table.getFilteredRowModel().rows.length}`}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <span>Rows:</span>
                            <Select
                                value={String(table.getState().pagination.pageSize)}
                                onValueChange={(v) => table.setPageSize(Number(v))}
                            >
                                <SelectTrigger className="h-7 w-[62px] text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[5, 10, 20, 50].map((s) => (
                                        <SelectItem key={s} value={String(s)} className="text-xs">
                                            {s}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                            Page {table.getState().pagination.pageIndex + 1} of{" "}
                            {table.getPageCount() || 1}
                        </span>
                        <Input
                            placeholder="Go to"
                            value={pageInput}
                            onChange={(e) => setPageInput(e.target.value)}
                            onKeyDown={handlePageInputSubmit}
                            className="h-7 w-16 text-xs text-center"
                            aria-label="Go to page"
                        />
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} aria-label="First page">
                            <ChevronsLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page">
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page">
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} aria-label="Last page">
                            <ChevronsRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
