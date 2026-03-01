"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { KeyRound, Plus, Pencil, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import { RoleTemplate, RolePermissionEntry } from "@/types/asset";
import { useRoleTemplates, useCreateRoleTemplate, useUpdateRoleTemplate, useDeleteRoleTemplate } from "@/hooks/use-role-templates";

const DEFAULT_MODULES = ["Assets", "Rooms", "Maintenance", "Procurement", "Employees", "Departments", "Reports"];

interface TemplateFormData {
    name: string;
    description: string;
    permissions: Omit<RolePermissionEntry, "id">[];
}

const emptyForm = (): TemplateFormData => ({
    name: "",
    description: "",
    permissions: DEFAULT_MODULES.map(m => ({
        moduleName: m,
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canApprove: false,
        canArchive: false,
    })),
});

export default function RoleTemplatesPage() {
    const { data: templates = [], isLoading } = useRoleTemplates();
    const createMutation = useCreateRoleTemplate();
    const updateMutation = useUpdateRoleTemplate();
    const deleteMutation = useDeleteRoleTemplate();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<TemplateFormData>(emptyForm());

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm());
        setIsFormOpen(true);
    };

    const openEdit = (template: RoleTemplate) => {
        setEditingId(template.id);
        setForm({
            name: template.name,
            description: template.description ?? "",
            permissions: DEFAULT_MODULES.map(mod => {
                const existing = template.permissions.find(p => p.moduleName === mod);
                return existing
                    ? { moduleName: existing.moduleName, canView: existing.canView, canCreate: existing.canCreate, canEdit: existing.canEdit, canDelete: existing.canDelete, canApprove: existing.canApprove, canArchive: existing.canArchive }
                    : { moduleName: mod, canView: false, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canArchive: false };
            }),
        });
        setIsFormOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error("Template name is required"); return; }

        const payload = {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            permissions: form.permissions,
        };

        if (editingId) {
            await updateMutation.mutateAsync({ id: editingId, payload });
            toast.success("Role template updated");
        } else {
            await createMutation.mutateAsync(payload);
            toast.success("Role template created");
        }
        setIsFormOpen(false);
    };

    const handleDelete = async (id: number) => {
        await deleteMutation.mutateAsync(id);
        toast.success("Role template deleted");
    };

    const togglePermission = (moduleIndex: number, field: keyof Omit<RolePermissionEntry, "id" | "moduleName">) => {
        setForm(prev => {
            const perms = [...prev.permissions];
            perms[moduleIndex] = { ...perms[moduleIndex], [field]: !perms[moduleIndex][field] };
            return { ...prev, permissions: perms };
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <KeyRound className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                    <h1 className="text-xl font-semibold tracking-tight">Role Templates</h1>
                    <p className="text-sm text-muted-foreground">Define permission templates for tenant roles</p>
                </div>
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" /> New Template
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Templates</CardTitle>
                    <CardDescription>{templates.length} role templates defined</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
                    ) : templates.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No role templates defined yet</p>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Permissions</TableHead>
                                        <TableHead>Tenants Using</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {templates.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell className="font-medium">{t.name}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{t.description ?? "—"}</TableCell>
                                            <TableCell><Badge variant="muted">{t.permissions.length} modules</Badge></TableCell>
                                            <TableCell>{t.tenantCount}</TableCell>
                                            <TableCell>
                                                <Badge variant={t.isSystem ? "info" : "muted"}>{t.isSystem ? "System" : "Custom"}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    {!t.isSystem && t.tenantCount === 0 && (
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
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

            {/* Create/Edit Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Role Template" : "Create Role Template"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Template Name</Label>
                                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Finance Manager" />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
                            </div>
                        </div>

                        <div>
                            <Label className="mb-3 block">Module Permissions</Label>
                            <div className="rounded-md border overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Module</TableHead>
                                            <TableHead className="text-center">View</TableHead>
                                            <TableHead className="text-center">Create</TableHead>
                                            <TableHead className="text-center">Edit</TableHead>
                                            <TableHead className="text-center">Delete</TableHead>
                                            <TableHead className="text-center">Approve</TableHead>
                                            <TableHead className="text-center">Archive</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {form.permissions.map((perm, idx) => (
                                            <TableRow key={perm.moduleName}>
                                                <TableCell className="font-medium">{perm.moduleName}</TableCell>
                                                {(["canView", "canCreate", "canEdit", "canDelete", "canApprove", "canArchive"] as const).map(field => (
                                                    <TableCell key={field} className="text-center">
                                                        <Checkbox checked={perm[field]} onCheckedChange={() => togglePermission(idx, field)} />
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                            {editingId ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
