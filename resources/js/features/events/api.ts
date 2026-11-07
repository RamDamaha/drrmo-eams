// Typed calls to the Events module endpoints.
import { api } from '@/shared/api/client';

export interface CampusLocation {
    id: number;
    name: string;
}

export interface EventSummary {
    id: number;
    title: string;
    description: string | null;
    status: 'draft' | 'published' | 'cancelled' | 'completed';
    starts_at: string;
    ends_at: string;
    location?: CampusLocation;
}

export interface NewEvent {
    title: string;
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

export async function listLocations(): Promise<CampusLocation[]> {
    const body = await api<{ data: { locations: CampusLocation[] } }>('/api/event-lookups');
    return body.data.locations;
}
