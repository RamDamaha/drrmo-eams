// M-Duties (S1.5). A marshal or volunteer sees their own duties: event, time, place, duty type.
// Mobile first at 360 px: one column, date block on the left, whole card readable at a glance.
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { listMyAssignments, type MyAssignment } from '@/features/events/api';
import { ClipboardIcon, ClockIcon, PinIcon } from '@/features/events/components/icons';
import { chipClass } from '@/features/events/format';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';

const month = new Intl.DateTimeFormat(undefined, { month: 'short' });
const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const shortDay = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const clock = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

function shiftTime(start: Date, end: Date) {
    return start.toDateString() === end.toDateString()
        ? `${clock.format(start)} to ${clock.format(end)}`
        : `${clock.format(start)} to ${shortDay.format(end)}, ${clock.format(end)}`;
}

function DateBlock({ date, cancelled }: { date: Date; cancelled: boolean }) {
    const today = date.toDateString() === new Date().toDateString();
    return (
        <div
            className="flex w-14 shrink-0 flex-col items-center rounded-control border border-stone-200 py-2"
            aria-hidden="true"
        >
            <span
                className={`text-xs font-semibold tracking-wide uppercase ${cancelled ? 'text-stone-500' : 'text-maroon-700'}`}
            >
                {month.format(date)}
            </span>
            <span className="mt-0.5 text-2xl leading-none font-semibold text-stone-900 tabular-nums">
                {date.getDate()}
            </span>
            <span
                className={`mt-1 text-xs ${today ? 'font-semibold text-stone-900' : 'text-stone-500'}`}
            >
                {today ? 'Today' : weekday.format(date)}
            </span>
        </div>
    );
}

function DutyCard({ duty }: { duty: MyAssignment }) {
    const start = new Date(duty.starts_at);
    const end = new Date(duty.ends_at);
    const cancelled = duty.event.status === 'cancelled';
    const headingId = `duty-${duty.id}`;

    return (
        <li>
            <article
                aria-labelledby={headingId}
                className="h-full rounded-card bg-white ring-1 ring-stone-200"
            >
                <div className="flex gap-4 p-4">
                    <DateBlock date={start} cancelled={cancelled} />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <p
                                className={`text-sm font-semibold ${cancelled ? 'text-stone-500' : 'text-maroon-700'}`}
                            >
                                {duty.duty_type ?? 'Duty to be confirmed'}
                                {duty.team_needed ? `, ${duty.team_needed}` : ''}
                            </p>
                            {cancelled && (
                                <span
                                    className={`${chipClass} shrink-0 bg-stone-100 text-stone-600 ring-stone-200`}
                                >
                                    Cancelled
                                </span>
                            )}
                        </div>
                        <h3
                            id={headingId}
                            className={`mt-0.5 text-lg leading-snug font-semibold text-balance ${cancelled ? 'text-stone-500' : 'text-stone-900'}`}
                        >
                            {duty.event.title}
                        </h3>
                        <dl className="mt-2 space-y-1.5 text-base text-stone-700">
                            <div className="flex items-start gap-2">
                                <dt className="pt-0.5 text-stone-500">
                                    <ClockIcon className="size-5" />
                                    <span className="sr-only">When</span>
                                </dt>
                                <dd className="tabular-nums">
                                    <span className="sr-only">
                                        {weekday.format(start)}, {shortDay.format(start)},{' '}
                                    </span>
                                    {shiftTime(start, end)}
                                </dd>
                            </div>
                            <div className="flex items-start gap-2">
                                <dt className="pt-0.5 text-stone-500">
                                    <PinIcon className="size-5" />
                                    <span className="sr-only">Where</span>
                                </dt>
                                <dd className="min-w-0">
                                    {duty.event.location ?? 'Place to be confirmed'}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
                {duty.instructions && (
                    <div className="border-t border-stone-100 px-4 py-3">
                        <p className="text-xs font-semibold tracking-[0.14em] text-stone-500 uppercase">
                            Instructions
                        </p>
                        <p className="mt-1 text-base text-pretty whitespace-pre-line text-stone-700">
                            {duty.instructions}
                        </p>
                    </div>
                )}
            </article>
        </li>
    );
}

