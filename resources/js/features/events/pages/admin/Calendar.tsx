// A-Calendar. Month, week and day views of every event, with how many places are filled.
// View, day and filters live in the address bar, so a link opens the same page.
// Desktop first. Under 768 px the month becomes a compact grid with the chosen day listed below it.
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { getCalendar, getLookups, type CalendarEvent } from '@/features/events/api';
import {
    addDays,
    calendarViews,
    dayKey,
    isLive,
    matchesFilters,
    parseDayKey,
    rangeLabel,
    sameDay,
    shiftAnchor,
    staffing,
    startOfDay,
    timeOnDay,
    touchesDay,
    visibleDays,
    type CalendarFilters,
    type CalendarView,
} from '@/features/events/calendar';
import {
    CalendarIcon,
    CheckIcon,
    ChevronIcon,
    PinIcon,
    PlusIcon,
    SlidersIcon,
} from '@/features/events/components/icons';
import { chipClass, statuses } from '@/features/events/format';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_CELL_LIMIT = 3;

const shortDay = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
});
const longDay = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
});

const isActive = (event: CalendarEvent) => event.status === 'draft' || event.status === 'published';

// Published is a filled maroon tint, draft a dashed outline, completed gray and cancelled struck out,
// so the four still read apart in grayscale.
const eventTone: Record<CalendarEvent['status'], string> = {
    published:
        'border-maroon-100 bg-maroon-50 text-maroon-900 hover:border-maroon-200 hover:bg-maroon-100',
    draft: 'border-dashed border-stone-400 bg-white text-stone-700 hover:bg-stone-50',
    completed: 'border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200/70',
    cancelled: 'border-transparent bg-transparent text-stone-500 hover:bg-stone-100',
};

const dotTone: Record<CalendarEvent['status'], string> = {
    published: 'bg-maroon-700',
    draft: 'border border-stone-500 bg-white',
    completed: 'bg-stone-400',
    cancelled: 'bg-stone-300',
};

const fillTone = {
    full: 'bg-green-600',
    short: 'bg-amber-500',
    closed: 'bg-stone-400',
    unset: '',
};

function describe(event: CalendarEvent, day: Date): string {
    const parts = [event.title, statuses[event.status].label, timeOnDay(event, day)];
    if (isLive(event)) parts.push('happening now');
    if (event.status !== 'cancelled') parts.push(staffing(event).long);
    return parts.join(', ');
}

// "8:00 AM to 5:00 PM" becomes ["8:00 AM", "to 5:00 PM"], so the two halves wrap cleanly.
function splitTime(time: string): string[] {
    const at = time.indexOf(' to ');
    return at === -1 ? [time] : [time.slice(0, at), time.slice(at + 1)];
}

function eventLink(event: CalendarEvent) {
    return `/admin/events/${event.id}`;
}

// A thin bar along the bottom of a chip. Only active events with duties get one.
function ChipBar({ event }: { event: CalendarEvent }) {
    const staff = staffing(event);
    if (!isActive(event) || staff.tone === 'unset') return null;
    return (
        <span className="absolute inset-x-0 bottom-0 h-[3px] bg-stone-900/10" aria-hidden="true">
            <span
                className={`block h-full ${fillTone[staff.tone]}`}
                style={{ width: `${staff.ratio * 100}%` }}
            />
        </span>
    );
}

// Bar plus words, for week cards and day rows.
function StaffMeter({ event, compact = false }: { event: CalendarEvent; compact?: boolean }) {
    if (event.status === 'cancelled') return null;
    const staff = staffing(event);
    const label = compact && staff.tone !== 'unset' ? staff.short : staff.long;
    return (
        <div>
            <p
                className={`flex items-center gap-1 tabular-nums ${compact ? 'text-xs' : 'text-sm'} ${staff.tone === 'unset' ? 'text-stone-500' : 'text-stone-700'}`}
            >
                {staff.tone === 'full' && (
                    <CheckIcon className="size-3.5 shrink-0 text-green-700" />
                )}
                {label}
                {compact && staff.tone !== 'unset' && (
                    <span className="sr-only">places filled</span>
                )}
            </p>
            {staff.tone !== 'unset' && (
                <div
                    className={`mt-1 overflow-hidden rounded-full bg-stone-200 ${compact ? 'h-1' : 'h-1.5'}`}
                    aria-hidden="true"
                >
                    <div
                        className={`h-full rounded-full ${fillTone[staff.tone]}`}
                        style={{ width: `${staff.ratio * 100}%` }}
                    />
                </div>
            )}
        </div>
    );
}

