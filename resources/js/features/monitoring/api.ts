// Typed calls to the Monitoring module endpoints.
import { api } from '@/shared/api/client';

export async function startDuty(assignmentId: number): Promise<void> {
    await api(`/api/me/assignments/${assignmentId}/start-duty`, { method: 'POST' });
}

export async function endDuty(assignmentId: number): Promise<void> {
    await api(`/api/me/assignments/${assignmentId}/end-duty`, { method: 'POST' });
}
