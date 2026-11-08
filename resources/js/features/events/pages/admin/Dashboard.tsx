// A-Dashboard (S3.7). Today at a glance: counts on top, today's events and who is on duty
// on the left, and the two people lists that need follow up on the right. Refreshes every minute.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import {
    getDashboard,
    markNoShow,
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
import { ApiError } from '@/shared/api/client';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';

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

// A time today reads "8:00 AM". Another day reads "Nov 9, 8:00 AM".
function when(iso: string) {
    const date = new Date(iso);
    return date.toDateString() === new Date().toDateString()
        ? time.format(date)
        : `${day.format(date)}, ${time.format(date)}`;
}

// "35 min late" or "1 h 10 min late".
function lateBy(iso: string, now: number) {
    const minutes = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
    if (minutes < 60) return `${minutes} min late`;
    const rest = minutes % 60;
    return `${Math.floor(minutes / 60)} h${rest > 0 ? ` ${rest} min` : ''} late`;
}

function failMessage(failure: unknown): string {
    if (failure instanceof ApiError && failure.status === 422) {
        const body = failure.body as { message?: string } | null;
        return body?.message ?? 'That did not work. Refresh and try again.';
    }
    return 'That did not work. Check your connection and try again.';
}

function LiveDot({ pulse = false }: { pulse?: boolean }) {
    return (
        <span className="relative flex size-1.5" aria-hidden="true">
            {pulse && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-ember-500 opacity-60" />
            )}
            <span className="relative inline-flex size-1.5 rounded-full bg-ember-500" />
        </span>
    );
}

function Stat({
    label,
    value,
    note,
    tone = 'plain',
}: {
    label: string;
    value: number;
    note: string;
    tone?: 'plain' | 'live' | 'urgent';
}) {
    return (
        <div className="bg-white px-6 py-5">
            <dt className="flex items-center gap-2 text-sm font-medium text-stone-600">
                {tone === 'live' && <LiveDot />}
                {label}
            </dt>
            <dd
                className={`mt-1 text-3xl font-semibold tracking-tight tabular-nums ${tone === 'urgent' ? 'text-ember-700' : 'text-stone-900'}`}
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
            <span className="flex size-9 shrink-0 items-center justify-center rounded-control border border-stone-200 text-stone-500">
                {icon}
            </span>
            {text}
        </p>
    );
}

// One person per row: who, where, and a right side that each list fills in.
function PeopleRows({
    rows,
    aside,
}: {
    rows: DashboardRow[];
    aside: (row: DashboardRow) => ReactNode;
}) {
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
                        <p className="truncate text-sm text-stone-600">
                            <Link
                                to={`/admin/events/${row.event.id}`}
                                className="text-maroon-700 hover:underline"
                            >
                                {row.event.title}
                            </Link>
                            {row.duty && <span className="text-stone-500"> · {row.duty}</span>}
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                        {aside(row)}
                    </div>
                </li>
            ))}
        </ul>
    );
}

