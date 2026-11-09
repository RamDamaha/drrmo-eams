// A-Notification log (S3.6). Every email the system sent or tried to send, newest first.
// Filters sit in the URL so a view can be shared. Failed rows have a Retry.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { listNotifications, retryNotification, type NotificationFilters } from '../../api';
import { statusChips, typeLabels, usageLevel, when } from '../../format';
import { chipClass } from '@/features/events/format';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';

const headCell = 'px-5 py-3 text-xs font-semibold tracking-wide text-stone-500 uppercase';
const control =
    'min-h-10 rounded-control border border-stone-300 bg-white px-3 text-sm text-stone-900 focus:border-maroon-700 focus:ring-3 focus:ring-maroon-700/15 focus:outline-none';

const levelBar = { ok: 'bg-green-600', near: 'bg-amber-500', over: 'bg-red-600' } as const;

export function NotificationLog() {
    const [params, setParams] = useSearchParams();
    const filters: NotificationFilters = {
        type: params.get('type') ?? '',
        status: params.get('status') ?? '',
        from: params.get('from') ?? '',
        to: params.get('to') ?? '',
        search: params.get('search') ?? '',
        page: Number(params.get('page')) || 1,
    };
    const client = useQueryClient();
    const list = useQuery({
        queryKey: ['notifications', filters],
        queryFn: () => listNotifications(filters),
        placeholderData: keepPreviousData,
    });
    const retry = useMutation({
        mutationFn: retryNotification,
        onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const set = (key: keyof NotificationFilters, value: string) => {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== 'page') next.delete('page');
        setParams(next, { replace: true });
    };
    const filtered = Object.entries(filters).some(([k, v]) => k !== 'page' && v);
    const rows = list.data?.data ?? [];
    const summary = list.data?.summary;
    const meta = list.data?.meta;
    const level = summary ? usageLevel(summary.sent_today, summary.daily_limit) : 'ok';
    const pct =
        summary && summary.daily_limit > 0
            ? Math.min(100, Math.round((summary.sent_today / summary.daily_limit) * 100))
            : 0;

    return (
        <div className="mx-auto max-w-[1440px]">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="brand-stripe h-1 w-12 rounded-full" aria-hidden="true" />
                    <h1 className="mt-4 text-2xl font-semibold tracking-tight text-stone-900">
                        Notifications
                    </h1>
                    <p className="mt-1 text-pretty text-stone-600">
                        Every email the system sent about duties, and whether it got through.
                    </p>
                </div>
                {summary && (
                    <div className="w-full max-w-xs rounded-card bg-white p-4 ring-1 ring-stone-200">
                        <p className="text-sm text-stone-600">Sent today</p>
                        <p className="mt-0.5 text-lg font-semibold text-stone-900 tabular-nums">
                            {summary.sent_today}
                            <span className="text-sm font-normal text-stone-500">
                                {' '}
                                of {summary.daily_limit}
                            </span>
                        </p>
                        <div
                            className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100"
                            role="progressbar"
                            aria-label="Emails sent today against the daily limit"
                            aria-valuemin={0}
                            aria-valuemax={summary.daily_limit}
                            aria-valuenow={summary.sent_today}
                        >
                            <div
                                className={`h-full ${levelBar[level]}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                )}
            </header>

            {level !== 'ok' && summary && (
                <div className="mt-6 max-w-xl">
                    <Alert tone="error">
                        {level === 'over'
                            ? 'The daily email limit is reached. New emails may be refused until tomorrow. Failed ones can be retried then.'
                            : 'Today is close to the daily email limit. Avoid bulk changes until tomorrow.'}
                    </Alert>
                </div>
            )}

            <form
                className="mt-8 flex flex-wrap items-end gap-3"
                role="search"
                aria-label="Filter notifications"
                onSubmit={(e) => e.preventDefault()}
            >
                <label className="text-sm font-medium text-stone-800">
                    <span className="mb-1.5 block">Status</span>
                    <select
                        className={control}
                        value={filters.status}
                        onChange={(e) => set('status', e.target.value)}
                    >
                        <option value="">All</option>
                        <option value="queued">Queued</option>
                        <option value="sent">Sent</option>
                        <option value="failed">Failed</option>
                    </select>
                </label>
                <label className="text-sm font-medium text-stone-800">
                    <span className="mb-1.5 block">Type</span>
                    <select
                        className={control}
                        value={filters.type}
                        onChange={(e) => set('type', e.target.value)}
                    >
                        <option value="">All</option>
                        {Object.entries(typeLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="text-sm font-medium text-stone-800">
                    <span className="mb-1.5 block">From</span>
                    <input
                        type="date"
                        className={control}
                        value={filters.from}
                        onChange={(e) => set('from', e.target.value)}
                    />
                </label>
                <label className="text-sm font-medium text-stone-800">
                    <span className="mb-1.5 block">To</span>
                    <input
                        type="date"
                        className={control}
                        value={filters.to}
                        onChange={(e) => set('to', e.target.value)}
                    />
                </label>
                <label className="text-sm font-medium text-stone-800">
                    <span className="mb-1.5 block">Person</span>
                    <input
                        type="search"
                        className={control}
                        placeholder="Name or email"
                        value={filters.search}
                        onChange={(e) => set('search', e.target.value)}
                    />
                </label>
                {filtered && (
                    <Button
                        variant="ghost"
                        size="md"
                        type="button"
                        onClick={() => setParams({}, { replace: true })}
                    >
                        Clear filters
                    </Button>
                )}
            </form>

            {retry.isError && (
                <div className="mt-4 max-w-xl">
                    <Alert tone="error">The retry did not go through. Try again in a moment.</Alert>
                </div>
            )}

            {list.isError ? (
                <div className="mt-8 max-w-xl space-y-3">
                    <Alert tone="error">
                        The log did not load. Check your connection and try again.
                    </Alert>
                    <Button
                        variant="secondary"
                        size="md"
                        loading={list.isFetching}
                        onClick={() => void list.refetch()}
                    >
                        Retry
                    </Button>
                </div>
            ) : (
                <section className="mt-6" aria-busy={list.isPending || undefined}>
                    <p className="mb-3 text-sm text-stone-600" aria-live="polite">
                        {list.isPending ? 'Loading notifications...' : `${meta?.total ?? 0} found`}
                    </p>
                    <div className="overflow-x-auto rounded-card bg-white ring-1 ring-stone-200">
                        <table className="w-full min-w-[880px] text-left">
                            <thead className="border-b border-stone-200">
                                <tr>
                                    <th scope="col" className={headCell}>
                                        Person
                                    </th>
                                    <th scope="col" className={headCell}>
                                        Type
                                    </th>
                                    <th scope="col" className={headCell}>
                                        Event
                                    </th>
                                    <th scope="col" className={headCell}>
                                        Status
                                    </th>
                                    <th scope="col" className={headCell}>
                                        Created
                                    </th>
                                    <th scope="col" className={headCell}>
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {list.isSuccess && rows.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-10 text-center text-sm text-stone-600"
                                        >
                                            {filtered
                                                ? 'Nothing matches these filters.'
                                                : 'No notifications yet.'}
                                        </td>
                                    </tr>
                                )}
                                {rows.map((n) => {
                                    const status = statusChips[n.status];
                                    return (
                                        <tr
                                            key={n.id}
                                            className="align-top transition-colors hover:bg-stone-50"
                                        >
                                            <td className="px-5 py-3.5">
                                                <p className="font-medium text-stone-900">
                                                    {n.recipient?.name ?? 'Removed person'}
                                                </p>
                                                {n.recipient && (
                                                    <p className="text-sm text-stone-500">
                                                        {n.recipient.email}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-stone-700">
                                                {typeLabels[n.type] ?? n.type}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-stone-700">
                                                {n.event ?? (
                                                    <span className="text-stone-500">None</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`${chipClass} ${status.chip}`}>
                                                    {status.label}
                                                </span>
                                                {n.status === 'sent' && (
                                                    <p className="mt-1 text-xs text-stone-500">
                                                        {when(n.sent_at)}
                                                    </p>
                                                )}
                                                {n.status === 'failed' && n.last_error && (
                                                    <p className="mt-1 max-w-xs text-xs text-red-800">
                                                        {n.last_error}
                                                    </p>
                                                )}
                                                {n.attempts > 1 && (
                                                    <p className="mt-1 text-xs text-stone-500">
                                                        {n.attempts} attempts
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm whitespace-nowrap text-stone-700 tabular-nums">
                                                {when(n.created_at)}
                                            </td>
                                            <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                                {n.status === 'failed' && (
                                                    <Button
                                                        variant="secondary"
                                                        size="md"
                                                        loading={
                                                            retry.isPending &&
                                                            retry.variables === n.id
                                                        }
                                                        aria-label={`Retry the email to ${n.recipient?.name ?? 'this person'}`}
                                                        onClick={() => retry.mutate(n.id)}
                                                    >
                                                        Retry
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {meta && meta.last_page > 1 && (
                        <div className="mt-4 flex items-center justify-between">
                            <Button
                                variant="secondary"
                                size="md"
                                disabled={meta.current_page <= 1}
                                onClick={() => set('page', String(meta.current_page - 1))}
                            >
                                Previous
                            </Button>
                            <p className="text-sm text-stone-600">
                                Page {meta.current_page} of {meta.last_page}
                            </p>
                            <Button
                                variant="secondary"
                                size="md"
                                disabled={meta.current_page >= meta.last_page}
                                onClick={() => set('page', String(meta.current_page + 1))}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
