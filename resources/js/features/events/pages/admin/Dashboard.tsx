// A-Dashboard (S3.7). Today at a glance: counts on top, today's events on the left,
// and the two people lists that need follow up on the right. Refreshes every minute.
import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import {
    getDashboard,
    type Dashboard as DashboardData,
    type DashboardRow,
} from '@/features/events/api';
import {
    CalendarIcon,
    CheckIcon,
    ClockIcon,
    PeopleIcon,
    PinIcon,
} from '@/features/events/components/icons';
import { chipClass } from '@/features/events/format';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';

const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const day = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const longDay = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
});

function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    return (
        (parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '')
    ).toUpperCase();
}

// A shift today reads "8:00 AM". Another day reads "Nov 9, 8:00 AM".
function shiftStart(iso: string) {
    const date = new Date(iso);
    return date.toDateString() === new Date().toDateString()
        ? time.format(date)
        : `${day.format(date)}, ${time.format(date)}`;
}

function Stat({
    label,
    value,
    note,
    urgent = false,
}: {
    label: string;
    value: number;
    note: string;
    urgent?: boolean;
}) {
    return (
        <div className="px-6 py-5">
            <dt className="text-sm font-medium text-stone-600">{label}</dt>
            <dd
                className={`mt-1 text-3xl font-semibold tracking-tight tabular-nums ${urgent ? 'text-ember-700' : 'text-stone-900'}`}
            >
                {value}
            </dd>
            <dd className="mt-0.5 text-sm text-stone-500">{note}</dd>
        </div>
    );
}

function Panel({
    id,
    title,
    intro,
    count,
    children,
}: {
    id: string;
    title: string;
    intro: string;
    count?: number;
    children: ReactNode;
}) {
    return (
        <section aria-labelledby={id} className="rounded-card bg-white ring-1 ring-stone-200">
            <header className="px-6 py-4">
                <h2
                    id={id}
                    className="flex items-baseline gap-2 text-lg font-semibold text-stone-900"
                >
                    {title}
                    {count !== undefined && (
                        <span className="text-sm font-normal text-stone-500 tabular-nums">
                            {count}
                        </span>
                    )}
                </h2>
                <p className="mt-0.5 text-sm text-stone-600">{intro}</p>
            </header>
            {children}
        </section>
    );
}

function AllClear({ icon, text }: { icon: ReactNode; text: string }) {
    return (
        <p className="flex items-center gap-3 border-t border-stone-200 px-6 py-5 text-sm text-stone-600">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-control border border-stone-200 text-green-700">
                {icon}
            </span>
            {text}
        </p>
    );
}

