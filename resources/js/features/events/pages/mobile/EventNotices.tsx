// M-Notices (S2.8). A coordinator reads published events for their department or campus wide. Read only.
import { useQuery } from '@tanstack/react-query';
import { listEventNotices } from '@/features/events/api';
import { Alert } from '@/shared/ui/Alert';

const when = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
});

export function EventNotices() {
    const notices = useQuery({ queryKey: ['event-notices'], queryFn: listEventNotices });

    return (
        <div className="mx-auto max-w-2xl space-y-4">
            <h1 className="text-2xl font-semibold text-stone-900">Event notices</h1>
            {notices.isError && <Alert tone="error">The notices did not load.</Alert>}
            {notices.isPending && <p className="text-stone-600">Loading...</p>}
            {notices.data?.length === 0 && (
                <p className="rounded-card bg-white p-4 text-stone-600 ring-1 ring-stone-200">
                    No upcoming events for your department.
                </p>
            )}
            <ul className="space-y-3">
                {notices.data?.map((notice) => (
                    <li key={notice.id} className="rounded-card bg-white p-4 ring-1 ring-stone-200">
                        <p className="text-sm font-semibold text-maroon-700">
                            {notice.event_type}
                            {notice.campus_wide ? ', campus wide' : ''}
                        </p>
                        <h2 className="mt-0.5 text-lg font-semibold text-stone-900">
                            {notice.title}
                        </h2>
                        <p className="mt-1 text-base text-stone-700 tabular-nums">
                            {when.format(new Date(notice.starts_at))}
                        </p>
                        {notice.location && (
                            <p className="text-base text-stone-700">{notice.location}</p>
                        )}
                        {notice.description && (
                            <p className="mt-2 text-base text-pretty whitespace-pre-line text-stone-600">
                                {notice.description}
                            </p>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
