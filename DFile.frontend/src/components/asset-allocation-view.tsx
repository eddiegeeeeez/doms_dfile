"use client";

import { useState } from "react";
import { Search, ArrowRight, CheckCircle2, Building2, Package, Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Asset, Room } from "@/types/asset";

interface AssetAllocationViewProps {
    assets: Asset[];
    rooms: Room[];
    onAllocate: (assetId: string, roomId: string) => void;
}

export function AssetAllocationView({ assets, rooms, onAllocate }: AssetAllocationViewProps) {
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [dateFilter, setDateFilter] = useState<string>("All Time");
    const [roomSearchTerm, setRoomSearchTerm] = useState("");

    // Filter available assets
    const availableAssets = assets.filter(
        (a) => {
            if (a.status !== "Available") return false;

            // Text Search
            const matchesSearch = a.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.id.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            // Category Filter
            if (filterCategory !== "all" && a.categoryName !== filterCategory) return false;

            // Date Filter
            if (dateFilter !== "All Time") {
                if (!a.purchaseDate) return false;
                const date = new Date(a.purchaseDate);
                const now = new Date();

                if (dateFilter === "This Month") {
                    if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) return false;
                }
                if (dateFilter === "This Year") {
                    if (date.getFullYear() !== now.getFullYear()) return false;
                }
            }

            return true;
        }
    );

    // Filter rooms
    const filteredRooms = rooms.filter(r =>
        r.unitId.toLowerCase().includes(roomSearchTerm.toLowerCase()) ||
        r.floor.toString().includes(roomSearchTerm)
    );

    const categories = Array.from(new Set(assets.map(a => a.categoryName).filter((v): v is string => Boolean(v))));
    const selectedAsset = assets.find(a => a.id === selectedAssetId);
    // const selectedRoom = rooms.find(r => r.unitId === selectedRoomId); // Unused

    const handleConfirmAllocation = () => {
        if (selectedAssetId && selectedRoomId) {
            onAllocate(selectedAssetId, selectedRoomId);
            setSelectedAssetId(null);
            setSelectedRoomId(null);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 lg:h-[calc(100vh-12rem)]">
            {/* Left Panel: Available Assets */}
            <div className="lg:col-span-2 flex flex-col h-full gap-6">
                 <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
                    <div className="flex flex-1 flex-wrap gap-3 w-full lg:w-auto">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or ID..."
                                className="pl-9 h-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger className="w-[160px] h-10">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={dateFilter} onValueChange={setDateFilter}>
                            <SelectTrigger className="w-[160px] h-10">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                    <SelectValue placeholder="Period" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All Time">All Time</SelectItem>
                                <SelectItem value="This Month">This Month</SelectItem>
                                <SelectItem value="This Year">This Year</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                 </div>

                <Card className="flex-1 flex flex-col">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Package className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Asset Inventory</CardTitle>
                                    <CardDescription>Select an available asset</CardDescription>
                                </div>
                            </div>
                            <Badge variant="outline">{availableAssets.length} Available</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-0">
                    {availableAssets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                            <Package className="h-10 w-10 mb-2 opacity-20" />
                            <p className="text-sm">No available assets found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/40">
                            {availableAssets.map((asset) => (
                                <div
                                    key={asset.id}
                                    onClick={() => setSelectedAssetId(asset.id)}
                                    className={`p-4 flex items-center justify-between cursor-pointer transition-colors hover:bg-muted/30 ${selectedAssetId === asset.id ? "bg-primary/5 border-l-4 border-primary" : "border-l-4 border-transparent"}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                            {asset.image ? (
                                                <img src={asset.image} alt="" className="h-full w-full object-cover rounded-lg" />
                                            ) : (
                                                <Package className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{asset.desc}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 rounded">{asset.id}</span>
                                                <span className="text-xs text-muted-foreground">• {asset.categoryName}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedAssetId === asset.id && <CheckCircle2 className="text-primary h-5 w-5" />}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            </div>

            {/* Right Panel: Allocation Action */}
            <div className="flex flex-col gap-6 h-full">
                {/* Target Room Selection */}
                <Card className="flex-1 flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Target Location</CardTitle>
                                <CardDescription>Select destination room unit</CardDescription>
                            </div>
                        </div>
                        <div className="relative mt-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search room..."
                                className="pl-9 h-10"
                                value={roomSearchTerm}
                                onChange={(e) => setRoomSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                        <div className="space-y-2">
                            {filteredRooms.map((room) => (
                                <div
                                    key={room.id}
                                    onClick={() => setSelectedRoomId(room.unitId)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedRoomId === room.unitId ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border/50 hover:border-primary/50"}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                                                <Building2 className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{room.unitId}</p>
                                                <p className="text-xs text-muted-foreground">{room.floor}</p>
                                            </div>
                                        </div>
                                        {selectedRoomId === room.unitId && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Confirmation Box */}
                <Card className="bg-muted/30">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Selected Asset:</span>
                            <span className="font-medium truncate max-w-[150px]">{selectedAsset?.desc || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Target Room:</span>
                            <span className="font-medium">{selectedRoomId || "—"}</span>
                        </div>

                        <Button
                            className="w-full gap-2"
                            size="lg"
                            disabled={!selectedAssetId || !selectedRoomId}
                            onClick={handleConfirmAllocation}
                        >
                            Confirm Allocation <ArrowRight className="h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
