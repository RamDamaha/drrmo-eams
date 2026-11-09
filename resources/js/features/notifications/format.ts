// Labels and chips for the notification log.
import type { NotificationStatus } from './api';

export const typeLabels: Record<string, string> = {
    'assignment.created': 'Assigned',
    'assignment.changed': 'Changed',
    'assignment.cancelled': 'Cancelled',
};

export const statusChips: Record<NotificationStatus, { label: string; chip: string }> = {
    queued: { label: 'Queued', chip: 'bg-amber-50 text-amber-900 ring-amber-200' },
    sent: { label: 'Sent', chip: 'bg-green-50 text-green-800 ring-green-200' },
    failed: { label: 'Failed', chip: 'bg-red-50 text-red-800 ring-red-200' },
};

const stamp = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
});

export function when(iso: string | null): string {
    return iso ? stamp.format(new Date(iso)) : 'Not yet';
}

// 'ok' under 80% of the limit, 'near' from 80%, 'over' at or past it.
export function usageLevel(sent: number, limit: number): 'ok' | 'near' | 'over' {
    if (limit <= 0) return 'ok';
    if (sent >= limit) return 'over';
    return sent / limit >= 0.8 ? 'near' : 'ok';
}

export const typeSentences: Record<string, string> = {
    'assignment.created': 'You were assigned to a duty',
    'assignment.changed': 'Your duty was changed',
    'assignment.cancelled': 'Your duty was cancelled',
};
