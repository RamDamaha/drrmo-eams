// Date math, filters and staffing for the admin calendar. Kept apart from the page so it is easy to test.
import type { CalendarEvent } from './api';

export type CalendarView = 'month' | 'week' | 'day';

export const calendarViews: { id: CalendarView; label: string }[] = [
    { id: 'month', label: 'Month' },
    { id: 'week', label: 'Week' },
    { id: 'day', label: 'Day' },
];

export function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function sameDay(a: Date, b: Date): boolean {
    return a.toDateString() === b.toDateString();
}

// "2026-11-07", in local time, for the address bar.
export function dayKey(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

export function parseDayKey(value: string | null): Date | null {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

// The days on screen. A month shows whole weeks from Sunday, only as many as it needs.
export function visibleDays(view: CalendarView, anchor: Date): Date[] {
    if (view === 'day') return [startOfDay(anchor)];
    if (view === 'week') {
        const start = addDays(anchor, -anchor.getDay());
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const length = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
    const weeks = Math.ceil((first.getDay() + length) / 7);
    const start = addDays(first, -first.getDay());
    return Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));
}

// Previous or next page. A month keeps the same day number when it can.
export function shiftAnchor(view: CalendarView, anchor: Date, by: number): Date {
    if (view === 'day') return addDays(anchor, by);
    if (view === 'week') return addDays(anchor, by * 7);
    const last = new Date(anchor.getFullYear(), anchor.getMonth() + by + 1, 0).getDate();
    return new Date(anchor.getFullYear(), anchor.getMonth() + by, Math.min(anchor.getDate(), last));
}

export function touchesDay(event: CalendarEvent, day: Date): boolean {
    return new Date(event.starts_at) < addDays(day, 1) && new Date(event.ends_at) > day;
}

export function isLive(event: CalendarEvent, now = new Date()): boolean {
    return (
        event.status === 'published' &&
        new Date(event.starts_at) <= now &&
        new Date(event.ends_at) > now
    );
}

// Active events with open places, or with no duties set yet.
export function needsPeople(event: CalendarEvent): boolean {
    if (event.status !== 'draft' && event.status !== 'published') return false;
    return event.places_needed === 0 || event.people_count < event.places_needed;
}

export interface CalendarFilters {
    status: string;
    type: string;
    needsPeople: boolean;
}

export function matchesFilters(event: CalendarEvent, filters: CalendarFilters): boolean {
    if (filters.status && event.status !== filters.status) return false;
    if (filters.type && event.event_type.value !== filters.type) return false;
    if (filters.needsPeople && !needsPeople(event)) return false;
    return true;
}

export interface Staffing {
    tone: 'full' | 'short' | 'unset' | 'closed';
    // 0 to 1, for the width of the bar.
    ratio: number;
    // "5/8" in tight spots, "5 of 8 filled" elsewhere.
    short: string;
    long: string;
}

export function staffing(event: CalendarEvent): Staffing {
    const { people_count: people, places_needed: needed } = event;
    if (needed === 0) return { tone: 'unset', ratio: 0, short: '', long: 'No duties yet' };
    const closed = event.status === 'completed' || event.status === 'cancelled';
    return {
        tone: closed ? 'closed' : people >= needed ? 'full' : 'short',
        ratio: Math.min(people / needed, 1),
        short: `${people}/${needed}`,
        long: `${people} of ${needed} filled`,
    };
}

const clock = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

// How the event sits on one day: "8:00 AM to 5:00 PM", "From 8:00 AM", "Until 5:00 PM" or "All day".
export function timeOnDay(event: CalendarEvent, day: Date): string {
    const start = new Date(event.starts_at);
    const end = new Date(event.ends_at);
    const startsToday = start >= day;
    const endsToday = end <= addDays(day, 1);
    if (startsToday && endsToday) return `${clock.format(start)} to ${clock.format(end)}`;
    if (startsToday) return `From ${clock.format(start)}`;
    if (endsToday) return `Until ${clock.format(end)}`;
    return 'All day';
}

const monthYear = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
const longDay = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
});
const monthDay = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const fullShort = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});

// The heading over the grid: "November 2026", "Nov 1 to 7, 2026" or "Saturday, November 7, 2026".
export function rangeLabel(view: CalendarView, anchor: Date): string {
    if (view === 'month') return monthYear.format(anchor);
    if (view === 'day') return longDay.format(anchor);
    const days = visibleDays('week', anchor);
    const first = days[0];
    const last = days[6];
    if (first.getFullYear() !== last.getFullYear()) {
        return `${fullShort.format(first)} to ${fullShort.format(last)}`;
    }
    if (first.getMonth() === last.getMonth()) {
        return `${monthDay.format(first)} to ${last.getDate()}, ${last.getFullYear()}`;
    }
    return `${monthDay.format(first)} to ${monthDay.format(last)}, ${last.getFullYear()}`;
}
