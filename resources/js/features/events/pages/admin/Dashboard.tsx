// A-Dashboard (S3.7). Plain first version: today's events, people who have not acknowledged, people late to start.
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { getDashboard, type DashboardRow } from '@/features/events/api';
import { Alert } from '@/shared/ui/Alert';

const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const day = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

function Rows({ rows, empty }: { rows: DashboardRow[]; empty: string }) {
    if (rows.length === 0) return <p className="px-6 py-4 text-sm text-stone-500">{empty}</p>;
    return (
        <ul className="divide-y divide-stone-100">
            {rows.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-4 px-6 py-3">
                    <div className="min-w-0">
                        <p className="truncate font-medium text-stone-900">{row.person}</p>
                        <Link
                            to={`/admin/events/${row.event.id}`}
                            className="truncate text-sm text-maroon-700 hover:underline"
                        >
                            {row.event.title}
                        </Link>
                    </div>
                    {row.starts_at && (
                        <p className="shrink-0 text-sm text-stone-600 tabular-nums">
                            {day.format(new Date(row.starts_at))},{' '}
                            {time.format(new Date(row.starts_at))}
                        </p>
                    )}
                </li>
            ))}
        </ul>
    );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="rounded-card bg-white ring-1 ring-stone-200">
            <h2 className="border-b border-stone-200 px-6 py-3 text-lg font-semibold text-stone-900">
                {title}
            </h2>
            {children}
        </section>
    );
}

export function Dashboard() {
    const data = useQuery({
        queryKey: ['dashboard'],
        queryFn: getDashboard,
        refetchInterval: 60_000,
    });

    return (
        <div className="mx-auto max-w-5xl">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Dashboard</h1>
            {data.isError && (
                <div className="mt-4">
                    <Alert tone="error">The dashboard did not load.</Alert>
                </div>
            )}
            {data.isPending && <p className="mt-4 text-stone-600">Loading...</p>}
            {data.data && (
                <div className="mt-6 space-y-6">
                    <Panel title="Today's events">
                        {data.data.today_events.length === 0 ? (
                            <p className="px-6 py-4 text-sm text-stone-500">
                                No published events today.
                            </p>
                        ) : (
                            <ul className="divide-y divide-stone-100">
                                {data.data.today_events.map((event) => (
                                    <li
                                        key={event.id}
                                        className="flex items-center justify-between gap-4 px-6 py-3"
                                    >
                                        <div className="min-w-0">
                                            <Link
                                                to={`/admin/events/${event.id}`}
                                                className="truncate font-medium text-maroon-700 hover:underline"
                                            >
                                                {event.title}
                                            </Link>
                                            <p className="truncate text-sm text-stone-500">
                                                {event.location ?? 'No location'}
                                            </p>
                                        </div>
                                        <p className="shrink-0 text-sm text-stone-600 tabular-nums">
                                            {time.format(new Date(event.starts_at))} to{' '}
                                            {time.format(new Date(event.ends_at))},{' '}
                                            {event.people_count} people
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>
                    <Panel
                        title={`Not started 30 minutes after shift start (${data.data.not_on_duty.length})`}
                    >
                        <Rows rows={data.data.not_on_duty} empty="Everyone is on time." />
                    </Panel>
                    <Panel title={`Not acknowledged yet (${data.data.unacknowledged.length})`}>
                        <Rows rows={data.data.unacknowledged} empty="Everyone has acknowledged." />
                    </Panel>
                </div>
            )}
        </div>
    );
}
