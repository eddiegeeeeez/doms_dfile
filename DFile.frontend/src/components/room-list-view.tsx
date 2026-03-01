import { useState, useMemo } from "react";
import { DoorOpen, Layers, Building2, Plus, Search, Archive, RotateCcw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Room } from "@/types/asset";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoomDetailsModal } from "./modals/room-details-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface RoomListViewProps {
    rooms: Room[];
    roomCategories: { id: string; name: string; subCategory?: string }[];
    onCreateRoom?: () => void;
    onManageCategories?: () => void;
    onRoomClick?: (room: Room) => void;
    onArchiveRoom?: (id: string) => void;
    readOnly?: boolean;
}

export function RoomListView({ rooms, roomCategories, onCreateRoom, onManageCategories, onRoomClick, onArchiveRoom, readOnly = false }: RoomListViewProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [showArchived, setShowArchived] = useState(false);
    const [floorFilter, setFloorFilter] = useState<string>("all");
    
    // Details Modal State
    const [selectedRoomForDetails, setSelectedRoomForDetails] = useState<Room | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [archiveTarget, setArchiveTarget] = useState<string | null>(null);

    // Get unique floors for filter
    const uniqueFloors = useMemo(() => {
        const floors = new Set(rooms.map(r => r.floor).filter(f => f !== null && f !== undefined));
        return Array.from(floors).sort((a, b) => {
             const numA = Number(a);
             const numB = Number(b);
             if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
             return String(a).localeCompare(String(b));
        });
    }, [rooms]);

    const getRoomCategory = (id: string) => {
        return roomCategories.find(c => c.id === id);
    };

    const handleRowClick = (room: Room) => {
        setSelectedRoomForDetails(room);
        setIsDetailsModalOpen(true);
    };

    const handleEditFromDetails = () => {
        if (selectedRoomForDetails && onRoomClick) {
            onRoomClick(selectedRoomForDetails);
        }
    };

    const filteredRooms = rooms.filter(room => {
        // Archive Status
        if (showArchived !== !!room.archived) return false;

        // Floor Filter
        if (floorFilter !== "all") {
             if (room.floor === null || room.floor === undefined) return false;
             if (room.floor.toString() !== floorFilter) return false;
        }

        if (!searchQuery) return true;

        const query = searchQuery.toLowerCase().trim();
        
        // Exact matching for floor (usually numeric)
        if (room.floor && room.floor.toString().toLowerCase() === query) return true;

        // Smart matching for Room Number / Name
        const name = room.name ? room.name.toLowerCase() : "";
        const unitId = room.unitId ? room.unitId.toLowerCase() : "";
        
        // Category Search
        const category = getRoomCategory(room.categoryId);
        const categoryName = category ? category.name.toLowerCase() : "";
        
        return name.includes(query) || unitId.includes(query) || categoryName.includes(query);
    });

    const activeRoomsCount = rooms.filter(r => !r.archived).length;
    const archivedRoomsCount = rooms.filter(r => r.archived).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                <div className="flex flex-1 flex-wrap gap-3 w-full lg:w-auto items-center">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search room, floor or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10"
                        />
                    </div>
                     <Select value={floorFilter} onValueChange={setFloorFilter}>
                        <SelectTrigger className="w-[150px] h-10">
                            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                             <SelectValue placeholder="Floor" />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="all">All Floors</SelectItem>
                             {uniqueFloors.map((floor) => (
                                 <SelectItem key={String(floor)} value={String(floor)}>
                                     Floor {String(floor)}
                                 </SelectItem>
                             ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                    {!readOnly && !showArchived && onManageCategories && (
                        <Button variant="outline" onClick={onManageCategories} size="sm" className="hidden sm:flex h-10">
                            <Layers size={16} className="mr-2" />
                            Manage Categories
                        </Button>
                    )}
                    {!readOnly && !showArchived && onCreateRoom && (
                        <Button onClick={onCreateRoom} size="sm" className="h-10">
                            <Plus size={16} className="mr-2" />
                            Create Unit
                        </Button>
                    )}
                    {!readOnly && (
                        <Button
                            variant={showArchived ? "default" : "outline"}
                            onClick={() => setShowArchived(!showArchived)}
                            size="sm"
                            className="h-10"
                        >
                             {showArchived ? (
                                <><RotateCcw size={16} className="mr-2" />Active ({activeRoomsCount})</>
                            ) : (
                                <><Archive size={16} className="mr-2" />Archived ({archivedRoomsCount})</>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="w-full table-fixed">
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-y border-border/40">
                                <TableHead className="w-[20%]">Room Number</TableHead>
                                <TableHead className="w-[20%]">Category</TableHead>
                                <TableHead className="w-[20%]">Sub-category</TableHead>
                                <TableHead className="w-[20%]">Floor</TableHead>
                                {!readOnly && <TableHead className="w-[20%] text-center">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRooms.length === 0 ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={readOnly ? 4 : 5} className="h-32 text-center text-muted-foreground">
                                        {showArchived ? "No archived room units yet" : "No room units match your search."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRooms.map((room) => {
                                    const category = getRoomCategory(room.categoryId);
                                    return (
                                        <TableRow
                                            key={room.id}
                                            className="cursor-pointer"
                                            onClick={() => handleRowClick(room)}
                                        >
                                            <TableCell className="font-medium w-[20%]">
                                                <div className="flex flex-col">
                                                    <span>{room.name || "—"}</span>
                                                    <span className="text-xs text-muted-foreground font-normal">#{room.unitId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[20%]">
                                                {category?.name || "—"}
                                            </TableCell>
                                            <TableCell className="w-[20%] text-muted-foreground">
                                                {category?.subCategory || "—"}
                                            </TableCell>
                                            <TableCell className="w-[20%] text-muted-foreground">
                                                {room.floor}
                                            </TableCell>
                                            {!readOnly && (
                                                <TableCell className="w-[20%] text-center">
                                                    <div className="flex items-center justify-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (room.archived) {
                                                                    onArchiveRoom?.(room.id);
                                                                } else {
                                                                    setArchiveTarget(room.id);
                                                                }
                                                            }}
                                                            className={`h-8 w-8 ${room.archived ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'}`}
                                                            title={room.archived ? 'Restore' : 'Archive'}
                                                        >
                                                            {room.archived ? <RotateCcw size={16} /> : <Archive size={16} />}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="px-6 py-4 border-t border-border/40 bg-muted/20">
                     <div className="text-sm text-muted-foreground font-medium">
                        Showing {filteredRooms.length} rooms
                    </div>
                </div>
            </Card>

            <RoomDetailsModal
                open={isDetailsModalOpen}
                onOpenChange={setIsDetailsModalOpen}
                room={selectedRoomForDetails}
                roomCategories={roomCategories}
                onEdit={handleEditFromDetails}
            />

            <ConfirmDialog
                open={archiveTarget !== null}
                onOpenChange={(open) => { if (!open) setArchiveTarget(null); }}
                title="Archive Room"
                description="Are you sure you want to archive this room? It can be restored later from the archive view."
                confirmLabel="Archive"
                confirmVariant="destructive"
                onConfirm={() => {
                    if (archiveTarget) {
                        onArchiveRoom?.(archiveTarget);
                        setArchiveTarget(null);
                    }
                }}
            />
        </div>
    );
}
