// Typed calls to the Notifications module endpoints.
import { api } from '@/shared/api/client';

export type NotificationStatus = 'queued' | 'sent' | 'failed';

export interface NotificationRow {
    id: number;
    type: string;
    status: NotificationStatus;
    attempts: number;
    last_error: string | null;
    created_at: string | null;
    sent_at: string | null;
    recipient: { name: string; email: string } | null;
    event: string | null;
}

export interface NotificationFilters {
    type: string;
    status: string;
    from: string;
    to: string;
    search: string;
    page: number;
}

export interface NotificationPage {
    data: NotificationRow[];
    meta: { current_page: number; last_page: number; total: number };
    summary: { sent_today: number; daily_limit: number };
}

export async function listNotifications(f: NotificationFilters): Promise<NotificationPage> {
    const query = new URLSearchParams();
    for (const key of ['type', 'status', 'from', 'to', 'search'] as const) {
        if (f[key]) query.set(key, f[key]);
    }
    if (f.page > 1) query.set('page', String(f.page));
    const qs = query.toString();
    return api<NotificationPage>(`/api/notifications${qs ? `?${qs}` : ''}`);
}

export async function retryNotification(id: number): Promise<void> {
    await api(`/api/notifications/${id}/retry`, { method: 'POST' });
}
