
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PurchaseOrder, Asset } from '@/types/asset';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAddAsset } from './use-assets';

export function usePurchaseOrders() {
    return useQuery({
        queryKey: ['purchaseOrders'],
        queryFn: async () => {
            const { data } = await api.get<PurchaseOrder[]>('/api/PurchaseOrders');
            return data;
        },
    });
}

export function useCreateOrder() {
    const queryClient = useQueryClient();
    const addAssetMutation = useAddAsset();

    return useMutation({
        mutationFn: async ({ order, asset }: { order: PurchaseOrder; asset: Asset }) => {
            const { data } = await api.post<PurchaseOrder>('/api/PurchaseOrders', order);
            return { createdOrder: data, asset };
        },
        onSuccess: async ({ asset }) => {
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
            await addAssetMutation.mutateAsync(asset);
            toast.success('Procurement order initiated');
        },
        onError: () => {
            toast.error('Failed to create procurement order');
        },
    });
}

export function useArchiveOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.put(`/api/PurchaseOrders/archive/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
            toast.success('Order archived');
        },
        onError: () => {
            toast.error('Failed to archive order');
        },
    });
}

export function useRestoreOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await api.put(`/api/PurchaseOrders/restore/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
            toast.success('Order restored');
        },
        onError: () => {
            toast.error('Failed to restore order');
        },
    });
}
