"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tag, Plus, Search, Pencil, Archive, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Category } from "@/types/asset";
import { useCategories, useAddCategory, useUpdateCategory, useArchiveCategory, useRestoreCategory } from "@/hooks/use-categories";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const handlingLabels: Record<number, string> = { 0: "Non-Consumable", 1: "Consumable" };

export default function AssetCategoriesPage() {
    const [showArchived, setShowArchived] = useState(false);
    const { data: categories = [], isLoading } = useCategories(showArchived);
    const addMutation = useAddCategory();
    const updateMutation = useUpdateCategory();
    const archiveMutation = useArchiveCategory();
    const restoreMutation = useRestoreCategory();

    const [searchQuery, setSearchQuery] = useState("");
    const [archiveTarget, setArchiveTarget] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [form, setForm] = useState({ categoryName: "", description: "", handlingType: 0 });

    const filtered = useMemo(() => {
        return categories.filter(c => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return c.categoryName.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
            }
            return true;
        });
    }, [categories, searchQuery]);

    const openCreate = () => {
        setEditingCat(null);
        setForm({ categoryName: "", description: "", handlingType: 0 });
        setIsFormOpen(true);
    };

    const openEdit = (cat: Category) => {
        setEditingCat(cat);
        setForm({ categoryName: cat.categoryName, description: cat.description, handlingType: cat.handlingType });
        setIsFormOpen(true);
    };

    const handleSave = async () => {
        if (!form.categoryName.trim()) { toast.error("Category name is required"); return; }
        if (editingCat) {
            await updateMutation.mutateAsync({ id: editingCat.id, payload: form });
            toast.success("Category updated");
        } else {
            await addMutation.mutateAsync(form);
            toast.success("Category created");
        }
        setIsFormOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Tag className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                    <h1 className="text-xl font-semibold tracking-tight">Asset Categories</h1>
                    <p className="text-sm text-muted-foreground">Define and manage asset classification categories</p>
                </div>
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Category
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <CardTitle>{showArchived ? "Archived Categories" : "Asset Categories"}</CardTitle>
                            <CardDescription>{filtered.length} categories</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                            </div>
                            <Button variant="outline" size="icon" onClick={() => setShowArchived(!showArchived)}>
                                {showArchived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Tag className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>{showArchived ? "No archived categories" : "No categories found"}</p>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Handling Type</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map(c => (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-medium">{c.categoryName}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{c.description}</TableCell>
                                            <TableCell><Badge variant="muted">{handlingLabels[c.handlingType] ?? "Unknown"}</Badge></TableCell>
                                            <TableCell>{c.items}</TableCell>
                                            <TableCell><Badge variant={c.status === "Active" ? "success" : "muted"}>{c.status}</Badge></TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                                                    {c.status === "Active" ? (
                                                        <Button variant="ghost" size="icon" onClick={() => setArchiveTarget(c.id)}><Archive className="h-4 w-4" /></Button>
                                                    ) : (
                                                        <Button variant="ghost" size="icon" onClick={() => restoreMutation.mutateAsync(c.id)}><RotateCcw className="h-4 w-4" /></Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCat ? "Edit Category" : "Create Category"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Category Name</Label>
                            <Input value={form.categoryName} onChange={(e) => setForm(f => ({ ...f, categoryName: e.target.value }))} placeholder="e.g. IT Equipment" />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Category description" />
                        </div>
                        <div className="space-y-2">
                            <Label>Handling Type</Label>
                            <Select value={String(form.handlingType)} onValueChange={(v) => setForm(f => ({ ...f, handlingType: Number(v) }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Non-Consumable</SelectItem>
                                    <SelectItem value="1">Consumable</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={addMutation.isPending || updateMutation.isPending}>
                            {editingCat ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={archiveTarget !== null}
                onOpenChange={(open) => { if (!open) setArchiveTarget(null); }}
                title="Archive Category"
                description="Are you sure you want to archive this category? It can be restored later from the archive view."
                confirmLabel="Archive"
                confirmVariant="destructive"
                onConfirm={async () => {
                    if (archiveTarget) {
                        await archiveMutation.mutateAsync(archiveTarget);
                        setArchiveTarget(null);
                    }
                }}
                isLoading={archiveMutation.isPending}
            />
        </div>
    );
}