function DutyList({ title, duties }: { title: string; duties: MyAssignment[] }) {
    const id = `duties-${title.toLowerCase()}`;
    return (
        <section aria-labelledby={id} className="mt-8">
            <h2 id={id} className="flex items-baseline gap-2 text-lg font-semibold text-stone-900">
                {title}
                <span className="text-sm font-normal text-stone-500 tabular-nums">
                    {duties.length}
                </span>
            </h2>
            <ul className="mt-3 grid gap-3 lg:grid-cols-2">
                {duties.map((duty) => (
                    <DutyCard key={duty.id} duty={duty} />
                ))}
            </ul>
        </section>
    );
}

function Skeleton() {
    return (
        <div className="mt-6 grid gap-3 lg:grid-cols-2" aria-busy="true">
            <p role="status" className="sr-only">
                Loading your duties...
            </p>
            {[0, 1].map((card) => (
                <div
                    key={card}
                    className="flex gap-4 rounded-card bg-white p-4 ring-1 ring-stone-200"
                    aria-hidden="true"
                >
                    <div className="h-18 w-14 shrink-0 animate-pulse rounded-control bg-stone-200" />
                    <div className="flex-1 space-y-2.5">
                        <div className="h-4 w-24 animate-pulse rounded bg-stone-200" />
                        <div className="h-5 w-4/5 animate-pulse rounded bg-stone-200" />
                        <div className="h-4 w-3/5 animate-pulse rounded bg-stone-200" />
                        <div className="h-4 w-2/5 animate-pulse rounded bg-stone-200" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function MyAssignments() {
    const duties = useQuery({ queryKey: ['my-assignments'], queryFn: listMyAssignments });

    const [now] = useState(() => Date.now());
    const all = duties.data ?? [];
    const upcoming = all.filter((duty) => new Date(duty.ends_at).getTime() >= now);
    const past = all.filter((duty) => new Date(duty.ends_at).getTime() < now).reverse();

    return (
        <div>
            <div className="brand-stripe h-1 w-12 rounded-full" aria-hidden="true" />
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-stone-900">My duties</h1>
            <p className="mt-1 text-base text-pretty text-stone-600">
                Where to be and when, soonest first.
            </p>

            {duties.isPending && <Skeleton />}

            {duties.isError && (
                <div className="mt-6 space-y-3">
                    <Alert tone="error">
                        Your duties did not load. Check your connection and try again.
                    </Alert>
                    <Button
                        variant="secondary"
                        block
                        loading={duties.isFetching}
                        onClick={() => void duties.refetch()}
                    >
                        {duties.isFetching ? 'Retrying...' : 'Retry'}
                    </Button>
                </div>
            )}

            {duties.isSuccess && all.length === 0 && (
                <div className="mt-6 flex max-w-2xl flex-col items-center rounded-card bg-white px-6 py-10 text-center ring-1 ring-stone-200 md:py-14">
                    <span className="flex size-11 items-center justify-center rounded-control border border-stone-200 text-maroon-700">
                        <ClipboardIcon className="size-5" />
                    </span>
                    <p className="mt-4 text-lg font-semibold text-stone-900">No duties yet</p>
                    <p className="mt-1 max-w-xs text-base text-pretty text-stone-600">
                        When DRRMO assigns you to an event, it shows up here.
                    </p>
                </div>
            )}

            {duties.isSuccess && all.length > 0 && (
                <>
                    {upcoming.length > 0 ? (
                        <DutyList title="Upcoming" duties={upcoming} />
                    ) : (
                        <p className="mt-6 rounded-card bg-white px-4 py-4 text-base text-stone-600 ring-1 ring-stone-200">
                            No upcoming duties. Past duties are listed below.
                        </p>
                    )}
                    {past.length > 0 && <DutyList title="Past" duties={past} />}
                </>
            )}
        </div>
    );
}
