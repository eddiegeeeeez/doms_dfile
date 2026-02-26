"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/auth-context";
import { Asset } from "@/types/asset";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const AssetStats = dynamic(() => import("@/components/asset-stats").then(m => ({ default: m.AssetStats })), {
    loading: () => <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Card key={i} className="p-5"><Skeleton className="h-16 w-full" /></Card>)}</div>,
});
const AssetTable = dynamic(() => import("@/components/asset-table").then(m => ({ default: m.AssetTable })), {
    loading: () => <Card className="p-5"><Skeleton className="h-64 w-full" /></Card>,
});
const AssetDetailsModal = dynamic(() => import("@/components/modals/asset-details-modal").then(m => ({ default: m.AssetDetailsModal })));
const MaintenanceView = dynamic(() => import("@/components/maintenance-view").then(m => ({ default: m.MaintenanceView })), {
    loading: () => <Card className="p-5"><Skeleton className="h-64 w-full" /></Card>,
});
const ProcurementView = dynamic(() => import("@/components/procurement-view").then(m => ({ default: m.ProcurementView })), {
    loading: () => <Card className="p-5"><Skeleton className="h-64 w-full" /></Card>,
});
const FinanceDashboard = dynamic(() => import("@/components/finance-dashboard").then(m => ({ default: m.FinanceDashboard })), {
    loading: () => <Card className="p-5"><Skeleton className="h-64 w-full" /></Card>,
});
const AcquisitionModal = dynamic(() => import("@/components/modals/acquisition-modal").then(m => ({ default: m.AcquisitionModal })));

export default function DashboardPage() {
    const { user } = useAuth();

    // UI State
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isCreateMaintenanceOpen, setIsCreateMaintenanceOpen] = useState(false);
    const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);

    const handleAssetClick = (asset: Asset) => {
        setSelectedAsset(asset);
        setIsDetailsModalOpen(true);
    };

    if (!user) return null;

    let content;

    if (user.role === 'Maintenance') {
        content = (
            <MaintenanceView />
        );
    } else if (user.role === 'Procurement') {
        content = (
            <ProcurementView
                onNewOrder={() => setIsCreateOrderOpen(true)}
            />
        );
    } else if (user.role === 'Finance') {
        content = <FinanceDashboard />;
    } else {
        // Admin & Super Admin View (Stats + Table)
        content = (
            <div className="space-y-6">
                <AssetStats />
                <AssetTable
                    onAssetClick={handleAssetClick}
                />
            </div>
        );
    }

    return (
        <>
            {content}


            <AcquisitionModal
                open={isCreateOrderOpen}
                onOpenChange={setIsCreateOrderOpen}
            />

            <AssetDetailsModal
                open={isDetailsModalOpen}
                onOpenChange={setIsDetailsModalOpen}
                asset={selectedAsset}
            />
        </>
    );
}
