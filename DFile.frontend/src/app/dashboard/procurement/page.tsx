"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { PurchaseOrder, Asset } from "@/types/asset";

const ProcurementView = dynamic(() => import("@/components/procurement-view").then(m => ({ default: m.ProcurementView })), {
    loading: () => <Card className="p-5"><Skeleton className="h-64 w-full" /></Card>,
});
const AcquisitionModal = dynamic(() => import("@/components/modals/acquisition-modal").then(m => ({ default: m.AcquisitionModal })));
const OrderDetailsModal = dynamic(() => import("@/components/modals/order-details-modal").then(m => ({ default: m.OrderDetailsModal })));

export default function ProcurementPage() {
    const [isAcquisitionModalOpen, setIsAcquisitionModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);

    // Replacement flow state (simplified for now as it's triggered from Maintenance usually)
    const [selectedAssetForReplacement, setSelectedAssetForReplacement] = useState<Asset | null>(null);

    const handleOrderClick = (order: PurchaseOrder) => {
        setSelectedOrder(order);
        setIsOrderDetailsOpen(true);
    };

    return (
        <>
            <ProcurementView
                onNewOrder={() => setIsAcquisitionModalOpen(true)}
                onOrderClick={handleOrderClick}
            />

            <AcquisitionModal
                key={selectedAssetForReplacement ? `acquisition-${selectedAssetForReplacement.id}` : 'acquisition'}
                open={isAcquisitionModalOpen}
                onOpenChange={(open) => {
                    setIsAcquisitionModalOpen(open);
                    if (!open) setSelectedAssetForReplacement(null);
                }}
                replacementAsset={selectedAssetForReplacement}
            />

            <OrderDetailsModal
                open={isOrderDetailsOpen}
                onOpenChange={setIsOrderDetailsOpen}
                order={selectedOrder}
            />
        </>
    );
}
