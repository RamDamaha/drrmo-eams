// Typed calls to the Events module endpoints.
import { api } from '@/shared/api/client';

export interface CampusLocation {
    id: number;
    name: string;
}

export interface EventSummary {
    id: number;
    title: string;
    event_type: { value: string; label: string };
    assignments?: Assignment[];
    description: string | null;
    status: 'draft' | 'published' | 'cancelled' | 'completed';
    starts_at: string;
    ends_at: string;
    location?: CampusLocation;
}

export interface NewEvent {
    title: string;
    event_type: string;
    description: string;
    campus_location_id: number;
    // ISO 8601 with offset.
    starts_at: string;
    ends_at: string;
}

export async function listEvents(): Promise<EventSummary[]> {
    const body = await api<{ data: EventSummary[] }>('/api/events');
    return body.data;
}

export async function createEvent(input: NewEvent): Promise<EventSummary> {
    const body = await api<{ data: EventSummary }>('/api/events', {
        method: 'POST',
        body: JSON.stringify(input),
    });
    return body.data;
}

export interface Option {
    id: number;
    name: string;
}

export interface Lookups {
    locations: CampusLocation[];
    event_types: { value: string; label: string }[];
    task_types: Option[];
}

export interface Assignment {
    id: number;
    person: { id: number; name: string; email: string };
    role: 'marshal' | 'volunteer';
    task_type: Option;
}

export interface Candidate {
    id: number;
    name: string;
    role: 'marshal' | 'volunteer';
}

export async function getLookups(): Promise<Lookups> {
    const body = await api<{ data: Lookups }>('/api/event-lookups');
    return body.data;
}

export async function getEvent(id: number): Promise<EventSummary> {
    const body = await api<{ data: EventSummary }>(`/api/events/${id}`);
    return body.data;
}

export async function listCandidates(eventId: number): Promise<Candidate[]> {
    const body = await api<{ data: Candidate[] }>(`/api/events/${eventId}/candidates`);
    return body.data;
}

export async function assignPerson(
    eventId: number,
    input: { user_id: number; duty_type_id: number },
): Promise<void> {
    await api(`/api/events/${eventId}/assignments`, {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

export async function removeAssignment(id: number): Promise<void> {
    await api(`/api/assignments/${id}`, { method: 'DELETE' });
}
