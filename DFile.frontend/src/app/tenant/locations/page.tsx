"use client";

import { useState } from "react";
import { RoomListView } from "@/components/room-list-view";
import { useRooms, useRoomCategories, useAddRoom, useArchiveRoom } from "@/hooks/use-rooms";
import { RoomModal } from "@/components/modals/create-room-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function LocationsPage() {
    const { data: rooms = [], isLoading: roomsLoading } = useRooms();
    const { data: roomCategories = [], isLoading: catsLoading } = useRoomCategories();
    const archiveRoom = useArchiveRoom();
    const addRoom = useAddRoom();

    const [createOpen, setCreateOpen] = useState(false);

    if (roomsLoading || catsLoading) {
        return <Card className="p-6"><Skeleton className="h-[400px] w-full" /></Card>;
    }

    return (
        <>
            <RoomListView
                rooms={rooms}
                roomCategories={roomCategories.map(c => ({ id: c.id, name: c.name, subCategory: c.subCategory }))}
                onCreateRoom={() => setCreateOpen(true)}
                onArchiveRoom={(id) => archiveRoom.mutate(id)}
            />
            <RoomModal
                open={createOpen}
                onOpenChange={setCreateOpen}
                roomCategories={roomCategories}
                onSave={(room) => addRoom.mutate({ unitId: room.unitId, name: room.name, floor: room.floor ?? "", categoryId: room.categoryId, status: room.status, maxOccupancy: room.maxOccupancy })}
            />
        </>
    );
}