function LiveDot() {
    return <span className="size-1.5 shrink-0 rounded-full bg-ember-500" aria-hidden="true" />;
}

// One event in a month cell: title, places filled, and a staffing bar.
function MonthChip({ event, day }: { event: CalendarEvent; day: Date }) {
    const staff = staffing(event);
    const text = describe(event, day);
    return (
        <Link
            to={eventLink(event)}
            aria-label={text}
            title={text}
            className={`relative flex items-center gap-1.5 overflow-hidden rounded-[6px] border px-1.5 pt-0.5 pb-1 text-xs transition-colors ${eventTone[event.status]}`}
        >
            {isLive(event) && <LiveDot />}
            <span
                className={`min-w-0 flex-1 truncate font-medium ${event.status === 'cancelled' ? 'line-through' : ''}`}
            >
                {event.title}
            </span>
            {isActive(event) && staff.short && (
                <span className="shrink-0 tabular-nums opacity-80">{staff.short}</span>
            )}
            <ChipBar event={event} />
        </Link>
    );
}

function MonthGrid({
    days,
    anchor,
    events,
    loading,
    onOpenDay,
}: {
    days: Date[];
    anchor: Date;
    events: CalendarEvent[];
    loading: boolean;
    onOpenDay: (day: Date) => void;
}) {
    const today = startOfDay(new Date());
    return (
        <div className="overflow-hidden rounded-card bg-white ring-1 ring-stone-200">
            <div className="grid grid-cols-7 border-b border-stone-200">
                {WEEKDAYS.map((name) => (
                    <div
                        key={name}
                        className="px-3 py-2 text-xs font-semibold tracking-wide text-stone-500 uppercase"
                    >
                        {name}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-stone-200">
                {days.map((day, index) => {
                    const inMonth = day.getMonth() === anchor.getMonth();
                    const isToday = sameDay(day, today);
                    const onDay = events.filter((event) => touchesDay(event, day));
                    const shown = onDay.slice(0, MONTH_CELL_LIMIT);
                    const hidden = onDay.length - shown.length;
                    return (
                        <div
                            key={day.toISOString()}
                            className={`min-h-32 p-1.5 ${inMonth ? 'bg-white' : 'bg-stone-50'}`}
                        >
                            <button
                                type="button"
                                onClick={() => onOpenDay(day)}
                                aria-label={`Open ${longDay.format(day)}${onDay.length ? `, ${onDay.length} ${onDay.length === 1 ? 'event' : 'events'}` : ''}`}
                                aria-current={isToday ? 'date' : undefined}
                                className={`mb-1 flex size-7 items-center justify-center rounded-full text-sm tabular-nums transition-colors ${
                                    isToday
                                        ? 'bg-maroon-700 font-semibold text-white hover:bg-maroon-800'
                                        : inMonth
                                          ? 'font-medium text-stone-800 hover:bg-stone-100'
                                          : 'text-stone-500 hover:bg-stone-100'
                                }`}
                            >
                                {day.getDate()}
                            </button>
                            {loading ? (
                                index % 3 === 1 && (
                                    <div
                                        className="h-5 animate-pulse rounded-[6px] bg-stone-200"
                                        aria-hidden="true"
                                    />
                                )
                            ) : (
                                <ul className="space-y-1">
                                    {shown.map((event) => (
                                        <li key={event.id}>
                                            <MonthChip event={event} day={day} />
                                        </li>
                                    ))}
                                    {hidden > 0 && (
                                        <li>
                                            <button
                                                type="button"
                                                onClick={() => onOpenDay(day)}
                                                className="rounded px-1.5 text-xs font-semibold text-stone-600 transition-colors hover:text-maroon-700"
                                            >
                                                {hidden} more
                                            </button>
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Phones: a compact month with dots. The chosen day is listed under it.
function MonthDots({
    days,
    anchor,
    events,
    onPick,
}: {
    days: Date[];
    anchor: Date;
    events: CalendarEvent[];
    onPick: (day: Date) => void;
}) {
    const today = startOfDay(new Date());
    return (
        <div className="rounded-card bg-white p-2 ring-1 ring-stone-200">
            <div className="grid grid-cols-7" aria-hidden="true">
                {WEEKDAYS.map((name) => (
                    <div
                        key={name}
                        className="py-1 text-center text-xs font-semibold text-stone-500"
                    >
                        {name.slice(0, 1)}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7">
                {days.map((day) => {
                    const inMonth = day.getMonth() === anchor.getMonth();
                    const isToday = sameDay(day, today);
                    const picked = sameDay(day, anchor);
                    const onDay = events.filter((event) => touchesDay(event, day));
                    return (
                        <button
                            key={day.toISOString()}
                            type="button"
                            onClick={() => onPick(day)}
                            aria-pressed={picked}
                            aria-current={isToday ? 'date' : undefined}
                            aria-label={`${longDay.format(day)}, ${onDay.length === 0 ? 'no events' : `${onDay.length} ${onDay.length === 1 ? 'event' : 'events'}`}`}
                            className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-control"
                        >
                            <span
                                className={`flex size-8 items-center justify-center rounded-full text-sm tabular-nums transition-colors ${
                                    picked
                                        ? 'bg-maroon-700 font-semibold text-white'
                                        : isToday
                                          ? 'font-bold text-maroon-700 ring-1 ring-maroon-700'
                                          : inMonth
                                            ? 'text-stone-800'
                                            : 'text-stone-500'
                                }`}
                            >
                                {day.getDate()}
                            </span>
                            <span className="flex h-1.5 gap-0.5" aria-hidden="true">
                                {onDay.slice(0, 3).map((event) => (
                                    <span
                                        key={event.id}
                                        className={`size-1.5 rounded-full ${dotTone[event.status]}`}
                                    />
                                ))}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// A card in a week column.
function WeekCard({ event, day }: { event: CalendarEvent; day: Date }) {
    const text = describe(event, day);
    return (
        <Link
            to={eventLink(event)}
            aria-label={text}
            title={text}
            className={`block rounded-control border p-2 transition-colors ${eventTone[event.status]}`}
        >
            <p className="flex flex-wrap items-center gap-x-1.5 text-xs tabular-nums opacity-90">
                {isLive(event) && <LiveDot />}
                {splitTime(timeOnDay(event, day)).map((part, i) => (
                    <span
                        key={part}
                        className={`whitespace-nowrap ${i === 0 ? 'font-semibold' : ''}`}
                    >
                        {part}
                    </span>
                ))}
            </p>
            <p
                className={`mt-0.5 line-clamp-2 text-sm font-semibold ${event.status === 'cancelled' ? 'line-through' : ''}`}
            >
                {event.title}
            </p>
            {event.status !== 'published' && (
                <p className="mt-0.5 text-xs">{statuses[event.status].label}</p>
            )}
            {isActive(event) && (
                <div className="mt-2">
                    <StaffMeter event={event} compact />
                </div>
            )}
        </Link>
    );
}

function WeekColumns({
    days,
    events,
    loading,
    onOpenDay,
}: {
    days: Date[];
    events: CalendarEvent[];
    loading: boolean;
    onOpenDay: (day: Date) => void;
}) {
    const today = startOfDay(new Date());
    return (
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-card bg-stone-200 ring-1 ring-stone-200">
            {days.map((day, index) => {
                const isToday = sameDay(day, today);
                const onDay = events.filter((event) => touchesDay(event, day));
                return (
                    <div key={day.toISOString()} className="flex min-h-96 flex-col bg-white">
                        <button
                            type="button"
                            onClick={() => onOpenDay(day)}
                            aria-label={`Open ${longDay.format(day)}`}
                            aria-current={isToday ? 'date' : undefined}
                            className="flex items-center gap-2 border-b border-stone-200 px-3 py-2 text-left transition-colors hover:bg-stone-50"
                        >
                            <span className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
                                {WEEKDAYS[day.getDay()]}
                            </span>
                            <span
                                className={`flex size-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums ${isToday ? 'bg-maroon-700 text-white' : 'text-stone-900'}`}
                            >
                                {day.getDate()}
                            </span>
                        </button>
                        <div className="flex-1 space-y-1.5 p-1.5">
                            {loading ? (
                                index % 2 === 0 && (
                                    <div
                                        className="h-20 animate-pulse rounded-control bg-stone-200"
                                        aria-hidden="true"
                                    />
                                )
                            ) : onDay.length === 0 ? (
                                <p className="px-1.5 py-1 text-xs text-stone-500">No events</p>
                            ) : (
                                onDay.map((event) => (
                                    <WeekCard key={event.id} event={event} day={day} />
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// The full row for one event on one day. Used by the day view and on phones.
function AgendaRow({ event, day }: { event: CalendarEvent; day: Date }) {
    const live = isLive(event);
    const active = isActive(event);
    const status = statuses[event.status];
    const [from, to = ''] = splitTime(timeOnDay(event, day));
    return (
        <li className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-stone-50 lg:flex-row lg:items-center lg:gap-6">
            <div className="flex shrink-0 gap-1.5 text-sm tabular-nums lg:w-24 lg:flex-col lg:gap-0">
                <p className={`font-semibold ${active ? 'text-stone-900' : 'text-stone-600'}`}>
                    {from}
                </p>
                {to && <p className="text-stone-500">{to}</p>}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        to={eventLink(event)}
                        className={`rounded-sm font-semibold underline-offset-2 transition-colors hover:text-maroon-700 hover:underline ${active ? 'text-stone-900' : 'text-stone-600'} ${event.status === 'cancelled' ? 'line-through' : ''}`}
                    >
                        {event.title}
                    </Link>
                    {live && (
                        <span
                            className={`${chipClass} gap-1.5 bg-ember-50 text-ember-700 ring-ember-200`}
                        >
                            <LiveDot />
                            Happening now
                        </span>
                    )}
                    {event.status !== 'published' && (
                        <span className={`${chipClass} ${status.chip}`}>{status.label}</span>
                    )}
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-stone-600">
                    <span>{event.event_type.label}</span>
                    <span aria-hidden="true" className="text-stone-400">
                        ·
                    </span>
                    <PinIcon className="size-4 shrink-0 text-stone-500" />
                    <span className="truncate">{event.location ?? 'No location set'}</span>
                </p>
            </div>
            <div className="flex items-center justify-between gap-4 lg:justify-end">
                <div className="w-40">
                    <StaffMeter event={event} />
                </div>
                {active ? (
                    <Link
                        to={eventLink(event)}
                        aria-label={`Configure duties and people for ${event.title}`}
                        className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-control border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 transition-colors hover:border-maroon-700 hover:bg-maroon-50 hover:text-maroon-800"
                    >
                        <SlidersIcon className="size-4" />
                        Configure
                    </Link>
                ) : (
                    <Link
                        to={eventLink(event)}
                        aria-label={`View ${event.title}`}
                        className="inline-flex min-h-10 shrink-0 items-center rounded-control px-3 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
                    >
                        View
                    </Link>
                )}
            </div>
        </li>
    );
}

function Agenda({
    day,
    events,
    loading,
    heading,
}: {
    day: Date;
    events: CalendarEvent[];
    loading: boolean;
    heading?: string;
}) {
    const onDay = events.filter((event) => touchesDay(event, day));
    return (
        <section className="overflow-hidden rounded-card bg-white ring-1 ring-stone-200">
            {heading && (
                <h3 className="border-b border-stone-200 px-5 py-3 text-sm font-semibold text-stone-900">
                    {heading}
                </h3>
            )}
            {loading ? (
                <div className="space-y-4 p-5" aria-hidden="true">
                    {[0, 1].map((row) => (
                        <div key={row} className="flex gap-6">
                            <div className="h-4 w-16 animate-pulse rounded bg-stone-200" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-48 animate-pulse rounded bg-stone-200" />
                                <div className="h-3 w-32 animate-pulse rounded bg-stone-200" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : onDay.length === 0 ? (
                <div className="flex items-center gap-3 px-5 py-6 text-sm text-stone-600">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-control border border-stone-200 text-stone-500">
                        <CalendarIcon className="size-5" />
                    </span>
                    No events on this day.
                </div>
            ) : (
                <ul className="divide-y divide-stone-100">
                    {onDay.map((event) => (
                        <AgendaRow key={event.id} event={event} day={day} />
                    ))}
                </ul>
            )}
        </section>
    );
}

function Legend() {
    const swatch = 'inline-block h-3 w-5 rounded-[3px] border';
    const bar = 'inline-block h-1 w-5 rounded-full';
    return (
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone-600">
            <span className="flex items-center gap-1.5">
                <span className={`${swatch} border-maroon-100 bg-maroon-50`} aria-hidden="true" />
                Published
            </span>
            <span className="flex items-center gap-1.5">
                <span
                    className={`${swatch} border-dashed border-stone-400 bg-white`}
                    aria-hidden="true"
                />
                Draft
            </span>
            <span className="flex items-center gap-1.5">
                <span className={`${swatch} border-stone-200 bg-stone-100`} aria-hidden="true" />
                Completed
            </span>
            <span className="flex items-center gap-1.5">
                <span className="text-stone-500 line-through" aria-hidden="true">
                    Abc
                </span>
                Cancelled
            </span>
            <span className="hidden h-3 w-px bg-stone-300 sm:block" aria-hidden="true" />
            <span className="flex items-center gap-1.5">
                <span className={`${bar} bg-green-600`} aria-hidden="true" />
                Fully staffed
            </span>
            <span className="flex items-center gap-1.5">
                <span className={`${bar} bg-amber-500`} aria-hidden="true" />
                Needs people
            </span>
            <span className="flex items-center gap-1.5">
                <LiveDot />
                Happening now
            </span>
        </div>
    );
}

const filterSelect =
    'min-h-10 cursor-pointer appearance-none rounded-control border border-stone-300 bg-white pr-9 pl-3 text-sm text-stone-900 transition-colors hover:border-stone-400 focus:border-maroon-700 focus:ring-3 focus:ring-maroon-700/15 focus:outline-none';

function FilterSelect({
    label,
    value,
    onChange,
    children,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    children: ReactNode;
}) {
    return (
        <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
            {label}
            <span className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={filterSelect}
                >
                    {children}
                </select>
                <ChevronIcon className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-stone-500" />
            </span>
        </label>
    );
}

export function Calendar() {
    const [params, setParams] = useSearchParams();
    const view: CalendarView =
        calendarViews.find((v) => v.id === params.get('view'))?.id ?? 'month';
    const anchor = parseDayKey(params.get('date')) ?? startOfDay(new Date());
    const filters: CalendarFilters = {
        status: params.get('status') ?? '',
        type: params.get('type') ?? '',
        needsPeople: params.get('need') === '1',
    };
    const filtering = Boolean(filters.status || filters.type || filters.needsPeople);

    const update = (patch: Record<string, string | null>) =>
        setParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                for (const [key, value] of Object.entries(patch)) {
                    if (value) next.set(key, value);
                    else next.delete(key);
                }
                return next;
            },
            { replace: true },
        );

    const days = visibleDays(view, anchor);
    // On phones the month grid is compact and the week is a list, so both fetch the same range.
    const from = days[0];
    const to = addDays(days[days.length - 1], 1);

    const calendar = useQuery({
        queryKey: ['calendar', from.toISOString(), to.toISOString()],
        queryFn: () => getCalendar(from.toISOString(), to.toISOString()),
        placeholderData: keepPreviousData,
    });
    const lookups = useQuery({ queryKey: ['event-lookups'], queryFn: getLookups });

    const events = (calendar.data ?? []).filter((event) => matchesFilters(event, filters));
    const inRange = events.filter((event) => days.some((day) => touchesDay(event, day)));
    const loading = calendar.isPending;

    const openDay = (day: Date) => update({ view: 'day', date: dayKey(day) });
    const unit = view === 'month' ? 'month' : view === 'week' ? 'week' : 'day';
    const label = rangeLabel(view, anchor);

    return (
        <div className="mx-auto max-w-[1440px]">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="brand-stripe h-1 w-12 rounded-full" aria-hidden="true" />
                    <h1 className="mt-4 text-2xl font-semibold tracking-tight text-stone-900">
                        Calendar
                    </h1>
                    <p className="mt-1 text-pretty text-stone-600">
                        Every event by day, with how many places are filled.
                    </p>
                </div>
                <Link
                    to="/admin/events/new"
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-control bg-maroon-700 pr-4 pl-3 text-sm font-semibold text-white transition-colors hover:bg-maroon-800 active:bg-maroon-900"
                >
                    <PlusIcon />
                    New event
                </Link>
            </header>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Button size="md" variant="secondary" onClick={() => update({ date: null })}>
                        Today
                    </Button>
                    <div className="flex">
                        <button
                            type="button"
                            onClick={() => update({ date: dayKey(shiftAnchor(view, anchor, -1)) })}
                            aria-label={`Previous ${unit}`}
                            className="flex size-10 items-center justify-center rounded-control text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-900"
                        >
                            <ChevronIcon className="size-5 rotate-90" />
                        </button>
                        <button
                            type="button"
                            onClick={() => update({ date: dayKey(shiftAnchor(view, anchor, 1)) })}
                            aria-label={`Next ${unit}`}
                            className="flex size-10 items-center justify-center rounded-control text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-900"
                        >
                            <ChevronIcon className="size-5 -rotate-90" />
                        </button>
                    </div>
                    <h2
                        className="text-lg font-semibold text-stone-900 tabular-nums"
                        aria-live="polite"
                    >
                        {label}
                    </h2>
                </div>
                <div
                    className="inline-flex rounded-control bg-stone-100 p-1"
                    role="group"
                    aria-label="Calendar view"
                >
                    {calendarViews.map((v) => {
                        const selected = v.id === view;
                        return (
                            <button
                                key={v.id}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => update({ view: v.id === 'month' ? null : v.id })}
                                className={`inline-flex min-h-9 items-center rounded-[6px] px-3.5 text-sm font-semibold transition-colors ${selected ? 'bg-white text-stone-900 ring-1 ring-stone-200' : 'text-stone-600 hover:text-stone-900'}`}
                            >
                                {v.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-stone-200 pt-4">
                <FilterSelect
                    label="Status"
                    value={filters.status}
                    onChange={(value) => update({ status: value })}
                >
                    <option value="">All</option>
                    {(Object.keys(statuses) as CalendarEvent['status'][]).map((key) => (
                        <option key={key} value={key}>
                            {statuses[key].label}
                        </option>
                    ))}
                </FilterSelect>
                <FilterSelect
                    label="Type"
                    value={filters.type}
                    onChange={(value) => update({ type: value })}
                >
                    <option value="">All</option>
                    {(lookups.data?.event_types ?? []).map((type) => (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                    ))}
                </FilterSelect>
                <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-medium text-stone-700">
                    <input
                        type="checkbox"
                        checked={filters.needsPeople}
                        onChange={(e) => update({ need: e.target.checked ? '1' : null })}
                        className="size-4 cursor-pointer rounded border-stone-300 accent-maroon-700"
                    />
                    Needs people only
                </label>
                {filtering && (
                    <button
                        type="button"
                        onClick={() => update({ status: null, type: null, need: null })}
                        className="min-h-10 rounded-control px-2 text-sm font-semibold text-maroon-700 transition-colors hover:bg-maroon-50"
                    >
                        Clear filters
                    </button>
                )}
                <p className="text-sm text-stone-600 tabular-nums sm:ml-auto" aria-live="polite">
                    {loading
                        ? 'Loading events...'
                        : inRange.length === 0
                          ? filtering
                              ? `No events match these filters this ${unit}.`
                              : `No events this ${unit}.`
                          : `${inRange.length} ${inRange.length === 1 ? 'event' : 'events'} this ${unit}`}
                </p>
            </div>

            {calendar.isError && (
                <div className="mt-4 flex max-w-xl flex-wrap items-start gap-3">
                    <div className="flex-1">
                        <Alert tone="error">
                            The calendar did not load. Check your connection and try again.
                        </Alert>
                    </div>
                    <Button
                        variant="secondary"
                        size="md"
                        loading={calendar.isFetching}
                        onClick={() => void calendar.refetch()}
                    >
                        {calendar.isFetching ? 'Retrying...' : 'Retry'}
                    </Button>
                </div>
            )}

            <div className="mt-4" aria-busy={loading || undefined}>
                {view === 'month' && (
                    <>
                        <div className="hidden md:block">
                            <MonthGrid
                                days={days}
                                anchor={anchor}
                                events={events}
                                loading={loading}
                                onOpenDay={openDay}
                            />
                        </div>
                        <div className="space-y-4 md:hidden">
                            <MonthDots
                                days={days}
                                anchor={anchor}
                                events={events}
                                onPick={(day) => update({ date: dayKey(day) })}
                            />
                            <Agenda
                                day={anchor}
                                events={events}
                                loading={loading}
                                heading={longDay.format(anchor)}
                            />
                        </div>
                    </>
                )}
                {view === 'week' && (
                    <>
                        <div className="hidden md:block">
                            <WeekColumns
                                days={days}
                                events={events}
                                loading={loading}
                                onOpenDay={openDay}
                            />
                        </div>
                        <div className="space-y-3 md:hidden">
                            {days.map((day) => (
                                <Agenda
                                    key={day.toISOString()}
                                    day={day}
                                    events={events}
                                    loading={loading}
                                    heading={`${shortDay.format(day)}${sameDay(day, new Date()) ? ', today' : ''}`}
                                />
                            ))}
                        </div>
                    </>
                )}
                {view === 'day' && <Agenda day={anchor} events={events} loading={loading} />}
            </div>

            <Legend />
        </div>
    );
}
