// M-Notifications. The emails the system sent to this person, newest first. Read only.
import { useEffect } from 'react';
import { useAlerts } from '../../unread';
import { typeSentences, when } from '../../format';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';

export function MyNotifications() {
    const { list, markSeen } = useAlerts();
    // Opening the page counts as reading. Wait for the data so nothing new is hidden.
    useEffect(() => {
        if (list.isSuccess) markSeen();
    }, [list.isSuccess, list.dataUpdatedAt, markSeen]);

    return (
        <div className="mx-auto max-w-2xl">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Alerts</h1>
            <p className="mt-1 text-pretty text-stone-600">Emails we sent you about your duties.</p>

            {list.isError ? (
                <div className="mt-6 space-y-3">
                    <Alert tone="error">Your alerts did not load. Check your connection.</Alert>
                    <Button
                        variant="secondary"
                        size="md"
                        loading={list.isFetching}
                        onClick={() => void list.refetch()}
                    >
                        Retry
                    </Button>
                </div>
            ) : list.isPending ? (
                <p className="mt-6 text-stone-600" role="status">
                    Loading...
                </p>
            ) : list.data.length === 0 ? (
                <p className="mt-6 rounded-card bg-white p-6 text-center text-stone-600 ring-1 ring-stone-200">
                    No alerts yet. Duty emails show here.
                </p>
            ) : (
                <ul className="mt-6 space-y-3">
                    {list.data.map((n) => (
                        <li key={n.id} className="rounded-card bg-white p-4 ring-1 ring-stone-200">
                            <p className="font-semibold text-stone-900">
                                {typeSentences[n.type] ?? 'Notification'}
                            </p>
                            {n.event && <p className="mt-0.5 text-stone-700">{n.event}</p>}
                            <p className="mt-1 text-sm text-stone-500 tabular-nums">
                                {when(n.sent_at)}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
