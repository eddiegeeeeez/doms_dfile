"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useRoles, useEmployees, useAddRole } from "@/hooks/use-organization";

const RolesDashboard = dynamic(() => import("@/components/roles-dashboard").then(m => ({ default: m.RolesDashboard })), {
    loading: () => <Card className="p-5"><Skeleton className="h-64 w-full" /></Card>,
});
const CreateRoleModal = dynamic(() => import("@/components/modals/create-role-modal").then(m => ({ default: m.CreateRoleModal })));

export default function RolesPage() {
    const { data: roles = [] } = useRoles();
    const { data: employees = [] } = useEmployees();
    const addRoleMutation = useAddRole();
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

    return (
        <>
            <RolesDashboard
                roles={roles}
                employees={employees}
                onOpenModal={() => setIsRoleModalOpen(true)}
                onAddPersonnel={() => {}}
                onEmployeeClick={() => {}}
                onArchiveEmployee={() => Promise.resolve()}
            />

            <CreateRoleModal
                open={isRoleModalOpen}
                onOpenChange={setIsRoleModalOpen}
                onSave={async (role) => await addRoleMutation.mutateAsync({ designation: role.designation, department: role.department, scope: role.scope })}
            />
        </>
    );
}
