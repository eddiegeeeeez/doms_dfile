"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const RoomListView = dynamic(() => import("@/components/room-list-view").then(m => ({ default: m.RoomListView })), {
    loading: () => <Card className="p-5"><Skeleton className="h-64 w-full" /></Card>,
});
const RoomModal = dynamic(() => import("@/components/modals/create-room-modal").then(m => ({ default: m.RoomModal })));
const ManageRoomCategoriesModal = dynamic(() => import("@/components/modals/manage-room-categories-modal").then(m => ({ default: m.ManageRoomCategoriesModal })));
import { useRooms, useRoomCategories, useAddRoom, useUpdateRoom, useArchiveRoom, useAddRoomCategory, useUpdateRoomCategory, useArchiveRoomCategory } from "@/hooks/use-rooms";
import { Room } from "@/types/asset";

export default function RoomsPage() {
    const { data: rooms = [] } = useRooms();
    const { data: roomCategories = [] } = useRoomCategories();

    const addRoomMutation = useAddRoom();
    const updateRoomMutation = useUpdateRoom();
    const archiveRoomMutation = useArchiveRoom();

    const addCategoryMutation = useAddRoomCategory();
    const updateCategoryMutation = useUpdateRoomCategory();
    const archiveCategoryMutation = useArchiveRoomCategory();

    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

    const handleRoomClick = (room: Room) => {
        setSelectedRoom(room);
        setIsRoomModalOpen(true);
    };

    const handleSaveRoom = async (room: Room) => {
        if (selectedRoom) {
            await updateRoomMutation.mutateAsync(room);
        } else {
            await addRoomMutation.mutateAsync(room);
        }
        setIsRoomModalOpen(false);
        setSelectedRoom(null);
    };

    return (
        <>
            <RoomListView
                rooms={rooms}
                roomCategories={roomCategories}
                onCreateRoom={() => {
                    setSelectedRoom(null);
                    setIsRoomModalOpen(true);
                }}
                onManageCategories={() => setIsCategoryModalOpen(true)}
                onRoomClick={handleRoomClick}
                onArchiveRoom={async (id) => {
                    const room = rooms.find(r => r.id === id);
                    if (room) {
                        await archiveRoomMutation.mutateAsync(room);
                    }
                }}
            />

            <RoomModal
                open={isRoomModalOpen}
                onOpenChange={(open) => {
                    setIsRoomModalOpen(open);
                    if (!open) setSelectedRoom(null);
                }}
                roomCategories={roomCategories}
                onSave={handleSaveRoom}
                initialData={selectedRoom}
                defaultEditing={true}
            />

            <ManageRoomCategoriesModal
                open={isCategoryModalOpen}
                onOpenChange={setIsCategoryModalOpen}
                roomCategories={roomCategories}
                onAddCategory={async (category) => await addCategoryMutation.mutateAsync({ ...category, status: 'Active', maxOccupancy: category.maxOccupancy ?? 0 })}
                onUpdateCategory={async (id, data) => await updateCategoryMutation.mutateAsync({ ...data, id } as any)}
                onArchiveCategory={async (id) => {
                     const cat = roomCategories.find(c => c.id === id);
                     if (cat) {
                         await archiveCategoryMutation.mutateAsync(cat);
                     }
                }}
            />
        </>
    );
}
