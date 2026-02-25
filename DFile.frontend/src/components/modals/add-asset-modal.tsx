"use client";

import { Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AddAssetForm } from "@/components/forms/add-asset-form";

import { Asset, Category } from "@/types/asset";

interface AddAssetModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: Category[];
    onAddAsset?: (asset: Asset) => void;
    initialData?: Asset;
    mode?: "create" | "edit";
}

export function AddAssetModal({ open, onOpenChange, categories, onAddAsset, initialData, mode = "create" }: AddAssetModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[72rem] w-[95vw] rounded-2xl border-border p-0 overflow-hidden h-[90vh] flex flex-col shadow-lg">
                <DialogHeader className="p-6 bg-gradient-to-r from-muted/40 to-muted/20 border-b border-border shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary"><Package size={24} /></div>
                        <div className="flex-1">
                            <DialogTitle className="text-lg font-semibold text-foreground">{mode === "create" ? "Register New Asset" : "Edit Asset Details"}</DialogTitle>
                            <DialogDescription className="text-muted-foreground text-sm mt-1">{mode === "create" ? "Physical Asset Intake Protocol" : "Modify existing asset record"}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <AddAssetForm
                    categories={categories}
                    onCancel={() => onOpenChange(false)}
                    onSuccess={() => onOpenChange(false)}
                    onAddAsset={onAddAsset}
                    isModal={true}
                    initialData={initialData}
                />
            </DialogContent>
        </Dialog>
    );
}
