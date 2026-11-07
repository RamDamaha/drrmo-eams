// Shared labels and date formats for the events screens.
import type { EventSummary } from './api';

export const statuses: Record<EventSummary['status'], { label: string; chip: string }> = {
    draft: { label: 'Draft', chip: 'bg-white text-stone-700 ring-stone-300' },
    published: { label: 'Published', chip: 'bg-green-50 text-green-800 ring-green-200' },
    completed: { label: 'Completed', chip: 'bg-stone-100 text-stone-600 ring-stone-200' },
    cancelled: { label: 'Cancelled', chip: 'bg-stone-100 text-stone-600 ring-stone-200' },
};

export const chipClass =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset';

const dayFormat = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});
const shortDayFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

// One event day reads "Sat, Nov 14, 2026" over "8:00 AM to 5:00 PM".
// A longer event shows both ends with their day.
export function schedule(startsAt: string, endsAt: string) {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const time = `${timeFormat.format(start)} to ${timeFormat.format(end)}`;
    if (start.toDateString() === end.toDateString()) {
        return { day: dayFormat.format(start), time };
    }
    return { day: `${shortDayFormat.format(start)} to ${dayFormat.format(end)}`, time };
}
