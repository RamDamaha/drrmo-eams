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

// Asks for a reset link. The server answers the same way whether or not the email has an account.
export async function requestPasswordReset(email: string): Promise<string> {
    const body = await api<{ message: string }>('/api/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
    return body.message;
}

export interface NewPassword {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
}

// Sets a new password from the emailed link. The server then signs the account out everywhere.
export async function resetPassword(input: NewPassword): Promise<string> {
    const body = await api<{ message: string }>('/api/reset-password', {
        method: 'POST',
        body: JSON.stringify(input),
    });
    return body.message;
}

export function useAuthActions() {
    const queryClient = useQueryClient();

    async function login(email: string, password: string): Promise<Me> {
        const body = await api<{ data: Me }>('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        queryClient.setQueryData(meKey, body.data);
        return body.data;
    }

    async function logout(): Promise<void> {
        try {
            await api('/api/logout', { method: 'POST' });
        } catch (error) {
            // A session that already ended (401) or an expired token (419) still counts as signed out.
            const ended =
                error instanceof ApiError && (error.status === 401 || error.status === 419);
            if (!ended) throw error;
        }
        queryClient.setQueryData(meKey, null);
    }

    return { login, logout };
}