function PeopleRows({ rows, chip }: { rows: DashboardRow[]; chip: ReactNode }) {
    return (
        <ul className="divide-y divide-stone-100 border-t border-stone-200">
            {rows.map((row) => (
                <li key={row.id} className="flex items-center gap-3 px-6 py-3">
                    <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-maroon-50 text-sm font-semibold text-maroon-800"
                        aria-hidden="true"
                    >
                        {initials(row.person)}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-stone-900">{row.person}</p>
                        <Link
                            to={`/admin/events/${row.event.id}`}
                            className="block truncate text-sm text-maroon-700 hover:underline"
                        >
                            {row.event.title}
                        </Link>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                        {chip}
                        {row.starts_at && (
                            <p className="text-xs text-stone-500 tabular-nums">
                                Shift {shiftStart(row.starts_at)}
                            </p>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
}

function TodayEvents({ events, now }: { events: DashboardData['today_events']; now: number }) {
    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center border-t border-stone-200 px-6 py-12 text-center">
                <span className="flex size-11 items-center justify-center rounded-control border border-stone-200 text-maroon-700">
                    <CalendarIcon className="size-5" />
                </span>
                <p className="mt-3 font-medium text-stone-900">No published events today</p>
                <p className="mt-0.5 text-sm text-stone-600">
                    Drafts do not show here until you publish them.
                </p>
                <Link
                    to="/admin/events"
                    className="mt-3 text-sm font-semibold text-maroon-700 hover:underline"
                >
                    Go to events
                </Link>
            </div>
        );
    }

    return (
        <ul className="divide-y divide-stone-100 border-t border-stone-200">
            {events.map((event) => {
                const start = new Date(event.starts_at).getTime();
                const end = new Date(event.ends_at).getTime();
                const live = start <= now && now < end;
                const over = end <= now;
                return (
                    <li key={event.id}>
                        <Link
                            to={`/admin/events/${event.id}`}
                            className="group flex items-center gap-5 px-6 py-4 transition-colors hover:bg-stone-50"
                        >
                            <div className="w-20 shrink-0 text-sm tabular-nums">
                                <p className="font-semibold text-stone-900">
                                    {time.format(new Date(event.starts_at))}
                                </p>
                                <p className="text-stone-500">
                                    {time.format(new Date(event.ends_at))}
                                </p>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p
                                    className={`truncate font-semibold group-hover:text-maroon-700 ${over ? 'text-stone-500' : 'text-stone-900'}`}
                                >
                                    {event.title}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-stone-600">
                                    <PinIcon className="size-4 shrink-0 text-stone-500" />
                                    {event.location ?? 'No location set'}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-4">
                                {live && (
                                    <span
                                        className={`${chipClass} gap-1.5 bg-ember-50 text-ember-700 ring-ember-200`}
                                    >
                                        <span
                                            className="size-1.5 rounded-full bg-ember-500"
                                            aria-hidden="true"
                                        />
                                        Happening now
                                    </span>
                                )}
                                {over && (
                                    <span
                                        className={`${chipClass} bg-stone-100 text-stone-600 ring-stone-200`}
                                    >
                                        Ended
                                    </span>
                                )}
                                <p className="flex items-center gap-1.5 text-sm text-stone-600 tabular-nums">
                                    <PeopleIcon className="size-4 text-stone-500" />
                                    {event.people_count}
                                    <span className="sr-only">people assigned</span>
                                </p>
                            </div>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

function Skeleton() {
    return (
        <div aria-busy="true">
            <p role="status" className="sr-only">
                Loading the dashboard...
            </p>
            <div
                className="mt-8 grid grid-cols-3 divide-x divide-stone-200 rounded-card bg-white ring-1 ring-stone-200"
                aria-hidden="true"
            >
                {[0, 1, 2].map((cell) => (
                    <div key={cell} className="space-y-2 px-6 py-5">
                        <div className="h-4 w-28 animate-pulse rounded bg-stone-200" />
                        <div className="h-8 w-12 animate-pulse rounded bg-stone-200" />
                    </div>
                ))}
            </div>
            <div className="mt-6 grid items-start gap-6 lg:grid-cols-5" aria-hidden="true">
                {[3, 2].map((span) => (
                    <div
                        key={span}
                        className={`space-y-4 rounded-card bg-white p-6 ring-1 ring-stone-200 ${span === 3 ? 'lg:col-span-3' : 'lg:col-span-2'}`}
                    >
                        <div className="h-5 w-36 animate-pulse rounded bg-stone-200" />
                        <div className="h-10 animate-pulse rounded bg-stone-200" />
                        <div className="h-10 animate-pulse rounded bg-stone-200" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function Dashboard() {
    const data = useQuery({
        queryKey: ['dashboard'],
        queryFn: getDashboard,
        refetchInterval: 60_000,
    });
    const [today] = useState(() => new Date());
    // The time of the last refresh, so "Happening now" moves with the data.
    const now = data.dataUpdatedAt;
    const late = data.data?.not_on_duty ?? [];
    const waiting = data.data?.unacknowledged ?? [];

    return (
        <div className="mx-auto max-w-[1440px]">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="brand-stripe h-1 w-12 rounded-full" aria-hidden="true" />
                    <h1 className="mt-4 text-2xl font-semibold tracking-tight text-stone-900">
                        Dashboard
                    </h1>
                    <p className="mt-1 text-stone-600">{longDay.format(today)}</p>
                </div>
                {data.isSuccess && (
                    <p className="text-sm text-stone-500 tabular-nums" aria-live="polite">
                        Updated {time.format(new Date(now))}. Refreshes every minute.
                    </p>
                )}
            </header>

            {data.isPending && <Skeleton />}

            {data.isError && (
                <div className="mt-8 max-w-xl space-y-3">
                    <Alert tone="error">
                        The dashboard did not load. Check your connection and try again.
                    </Alert>
                    <Button
                        variant="secondary"
                        size="md"
                        loading={data.isFetching}
                        onClick={() => void data.refetch()}
                    >
                        {data.isFetching ? 'Retrying...' : 'Retry'}
                    </Button>
                </div>
            )}

            {data.data && (
                <>
                    <dl className="mt-8 grid divide-y divide-stone-200 rounded-card bg-white ring-1 ring-stone-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <Stat
                            label="Events today"
                            value={data.data.today_events.length}
                            note="Published events only"
                        />
                        <Stat
                            label="Late to start"
                            value={late.length}
                            note="30 minutes past shift start"
                            urgent={late.length > 0}
                        />
                        <Stat
                            label="Not acknowledged"
                            value={waiting.length}
                            note="Assigned but not confirmed"
                        />
                    </dl>

                    <div className="mt-6 grid items-start gap-6 lg:grid-cols-5">
                        <div className="lg:col-span-3">
                            <Panel
                                id="today-heading"
                                title="Today's events"
                                intro="Open an event to see its duties and people."
                            >
                                <TodayEvents events={data.data.today_events} now={now} />
                            </Panel>
                        </div>

                        <div className="space-y-6 lg:col-span-2">
                            <Panel
                                id="late-heading"
                                title="Late to start"
                                intro="Shift started 30 minutes ago and they are not on duty."
                                count={late.length}
                            >
                                {late.length === 0 ? (
                                    <AllClear
                                        icon={<ClockIcon className="size-5" />}
                                        text="Everyone is on time."
                                    />
                                ) : (
                                    <PeopleRows
                                        rows={late}
                                        chip={
                                            <span
                                                className={`${chipClass} bg-amber-50 text-amber-900 ring-amber-200`}
                                            >
                                                Late
                                            </span>
                                        }
                                    />
                                )}
                            </Panel>

                            <Panel
                                id="waiting-heading"
                                title="Not acknowledged"
                                intro="Assigned to an upcoming duty and have not confirmed."
                                count={waiting.length}
                            >
                                {waiting.length === 0 ? (
                                    <AllClear
                                        icon={<CheckIcon className="size-5" />}
                                        text="Everyone has acknowledged."
                                    />
                                ) : (
                                    <PeopleRows
                                        rows={waiting}
                                        chip={
                                            <span
                                                className={`${chipClass} bg-sky-50 text-sky-800 ring-sky-200`}
                                            >
                                                Assigned
                                            </span>
                                        }
                                    />
                                )}
                            </Panel>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
