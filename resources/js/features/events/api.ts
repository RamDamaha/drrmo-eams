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
    requirements?: Requirement[];
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

export interface Requirement {
    id: number;
    duty_type: Option;
    role: 'marshal' | 'volunteer';
    team_needed: string | null;
    headcount: number;
    shift_starts_at: string;
    shift_ends_at: string;
    instructions: string | null;
    assignments: Assignment[];
}

export interface NewRequirement {
    duty_type_id: number;
    role: string;
    team_needed: string;
    headcount: number;
    // ISO 8601 with offset.
    shift_starts_at: string;
    shift_ends_at: string;
    instructions: string;
}

export async function createRequirement(
    eventId: number,
    input: NewRequirement,
): Promise<Requirement> {
    const body = await api<{ data: Requirement }>(`/api/events/${eventId}/requirements`, {
        method: 'POST',
        body: JSON.stringify(input),
    });
    return body.data;
}

export async function removeRequirement(id: number): Promise<void> {
    await api(`/api/requirements/${id}`, { method: 'DELETE' });
}

export async function listCandidates(requirementId: number): Promise<Candidate[]> {
    const body = await api<{ data: Candidate[] }>(`/api/requirements/${requirementId}/candidates`);
    return body.data;
}

export async function assignPerson(requirementId: number, userId: number): Promise<void> {
    await api(`/api/requirements/${requirementId}/assignments`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
    });
}

export async function removeAssignment(id: number): Promise<void> {
    await api(`/api/assignments/${id}`, { method: 'DELETE' });
}

export async function publishEvent(id: number): Promise<void> {
    await api(`/api/events/${id}/publish`, { method: 'POST' });
}

export async function cancelEvent(id: number): Promise<void> {
    await api(`/api/events/${id}/cancel`, { method: 'POST' });
}

export interface MyAssignment {
    id: number;
    event: { id: number; title: string; status: string; location: string | null };
    duty_type: string | null;
    team_needed: string | null;
    instructions: string | null;
    starts_at: string;
    ends_at: string;
}

export async function listMyAssignments(): Promise<MyAssignment[]> {
    const body = await api<{ data: MyAssignment[] }>('/api/me/assignments');
    return body.data;
}
