// M-Duties (S1.5). A marshal or volunteer sees their own duties: event, time, place, duty type.
import { useQuery } from '@tanstack/react-query';
import { listMyAssignments, type MyAssignment } from '@/features/events/api';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';

const day = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
});
const clock = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

function DutyCard({ duty }: { duty: MyAssignment }) {
    const start = new Date(duty.starts_at);
    const end = new Date(duty.ends_at);
    const cancelled = duty.event.status === 'cancelled';

    return (
        <li className="rounded-card bg-white p-4 ring-1 ring-stone-200">
            <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-stone-900">{duty.event.title}</h2>
                {cancelled && (
                    <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600 ring-1 ring-stone-200 ring-inset">
                        Cancelled
                    </span>
                )}
            </div>
            <p className="mt-1 text-base font-medium text-maroon-800">
                {duty.duty_type ?? 'Duty to be confirmed'}
                {duty.team_needed ? `, ${duty.team_needed}` : ''}
            </p>
            <dl className="mt-3 space-y-1 text-base text-stone-700">
                <div>
                    <dt className="sr-only">When</dt>
                    <dd className="tabular-nums">
                        {day.format(start)}, {clock.format(start)} to {clock.format(end)}
                    </dd>
                </div>
                <div>
                    <dt className="sr-only">Where</dt>
                    <dd>{duty.event.location ?? 'Place to be confirmed'}</dd>
                </div>
            </dl>
            {duty.instructions && (
                <p className="mt-3 border-t border-stone-100 pt-3 text-base whitespace-pre-line text-stone-600">
                    {duty.instructions}
                </p>
            )}
        </li>
    );
}

export function MyAssignments() {
    const duties = useQuery({ queryKey: ['my-assignments'], queryFn: listMyAssignments });

    return (
        <div>
            <h1 className="text-2xl font-semibold text-stone-900">My duties</h1>

            {duties.isPending && (
                <p role="status" className="mt-4 text-base text-stone-600">
                    Loading your duties...
                </p>
            )}

            {duties.isError && (
                <div className="mt-4 space-y-3">
                    <Alert tone="error">Your duties did not load. Check your connection.</Alert>
                    <Button
                        variant="secondary"
                        loading={duties.isFetching}
                        onClick={() => void duties.refetch()}
                    >
                        {duties.isFetching ? 'Retrying...' : 'Retry'}
                    </Button>
                </div>
            )}

            {duties.isSuccess && duties.data.length === 0 && (
                <div className="mt-6 rounded-card border border-dashed border-stone-300 p-6 text-center">
                    <p className="text-lg font-medium text-stone-900">No duties yet</p>
                    <p className="mt-1 text-base text-stone-600">
                        When an admin assigns you to an event, it shows up here.
                    </p>
                </div>
            )}

            {duties.isSuccess && duties.data.length > 0 && (
                <ul className="mt-4 space-y-3">
                    {duties.data.map((duty) => (
                        <DutyCard key={duty.id} duty={duty} />
                    ))}
                </ul>
            )}
        </div>
    );
}