// How full an event is. While it runs, the bar shows who is on duty. Before, who is assigned.
function Staffing({
    event,
    live,
}: {
    event: DashboardData['today_events'][number];
    live: boolean;
}) {
    const total = event.places_needed > 0 ? event.places_needed : event.people_count;
    const filled = live ? event.on_duty_count : event.people_count;
    const share = total > 0 ? Math.min(1, filled / total) : 0;
    return (
        <div className="w-32 text-right">
            <p className="flex items-center justify-end gap-1.5 text-sm text-stone-600 tabular-nums">
                <PeopleIcon className="size-4 text-stone-500" />
                <span className="font-semibold text-stone-900">{filled}</span>
                <span>
                    of {total} {live ? 'on duty' : 'assigned'}
                </span>
            </p>
            <div
                className="mt-1.5 h-1 overflow-hidden rounded-full bg-stone-200"
                aria-hidden="true"
            >
                <div
                    className={`h-full rounded-full ${live ? 'bg-ember-500' : 'bg-maroon-700'}`}
                    style={{ width: `${share * 100}%` }}
                />
            </div>
        </div>
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
                                {(live || over) && (
                                    <p className="mt-1.5">
                                        {live ? (
                                            <span
                                                className={`${chipClass} gap-1.5 bg-ember-50 text-ember-700 ring-ember-200`}
                                            >
                                                <LiveDot />
                                                Happening now
                                            </span>
                                        ) : (
                                            <span
                                                className={`${chipClass} bg-stone-100 text-stone-600 ring-stone-200`}
                                            >
                                                Ended
                                            </span>
                                        )}
                                    </p>
                                )}
                            </div>
                            <Staffing event={event} live={live} />
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
                className="mt-8 grid gap-px overflow-hidden rounded-card bg-stone-200 ring-1 ring-stone-200 sm:grid-cols-2 lg:grid-cols-4"
                aria-hidden="true"
            >
                {[0, 1, 2, 3].map((cell) => (
                    <div key={cell} className="space-y-2 bg-white px-6 py-5">
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
    const queryClient = useQueryClient();
    const data = useQuery({
        queryKey: ['dashboard'],
        queryFn: getDashboard,
        refetchInterval: 60_000,
    });
    const [today] = useState(() => new Date());
    const [pending, setPending] = useState<DashboardRow | null>(null);
    const [dialogError, setDialogError] = useState<string | null>(null);
    const noShow = useMutation({
        mutationFn: (row: DashboardRow) => markNoShow(row.id),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
                queryClient.invalidateQueries({ queryKey: ['event'] }),
            ]);
            setPending(null);
        },
        onError: (failure) => setDialogError(failMessage(failure)),
    });

    // The time of the last refresh, so "Happening now" and "late" move with the data.
    const now = data.dataUpdatedAt;
    const events = data.data?.today_events ?? [];
    const onDuty = data.data?.on_duty ?? [];
    const late = data.data?.not_on_duty ?? [];
    const waiting = data.data?.unacknowledged ?? [];
    const liveEvents = events.filter(
        (event) =>
            new Date(event.starts_at).getTime() <= now && now < new Date(event.ends_at).getTime(),
    ).length;
    const assignedToday = events.reduce((sum, event) => sum + event.people_count, 0);
    const firstName = pending?.person.split(' ')[0] ?? '';

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
                    <dl className="mt-8 grid gap-px overflow-hidden rounded-card bg-stone-200 ring-1 ring-stone-200 sm:grid-cols-2 lg:grid-cols-4">
                        <Stat
                            label="Events today"
                            value={events.length}
                            note={
                                liveEvents > 0
                                    ? `${liveEvents} happening now`
                                    : 'Published events only'
                            }
                        />
                        <Stat
                            label="On duty now"
                            value={onDuty.length}
                            note={
                                assignedToday > 0
                                    ? `${assignedToday} assigned to today's events`
                                    : 'Nobody is assigned today'
                            }
                            tone={onDuty.length > 0 ? 'live' : 'plain'}
                        />
                        <Stat
                            label="Late to start"
                            value={late.length}
                            note="30 minutes past shift start"
                            tone={late.length > 0 ? 'urgent' : 'plain'}
                        />
                        <Stat
                            label="Not acknowledged"
                            value={waiting.length}
                            note="Assigned but not confirmed"
                        />
                    </dl>

                    <div className="mt-6 grid items-start gap-6 lg:grid-cols-5">
                        <div className="space-y-6 lg:col-span-3">
                            <Panel
                                id="today-heading"
                                title="Today's events"
                                intro="Open an event to see its duties and people."
                            >
                                <TodayEvents events={events} now={now} />
                            </Panel>

                            <Panel
                                id="on-duty-heading"
                                title="On duty now"
                                intro="People who started duty and have not ended it."
                                count={onDuty.length}
                            >
                                {onDuty.length === 0 ? (
                                    <AllClear
                                        icon={<PeopleIcon className="size-5" />}
                                        text="Nobody is on duty right now."
                                    />
                                ) : (
                                    <PeopleRows
                                        rows={onDuty}
                                        aside={(row) => (
                                            <>
                                                <span
                                                    className={`${chipClass} gap-1.5 bg-ember-50 text-ember-700 ring-ember-200`}
                                                >
                                                    <LiveDot pulse />
                                                    On duty
                                                </span>
                                                <p className="text-xs text-stone-500 tabular-nums">
                                                    {row.duty_started_at &&
                                                        `Since ${when(row.duty_started_at)}`}
                                                    {row.ends_at &&
                                                        `${row.duty_started_at ? ', ' : ''}ends ${time.format(new Date(row.ends_at))}`}
                                                </p>
                                            </>
                                        )}
                                    />
                                )}
                            </Panel>
                        </div>

                        <div className="space-y-6 lg:col-span-2">
                            <Panel
                                id="late-heading"
                                title="Late to start"
                                intro="Shift started 30 minutes ago and they have not started duty."
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
                                        aside={(row) => (
                                            <>
                                                {row.starts_at && (
                                                    <p className="text-sm font-semibold text-ember-700 tabular-nums">
                                                        {lateBy(row.starts_at, now)}
                                                    </p>
                                                )}
                                                <button
                                                    type="button"
                                                    className="rounded-control text-xs font-semibold text-red-700 hover:underline"
                                                    onClick={() => {
                                                        setDialogError(null);
                                                        setPending(row);
                                                    }}
                                                >
                                                    Mark no show
                                                    <span className="sr-only">: {row.person}</span>
                                                </button>
                                            </>
                                        )}
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
                                        aside={(row) => (
                                            <>
                                                <span
                                                    className={`${chipClass} bg-sky-50 text-sky-800 ring-sky-200`}
                                                >
                                                    Assigned
                                                </span>
                                                {row.starts_at && (
                                                    <p className="text-xs text-stone-500 tabular-nums">
                                                        Shift {when(row.starts_at)}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    />
                                )}
                            </Panel>
                        </div>
                    </div>
                </>
            )}

            <ConfirmDialog
                open={pending !== null}
                title={`Mark ${pending?.person ?? ''} as no show?`}
                description={`${firstName} did not report for ${pending?.duty ?? 'this duty'} at ${pending?.event.title ?? 'this event'}. Their spot opens so you can fill it. This stays on their record.`}
                confirmLabel="Mark no show"
                loadingLabel="Saving..."
                cancelLabel="Keep"
                tone="danger"
                loading={noShow.isPending}
                error={dialogError}
                onConfirm={() => {
                    if (pending) noShow.mutate(pending);
                }}
                onCancel={() => setPending(null)}
            />
        </div>
    );
}
