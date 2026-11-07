// A-Calendar. Plain functional month grid for the admin. Styling is for the design pass.
// Each day lists the events that touch it. Click an event to open it.
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { getCalendar, type CalendarEvent } from '@/features/events/api';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';

const monthName = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
const clock = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

// The six-week grid that contains the month, starting on Sunday.
function gridDays(month: Date): Date[] {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = addDays(first, -first.getDay());
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

function touchesDay(event: CalendarEvent, day: Date): boolean {
    const dayEnd = addDays(day, 1);
    return new Date(event.starts_at) < dayEnd && new Date(event.ends_at) > day;
}

export function Calendar() {
    const [month, setMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const days = gridDays(month);
    const from = days[0];
    const to = addDays(days[41], 1);

    const events = useQuery({
        queryKey: ['calendar', from.toISOString(), to.toISOString()],
        queryFn: () => getCalendar(from.toISOString(), to.toISOString()),
    });

    const shift = (by: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + by, 1));

    return (
        <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Calendar</h1>
                <div className="flex items-center gap-2">
                    <Button size="md" variant="secondary" onClick={() => shift(-1)}>
                        Previous
                    </Button>
                    <p
                        className="min-w-40 text-center font-semibold text-stone-900"
                        aria-live="polite"
                    >
                        {monthName.format(month)}
                    </p>
                    <Button size="md" variant="secondary" onClick={() => shift(1)}>
                        Next
                    </Button>
                    <Button
                        size="md"
                        variant="secondary"
                        onClick={() => {
                            const now = new Date();
                            setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                        }}
                    >
                        Today
                    </Button>
                </div>
            </div>

            {events.isError && (
                <div className="mt-4">
                    <Alert tone="error">The calendar did not load.</Alert>
                </div>
            )}

            <div className="mt-4 grid grid-cols-7 gap-px overflow-hidden rounded-card bg-stone-200 ring-1 ring-stone-200">
                {WEEKDAYS.map((name) => (
                    <div
                        key={name}
                        className="bg-stone-50 px-2 py-1.5 text-xs font-semibold text-stone-600"
                    >
                        {name}
                    </div>
                ))}
                {days.map((day) => {
                    const inMonth = day.getMonth() === month.getMonth();
                    const isToday = startOfDay(new Date()).getTime() === day.getTime();
                    const todays = (events.data ?? []).filter((event) => touchesDay(event, day));
                    return (
                        <div
                            key={day.toISOString()}
                            className={`min-h-28 p-1.5 ${inMonth ? 'bg-white' : 'bg-stone-50'}`}
                        >
                            <p
                                className={`text-xs tabular-nums ${isToday ? 'font-bold text-maroon-700' : inMonth ? 'text-stone-700' : 'text-stone-400'}`}
                            >
                                {day.getDate()}
                            </p>
                            <ul className="mt-1 space-y-1">
                                {todays.map((event) => (
                                    <li key={event.id}>
                                        <Link
                                            to={`/admin/events/${event.id}`}
                                            title={`${event.title}, ${clock.format(new Date(event.starts_at))} to ${clock.format(new Date(event.ends_at))}, ${event.people_count} of ${event.places_needed} places filled`}
                                            className={`block truncate rounded px-1.5 py-0.5 text-xs font-medium ${
                                                event.status === 'cancelled'
                                                    ? 'bg-stone-100 text-stone-500 line-through'
                                                    : event.status === 'draft'
                                                      ? 'bg-amber-50 text-amber-800'
                                                      : 'bg-maroon-50 text-maroon-800'
                                            }`}
                                        >
                                            {event.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
