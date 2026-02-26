import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Role, Employee, Department } from '@/types/asset'; // Ensure types are exported from here or correct path
import { toast } from 'sonner';

export function useRoles() {
    return useQuery({
        queryKey: ['roles'],
        queryFn: async () => {
            const { data } = await api.get<Role[]>('/api/Roles');
            return data;
        },
    });
}

export function useEmployees() {
    return useQuery({
        queryKey: ['employees'],
        queryFn: async () => {
             const { data } = await api.get<Employee[]>('/api/Employees');
             return data;
        },
    });
}

export function useDepartments() {
    return useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            const { data } = await api.get<Department[]>('/api/Departments');
            return data;
        },
    });
}

export function useAddRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (role: Role) => {
            const { data } = await api.post<Role>('/api/Roles', role);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            toast.success('Role added successfully');
        },
        onError: () => {
            toast.error('Failed to add role');
        },
    });
}

export function useAddEmployee() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (employee: Employee) => {
            const { data } = await api.post<Employee>('/api/Employees', employee);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            toast.success('Employee added successfully');
        },
        onError: () => {
            toast.error('Failed to add employee');
        },
    });
}

export function useUpdateEmployee() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (employee: Employee) => {
            await api.put<Employee>(`/api/Employees/${employee.id}`, employee);
            return employee;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            toast.success('Employee updated successfully');
        },
        onError: () => {
            toast.error('Failed to update employee');
        },
    });
}

export function useArchiveEmployee() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (employeeId: string) => {
             // First fetch to clear status
            const { data: emp } = await api.get<Employee>(`/api/Employees/${employeeId}`);
            if (emp.status === "Archived") {
                await api.put(`/api/Employees/restore/${employeeId}`);
                emp.status = "Active";
            } else {
                await api.put(`/api/Employees/archive/${employeeId}`);
                emp.status = "Archived";
            }
            return emp;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            const message = data?.status === 'Archived' ? 'Employee archived' : 'Employee restored';
            toast.success(message);
        },
        onError: () => {
            toast.error('Failed to update employee status');
        },
    });
}
