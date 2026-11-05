// Who is signed in. Calls /api/me, /api/login and /api/logout (Core).
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/shared/api/client';

export interface Me {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'marshal' | 'volunteer' | 'coordinator' | null;
    team: string | null;
    status: 'active' | 'inactive';
    permissions: string[];
    consent: { privacy_notice: boolean; location_tracking: boolean };
    home: '/admin' | '/me';
}

const meKey = ['me'] as const;

// Returns null when nobody is signed in (401).
async function fetchMe(): Promise<Me | null> {
    try {
        const body = await api<{ data: Me }>('/api/me');
        return body.data;
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
    }
}

export function useMe() {
    return useQuery({ queryKey: meKey, queryFn: fetchMe, staleTime: 60_000, retry: false });
}

export function useAuthActions() {
    const queryClient = useQueryClient();

    async function login(email: string, password: string): Promise<Me> {
        await fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' });
        const body = await api<{ data: Me }>('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        queryClient.setQueryData(meKey, body.data);
        return body.data;
    }

    async function logout(): Promise<void> {
        await api('/api/logout', { method: 'POST' });
        queryClient.setQueryData(meKey, null);
    }

    return { login, logout };
}
