
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { MaintenanceRecord } from '@/types/asset';
import { toast } from 'sonner';

interface CreateMaintenancePayload {
    assetId: string;
    description: string;
    status?: string;
    priority?: string;
    type?: string;
    frequency?: string;
    startDate?: string;
    endDate?: string;
    cost?: number;
    attachments?: string;
}

interface UpdateMaintenancePayload extends CreateMaintenancePayload {
    dateReported?: string;
}

export function useMaintenanceRecords(showArchived: boolean = false) {
    return useQuery({
        queryKey: ['maintenance', showArchived],
        queryFn: async () => {
            const { data } = await api.get<MaintenanceRecord[]>('/api/maintenance', {
                params: { showArchived }
            });
            return data;
        },
    });
}

export function useAddMaintenanceRecord() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: CreateMaintenancePayload) => {
            const { data } = await api.post<MaintenanceRecord>('/api/maintenance', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance'] });
            toast.success('Maintenance request submitted');
        },
        onError: () => {
            toast.error('Failed to create maintenance request');
        },
    });
}

export function useUpdateMaintenanceRecord() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: UpdateMaintenancePayload }) => {
            const { data } = await api.put<MaintenanceRecord>(`/api/maintenance/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance'] });
            toast.success('Maintenance record updated');
        },
        onError: () => {
            toast.error('Failed to update maintenance record');
        },
    });
}

export function useUpdateMaintenanceStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const { data: record } = await api.get<MaintenanceRecord>(`/api/maintenance/${id}`);
            const payload: UpdateMaintenancePayload = {
                assetId: record.assetId,
                description: record.description,
                status,
                priority: record.priority,
                type: record.type,
                frequency: record.frequency,
                startDate: record.startDate,
                endDate: record.endDate,
                cost: record.cost,
                attachments: record.attachments,
                dateReported: record.dateReported,
            };
            await api.put(`/api/maintenance/${id}`, payload);
            return { ...record, status };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance'] });
            toast.success('Maintenance status updated');
        },
        onError: () => {
            toast.error('Failed to update maintenance status');
        },
    });
}

export function useArchiveMaintenanceRecord() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.put(`/api/maintenance/archive/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance'] });
            toast.success('Maintenance record archived');
        },
        onError: () => {
            toast.error('Failed to archive record');
        },
    });
}

export function useRestoreMaintenanceRecord() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.put(`/api/maintenance/restore/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance'] });
            toast.success('Maintenance record restored');
        },
        onError: () => {
            toast.error('Failed to restore record');
        },
    });
}
