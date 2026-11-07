// A-Event detail (SCREENS.md). Admin sees the event and assigns marshals and volunteers.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import {
    assignPerson,
    getEvent,
    getLookups,
    listCandidates,
    removeAssignment,
    type Assignment,
    type Candidate,
} from '@/features/events/api';
import { ApiError } from '@/shared/api/client';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';

type Role = 'marshal' | 'volunteer';

const roleLabels: Record<Role, { plural: string; one: string }> = {
    marshal: { plural: 'Marshals', one: 'marshal' },
    volunteer: { plural: 'Volunteers', one: 'volunteer' },
};

function when(value: string) {
    return new Date(value).toLocaleString();
}

const selectClass =
    'block min-h-10 w-full rounded-control border border-stone-300 bg-white px-3 text-sm text-stone-900';

interface SectionProps {
    eventId: number;
    role: Role;
    assignments: Assignment[];
    candidates: Candidate[];
    taskTypes: { id: number; name: string }[];
    onError: (message: string | null) => void;
}

function RoleSection({ eventId, role, assignments, candidates, taskTypes, onError }: SectionProps) {
    const queryClient = useQueryClient();
    const [userId, setUserId] = useState('');
    const [taskId, setTaskId] = useState('');
    const labels = roleLabels[role];

    const refresh = () =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: ['event', eventId] }),
            queryClient.invalidateQueries({ queryKey: ['event-candidates', eventId] }),
        ]);
    const failed = (error: unknown) =>
        onError(
            error instanceof ApiError && error.status === 422
                ? 'That person cannot be assigned. Refresh and try again.'
                : 'That did not work. Refresh the page and try again.',
        );

    const add = useMutation({
        mutationFn: () =>
            assignPerson(eventId, { user_id: Number(userId), duty_type_id: Number(taskId) }),
        onSuccess: () => {
            setUserId('');
            setTaskId('');
            return refresh();
        },
        onError: failed,
    });
    const remove = useMutation({
        mutationFn: removeAssignment,
        onSuccess: refresh,
        onError: failed,
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        onError(null);
        if (userId && taskId) add.mutate();
    }

    const options = candidates.filter((person) => person.role === role);

    return (
        <section className="mt-8">
            <h2 className="text-lg font-semibold text-stone-900">
                {labels.plural} ({assignments.length})
            </h2>

            <div className="mt-3 overflow-x-auto rounded-control border border-stone-200 bg-white">
                <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 text-stone-600">
                        <tr>
                            <th className="px-4 py-3 font-medium">Name</th>
                            <th className="px-4 py-3 font-medium">Task type</th>
                            <th className="px-4 py-3 font-medium">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {assignments.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-4 py-6 text-stone-500">
                                    No {labels.plural.toLowerCase()} assigned yet.
                                </td>
                            </tr>
                        )}
                        {assignments.map((row) => (
                            <tr key={row.id}>
                                <td className="px-4 py-3 font-medium text-stone-900">
                                    {row.person.name}
                                    <span className="block font-normal text-stone-500">
                                        {row.person.email}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-stone-700">{row.task_type.name}</td>
                                <td className="px-4 py-3 text-right">
                                    <Button
                                        size="md"
                                        variant="secondary"
                                        loading={remove.isPending && remove.variables === row.id}
                                        onClick={() => {
                                            onError(null);
                                            remove.mutate(row.id);
                                        }}
                                        aria-label={`Remove ${row.person.name}`}
                                    >
                                        Remove
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-3">
                <div className="min-w-48 flex-1">
                    <label
                        htmlFor={`${role}-person`}
                        className="mb-1 block text-sm font-medium text-stone-800"
                    >
                        Add a {labels.one}
                    </label>
                    <select
                        id={`${role}-person`}
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className={selectClass}
                    >
                        <option value="">
                            {options.length
                                ? 'Choose a person'
                                : `No ${labels.plural.toLowerCase()} left`}
                        </option>
                        {options.map((person) => (
                            <option key={person.id} value={person.id}>
                                {person.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="min-w-48 flex-1">
                    <label
                        htmlFor={`${role}-task`}
                        className="mb-1 block text-sm font-medium text-stone-800"
                    >
                        Task type
                    </label>
                    <select
                        id={`${role}-task`}
                        value={taskId}
                        onChange={(e) => setTaskId(e.target.value)}
                        className={selectClass}
                    >
                        <option value="">Choose a task</option>
                        {taskTypes.map((task) => (
                            <option key={task.id} value={task.id}>
                                {task.name}
                            </option>
                        ))}
                    </select>
                </div>
                <Button
                    type="submit"
                    size="md"
                    loading={add.isPending}
                    disabled={!userId || !taskId}
                >
                    Assign
                </Button>
            </form>
        </section>
    );
}

export function EventDetail() {
    const eventId = Number(useParams().id);
    const [error, setError] = useState<string | null>(null);

    const event = useQuery({ queryKey: ['event', eventId], queryFn: () => getEvent(eventId) });
    const candidates = useQuery({
        queryKey: ['event-candidates', eventId],
        queryFn: () => listCandidates(eventId),
    });
    const lookups = useQuery({ queryKey: ['event-lookups'], queryFn: getLookups });

    if (event.isPending) return <p className="text-stone-500">Loading...</p>;
    if (event.isError) return <Alert tone="error">Could not load this event.</Alert>;

    const data = event.data;
    const assignments = data.assignments ?? [];

    return (
        <div>
            <Link to="/admin/events" className="text-sm text-maroon-700 hover:underline">
                Back to events
            </Link>
            <h1 className="mt-2 text-2xl font-semibold text-stone-900">{data.title}</h1>
            <p className="mt-1 text-stone-600">
                {data.event_type.label} at {data.location?.name}. {when(data.starts_at)} to{' '}
                {when(data.ends_at)}.
            </p>
            {data.description && <p className="mt-2 text-stone-700">{data.description}</p>}

            {error && (
                <div className="mt-4">
                    <Alert tone="error">{error}</Alert>
                </div>
            )}
            {(candidates.isError || lookups.isError) && (
                <div className="mt-4">
                    <Alert tone="error">Could not load the people or task types.</Alert>
                </div>
            )}

            {(['marshal', 'volunteer'] as const).map((role) => (
                <RoleSection
                    key={role}
                    eventId={eventId}
                    role={role}
                    assignments={assignments.filter((row) => row.role === role)}
                    candidates={candidates.data ?? []}
                    taskTypes={lookups.data?.task_types ?? []}
                    onError={setError}
                />
            ))}
        </div>
    );
}
