// A-Calendar. Month, week and day views of every event, with how many places are filled.
// View, day and filters live in the address bar, so a link opens the same page.
// Desktop first. Under 768 px the month becomes a compact grid with the chosen day listed below it,
// and the week becomes a list of days.
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
    needsPeople,
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

const longDay = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
});

const isActive = (event: CalendarEvent) => event.status === 'draft' || event.status === 'published';

// Every event block has a 3 px accent on its left. Published is a maroon tint, draft a dashed
// outline, completed gray and cancelled struck out, so the four still read apart in grayscale.
const blockTone: Record<CalendarEvent['status'], string> = {
    published: 'border-transparent bg-maroon-50 text-maroon-950 hover:bg-maroon-100',
    draft: 'border-dashed border-stone-300 bg-white text-stone-800 hover:bg-stone-50',
    completed: 'border-transparent bg-stone-100 text-stone-600 hover:bg-stone-200/70',
    cancelled: 'border-transparent bg-transparent text-stone-500 hover:bg-stone-100',
};

const accentTone: Record<CalendarEvent['status'], string> = {
    published: 'bg-maroon-700',
    draft: 'bg-stone-400',
    completed: 'bg-stone-400',
    cancelled: 'bg-stone-300',
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

const countTone = {
    full: 'text-green-700',
    short: 'text-amber-800',
    closed: 'text-stone-500',
    unset: 'text-stone-500',
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

function plural(count: number, word: string) {
    return `${count} ${count === 1 ? word : `${word}s`}`;
}

function Accent({ event }: { event: CalendarEvent }) {
    return (
        <span
            className={`w-[3px] shrink-0 self-stretch rounded-full ${accentTone[event.status]}`}
            aria-hidden="true"
        />
    );
}

function LiveDot() {
    return <span className="size-1.5 shrink-0 rounded-full bg-ember-500" aria-hidden="true" />;
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
                    className={`mt-1 overflow-hidden rounded-full bg-stone-900/10 ${compact ? 'h-1' : 'h-1.5'}`}
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

// One event in a month cell: the title, then the start time and places filled.
function MonthChip({ event, day }: { event: CalendarEvent; day: Date }) {
    const staff = staffing(event);
    const time = splitTime(timeOnDay(event, day, true))[0];
    const text = describe(event, day);
    return (
        <Link
            to={eventLink(event)}
            aria-label={text}
            title={text}
            className={`flex gap-1.5 rounded-[5px] border py-1 pr-1.5 pl-1 text-xs leading-4 transition-colors ${blockTone[event.status]}`}
        >
            <Accent event={event} />
            <span className="min-w-0 flex-1">
                <span
                    className={`block truncate font-semibold ${event.status === 'cancelled' ? 'line-through' : ''}`}
                >
                    {event.title}
                </span>
                <span className="mt-px flex items-center gap-1.5">
                    {isLive(event) && <LiveDot />}
                    <span className="min-w-0 flex-1 truncate tabular-nums opacity-75">{time}</span>
                    {isActive(event) && staff.short && (
                        <span
                            className={`shrink-0 font-semibold tabular-nums ${countTone[staff.tone]}`}
                        >
                            {staff.short}
                        </span>
                    )}
                </span>
            </span>
        </Link>
    );
}

function DayNumber({
    day,
    muted,
    onOpen,
    count,
}: {
    day: Date;
    muted: boolean;
    onOpen: () => void;
    count: number;
}) {
    const isToday = sameDay(day, new Date());
    return (
        <button
            type="button"
            onClick={onOpen}
            aria-label={`Open ${longDay.format(day)}${count ? `, ${plural(count, 'event')}` : ''}`}
            aria-current={isToday ? 'date' : undefined}
            className={`flex size-7 items-center justify-center rounded-full text-sm transition-colors ${
                isToday
                    ? 'bg-maroon-700 font-semibold text-white hover:bg-maroon-800'
                    : muted
                      ? 'text-stone-500 hover:bg-stone-100'
                      : 'font-medium text-stone-800 hover:bg-stone-100'
            }`}
        >
            {day.getDate()}
        </button>
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
    return (
        <>
            <div className="grid grid-cols-7 border-b border-stone-200" aria-hidden="true">
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
                    const onDay = events.filter((event) => touchesDay(event, day));
                    const shown = onDay.slice(0, MONTH_CELL_LIMIT);
                    const hidden = onDay.length - shown.length;
                    return (
                        <div
                            key={day.toISOString()}
                            className={`min-h-36 p-1.5 ${inMonth ? 'bg-white' : 'bg-stone-50'}`}
                        >
                            <DayNumber
                                day={day}
                                muted={!inMonth}
                                count={onDay.length}
                                onOpen={() => onOpenDay(day)}
                            />
                            {loading ? (
                                index % 3 === 1 && (
                                    <div
                                        className="mt-1 h-5 animate-pulse rounded-[5px] bg-stone-200"
                                        aria-hidden="true"
                                    />
                                )
                            ) : (
                                <ul className="mt-1 space-y-[3px]">
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
                                                className="rounded px-1.5 py-0.5 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-100 hover:text-maroon-700"
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
        </>
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
        <div className="p-2">
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
                            aria-label={`${longDay.format(day)}, ${onDay.length === 0 ? 'no events' : plural(onDay.length, 'event')}`}
                            className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-control"
                        >
                            <span
                                className={`flex size-8 items-center justify-center rounded-full text-sm transition-colors ${
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

// A block in a week column.
function WeekCard({ event, day }: { event: CalendarEvent; day: Date }) {
    const text = describe(event, day);
    return (
        <Link
            to={eventLink(event)}
            aria-label={text}
            title={text}
            className={`flex gap-2 rounded-[6px] border py-1.5 pr-2 pl-1.5 transition-colors ${blockTone[event.status]}`}
        >
            <Accent event={event} />
            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-xs tabular-nums opacity-75">
                    {isLive(event) && <LiveDot />}
                    {timeOnDay(event, day, true)}
                </span>
                <span
                    className={`mt-0.5 line-clamp-2 text-sm leading-5 font-semibold ${event.status === 'cancelled' ? 'line-through' : ''}`}
                >
                    {event.title}
                </span>
                {event.location && (
                    <span className="mt-0.5 block truncate text-xs opacity-75">
                        {event.location}
                    </span>
                )}
                {event.status !== 'published' && (
                    <span className="mt-0.5 block text-xs font-medium">
                        {statuses[event.status].label}
                    </span>
                )}
                {isActive(event) && (
                    <span className="mt-2 block">
                        <StaffMeter event={event} compact />
                    </span>
                )}
            </span>
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
    return (
        <div className="grid grid-cols-7 gap-px bg-stone-200">
            {days.map((day, index) => {
                const isToday = sameDay(day, new Date());
                const onDay = events.filter((event) => touchesDay(event, day));
                return (
                    <div key={day.toISOString()} className="flex min-h-[26rem] flex-col bg-white">
                        <button
                            type="button"
                            onClick={() => onOpenDay(day)}
                            aria-label={`Open ${longDay.format(day)}${onDay.length ? `, ${plural(onDay.length, 'event')}` : ''}`}
                            aria-current={isToday ? 'date' : undefined}
                            className="flex flex-col items-center gap-0.5 border-b border-stone-200 bg-white py-2 transition-colors hover:bg-stone-50"
                        >
                            <span
                                className={`text-xs font-semibold tracking-wide uppercase ${isToday ? 'text-maroon-700' : 'text-stone-500'}`}
                            >
                                {WEEKDAYS[day.getDay()]}
                            </span>
                            <span
                                className={`flex size-8 items-center justify-center rounded-full text-lg font-semibold ${isToday ? 'bg-maroon-700 text-white' : 'text-stone-900'}`}
                            >
                                {day.getDate()}
                            </span>
                        </button>
                        <div
                            className={`flex-1 space-y-1.5 p-1.5 ${isToday ? 'bg-maroon-50/50' : ''}`}
                        >
                            {loading
                                ? index % 2 === 0 && (
                                      <div
                                          className="h-20 animate-pulse rounded-[6px] bg-stone-200"
                                          aria-hidden="true"
                                      />
                                  )
                                : onDay.map((event) => (
                                      <WeekCard key={event.id} event={event} day={day} />
                                  ))}
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
        <li className="relative flex flex-col gap-3 py-4 pr-4 pl-5 transition-colors hover:bg-stone-50 sm:pr-5 lg:flex-row lg:items-center lg:gap-6">
            <span
                className={`absolute inset-y-4 left-0 w-[3px] rounded-r-full ${accentTone[event.status]}`}
                aria-hidden="true"
            />
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
                <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-sm text-stone-600">
                    <span className="shrink-0">{event.event_type.label}</span>
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

function AgendaSkeleton() {
    return (
        <div className="space-y-5 px-5 py-5" aria-hidden="true">
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
    );
}

// The events of one day as rows, or a quiet empty line.
function DayList({
    day,
    events,
    loading,
}: {
    day: Date;
    events: CalendarEvent[];
    loading: boolean;
}) {
    if (loading) return <AgendaSkeleton />;
    const onDay = events.filter((event) => touchesDay(event, day));
    if (onDay.length === 0) {
        return (
            <div className="flex flex-col items-center px-6 py-14 text-center">
                <span className="flex size-11 items-center justify-center rounded-control border border-stone-200 text-stone-500">
                    <CalendarIcon className="size-5" />
                </span>
                <p className="mt-3 text-sm font-medium text-stone-800">No events on this day</p>
                <p className="mt-0.5 text-sm text-stone-600">
                    Pick another day, or add a new event.
                </p>
            </div>
        );
    }
    return (
        <ul className="divide-y divide-stone-100">
            {onDay.map((event) => (
                <AgendaRow key={event.id} event={event} day={day} />
            ))}
        </ul>
    );
}

// Phones: the week as a list. Empty days collapse to one line.
function WeekList({
    days,
    events,
    loading,
}: {
    days: Date[];
    events: CalendarEvent[];
    loading: boolean;
}) {
    if (loading) return <AgendaSkeleton />;
    return (
        <div className="divide-y divide-stone-200">
            {days.map((day) => {
                const isToday = sameDay(day, new Date());
                const onDay = events.filter((event) => touchesDay(event, day));
                return (
                    <section key={day.toISOString()} aria-label={longDay.format(day)}>
                        <div
                            className={`flex items-center justify-between gap-3 px-4 py-2.5 ${onDay.length ? 'bg-stone-50' : ''}`}
                        >
                            <p className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                                <span
                                    className={`flex size-7 items-center justify-center rounded-full ${isToday ? 'bg-maroon-700 text-white' : ''}`}
                                >
                                    {day.getDate()}
                                </span>
                                {WEEKDAYS[day.getDay()]}
                                {isToday && (
                                    <span className="text-xs font-semibold text-maroon-700">
                                        Today
                                    </span>
                                )}
                            </p>
                            {onDay.length === 0 && (
                                <p className="text-sm text-stone-500">No events</p>
                            )}
                        </div>
                        {onDay.length > 0 && (
                            <ul className="divide-y divide-stone-100 border-t border-stone-100">
                                {onDay.map((event) => (
                                    <AgendaRow key={event.id} event={event} day={day} />
                                ))}
                            </ul>
                        )}
                    </section>
                );
            })}
        </div>
    );
}

function LegendItem({ children, label }: { children: ReactNode; label: string }) {
    return (
        <span className="flex items-center gap-1.5">
            {children}
            {label}
        </span>
    );
}

function Legend() {
    const block = 'flex h-3.5 w-6 items-stretch rounded-[3px] border p-px';
    const accent = 'w-[3px] rounded-full';
    const bar = 'inline-block h-1 w-5 rounded-full';
    return (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-stone-200 bg-stone-50/60 px-4 py-3 text-xs text-stone-600">
            <LegendItem label="Published">
                <span className={`${block} border-transparent bg-maroon-50`} aria-hidden="true">
                    <span className={`${accent} bg-maroon-700`} />
                </span>
            </LegendItem>
            <LegendItem label="Draft">
                <span
                    className={`${block} border-dashed border-stone-400 bg-white`}
                    aria-hidden="true"
                >
                    <span className={`${accent} bg-stone-400`} />
                </span>
            </LegendItem>
            <LegendItem label="Completed">
                <span className={`${block} border-transparent bg-stone-200`} aria-hidden="true">
                    <span className={`${accent} bg-stone-400`} />
                </span>
            </LegendItem>
            <LegendItem label="Cancelled">
                <span className="font-medium text-stone-500 line-through" aria-hidden="true">
                    Abc
                </span>
            </LegendItem>
            <span className="hidden h-3 w-px bg-stone-300 sm:block" aria-hidden="true" />
            <LegendItem label="Fully staffed">
                <span className={`${bar} bg-green-600`} aria-hidden="true" />
            </LegendItem>
            <LegendItem label="Needs people">
                <span className={`${bar} bg-amber-500`} aria-hidden="true" />
            </LegendItem>
            <LegendItem label="Happening now">
                <LiveDot />
            </LegendItem>
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

const navButton =
    'flex size-10 items-center justify-center text-stone-700 transition-colors hover:bg-stone-50 hover:text-stone-900 active:bg-stone-100';

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
    const short = inRange.filter(needsPeople).length;
    const loading = calendar.isPending;

    const openDay = (day: Date) => update({ view: 'day', date: dayKey(day) });
    const unit = view;
    const label = rangeLabel(view, anchor);
    const showsToday = days.some((day) => sameDay(day, new Date()));

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

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
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
                    {loading ? (
                        'Loading events...'
                    ) : inRange.length === 0 ? (
                        filtering ? (
                            `No events match these filters this ${unit}.`
                        ) : (
                            `No events this ${unit}.`
                        )
                    ) : (
                        <>
                            {plural(inRange.length, 'event')} this {unit}
                            {short > 0 && (
                                <>
                                    <span aria-hidden="true" className="px-1.5 text-stone-400">
                                        ·
                                    </span>
                                    <span className="font-medium text-amber-800">
                                        {short} {short === 1 ? 'needs' : 'need'} people
                                    </span>
                                </>
                            )}
                        </>
                    )}
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

            <section
                className="mt-4 overflow-hidden rounded-card bg-white ring-1 ring-stone-200"
                aria-busy={loading || undefined}
                aria-labelledby="calendar-range"
            >
                <div className="flex flex-wrap items-center gap-3 border-b border-stone-200 px-4 py-3">
                    <div className="flex overflow-hidden rounded-control border border-stone-300 bg-white">
                        <button
                            type="button"
                            onClick={() => update({ date: dayKey(shiftAnchor(view, anchor, -1)) })}
                            aria-label={`Previous ${unit}`}
                            className={navButton}
                        >
                            <ChevronIcon className="size-5 rotate-90" />
                        </button>
                        <button
                            type="button"
                            onClick={() => update({ date: null })}
                            disabled={showsToday && !params.get('date')}
                            className="border-x border-stone-300 px-3.5 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50 active:bg-stone-100 disabled:cursor-default disabled:text-stone-500 disabled:hover:bg-white"
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            onClick={() => update({ date: dayKey(shiftAnchor(view, anchor, 1)) })}
                            aria-label={`Next ${unit}`}
                            className={navButton}
                        >
                            <ChevronIcon className="size-5 -rotate-90" />
                        </button>
                    </div>
                    <h2
                        id="calendar-range"
                        className="order-first basis-full text-lg font-semibold tracking-tight text-stone-900 md:order-none md:basis-auto"
                        aria-live="polite"
                    >
                        {label}
                        {calendar.isFetching && !loading && (
                            <span className="sr-only">, loading</span>
                        )}
                    </h2>
                    <div
                        className="flex w-full rounded-control bg-stone-100 p-1 sm:ml-auto sm:inline-flex sm:w-auto"
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
                                    className={`inline-flex min-h-8 flex-1 items-center justify-center rounded-[6px] px-3.5 text-sm sm:flex-none font-semibold transition-colors ${selected ? 'bg-white text-stone-900 ring-1 ring-stone-200' : 'text-stone-600 hover:text-stone-900'}`}
                                >
                                    {v.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div
                    className={`transition-opacity duration-150 ${calendar.isFetching && !loading ? 'opacity-60' : ''}`}
                >
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
                            <div className="md:hidden">
                                <MonthDots
                                    days={days}
                                    anchor={anchor}
                                    events={events}
                                    onPick={(day) => update({ date: dayKey(day) })}
                                />
                                <div className="border-t border-stone-200">
                                    <h3 className="px-4 pt-3 text-sm font-semibold text-stone-900">
                                        {longDay.format(anchor)}
                                    </h3>
                                    <DayList day={anchor} events={events} loading={loading} />
                                </div>
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
                            <div className="md:hidden">
                                <WeekList days={days} events={events} loading={loading} />
                            </div>
                        </>
                    )}
                    {view === 'day' && <DayList day={anchor} events={events} loading={loading} />}
                </div>

                <Legend />
            </section>
        </div>
    );
}
