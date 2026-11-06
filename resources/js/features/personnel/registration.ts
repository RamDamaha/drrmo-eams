// Calls for the public "Request access" flow and the admin review screen (Personnel module).
import { api } from '@/shared/api/client';

export interface RegisterInput {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
    privacy_consent: boolean;
}

export async function requestAccess(input: RegisterInput): Promise<string> {
    const body = await api<{ message: string }>('/api/register', {
        method: 'POST',
        body: JSON.stringify(input),
    });
    return body.message;
}

export async function confirmEmail(email: string, code: string): Promise<void> {
    await api('/api/register/verify', { method: 'POST', body: JSON.stringify({ email, code }) });
}

export async function resendCode(email: string): Promise<void> {
    await api('/api/register/resend', { method: 'POST', body: JSON.stringify({ email }) });
}

export type RequestStatus = 'pending_email' | 'pending_approval' | 'active' | 'rejected';

export interface AccessRequest {
    id: number;
    first_name: string;
    last_name: string;
    // First and last name together, for display.
    name: string;
    email: string;
    account_status: RequestStatus;
    requested_at: string | null;
    email_verified_at: string | null;
    reviewed_at: string | null;
    rejection_reason: string | null;
}

export async function listRequests(status: RequestStatus | 'all'): Promise<AccessRequest[]> {
    const body = await api<{ data: AccessRequest[] }>(`/api/admin/registrations?status=${status}`);
    return body.data;
}

export async function approveRequest(id: number): Promise<void> {
    await api(`/api/admin/registrations/${id}/approve`, { method: 'POST' });
}

export async function rejectRequest(id: number, reason: string): Promise<void> {
    await api(`/api/admin/registrations/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
    });
}
