// A-Event detail (SCREENS.md). Admin sees the event and assigns marshals and volunteers.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent, type ReactNode } from 'react';
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
import {
    CalendarIcon,
    ChevronIcon,
    PeopleIcon,
    PinIcon,
    TagIcon,
} from '@/features/events/components/icons';
import { SelectField, SelectOption } from '@/features/events/components/SelectField';
import { chipClass, schedule, statuses } from '@/features/events/format';
import { ApiError } from '@/shared/api/client';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';

type Role = 'marshal' | 'volunteer';

const roleLabels: Record<Role, { plural: string; one: string }> = {
    marshal: { plural: 'Marshals', one: 'marshal' },
    volunteer: { plural: 'Volunteers', one: 'volunteer' },
};

function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    return (
        (parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '')
    ).toUpperCase();
}

function BackLink() {
    return (
        <Link
            to="/admin/events"
            className="-ml-1 inline-flex items-center gap-1 rounded-control px-1 py-1 text-sm font-medium text-stone-600 transition-colors hover:text-maroon-700"
        >
            <ChevronIcon className="size-4 rotate-90" />
            Events
        </Link>
    );
}

function Meta({ icon, children }: { icon: ReactNode; children: ReactNode }) {
    return (
        <div className="flex items-center gap-2 text-sm text-stone-700">
            <span className="text-stone-500">{icon}</span>
            {children}
        </div>
    );
}

interface SectionProps {
    eventId: number;
    role: Role;
    assignments: Assignment[];
    candidates: Candidate[];
    candidatesReady: boolean;
    taskTypes: { id: number; name: string }[];
}

function RoleSection({
    eventId,
    role,
    assignments,
    candidates,
    candidatesReady,
    taskTypes,
}: SectionProps) {
    const queryClient = useQueryClient();
    const [userId, setUserId] = useState('');
    const [taskId, setTaskId] = useState('');
    const [error, setError] = useState<string | null>(null);
    const labels = roleLabels[role];
    const headingId = `${role}-heading`;

    const refresh = () =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: ['event', eventId] }),
            queryClient.invalidateQueries({ queryKey: ['event-candidates', eventId] }),
        ]);
    const failed = (failure: unknown) =>
        setError(
            failure instanceof ApiError && failure.status === 422
                ? 'That person cannot be assigned. Refresh the page and try again.'
                : 'That did not work. Check your connection and try again.',
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
        setError(null);
        if (userId && taskId) add.mutate();
    }

    const options = candidates.filter((person) => person.role === role);
    const personPlaceholder = !candidatesReady
        ? 'Loading people...'
        : options.length
          ? 'Choose a person'
          : `No ${labels.plural.toLowerCase()} left to add`;

    return (
        <section
            aria-labelledby={headingId}
            className="flex flex-col rounded-card bg-white ring-1 ring-stone-200"
        >
            <header className="flex items-baseline justify-between gap-4 border-b border-stone-200 px-6 py-4">
                <h2 id={headingId} className="text-lg font-semibold text-stone-900">
                    {labels.plural}
                </h2>
                <p className="text-sm text-stone-600 tabular-nums">{assignments.length} assigned</p>
            </header>

            {assignments.length === 0 ? (
                <div className="flex flex-1 flex-col items-center px-6 py-10 text-center">
                    <span className="flex size-11 items-center justify-center rounded-control border border-stone-200 text-maroon-700">
                        <PeopleIcon className="size-5" />
                    </span>
                    <p className="mt-3 font-medium text-stone-900">
                        No {labels.plural.toLowerCase()} yet
                    </p>
                    <p className="mt-0.5 text-sm text-stone-600">Pick a person and a task below.</p>
                </div>
            ) : (
                <ul className="flex-1 divide-y divide-stone-100">
                    {assignments.map((row) => {
                        const removing = remove.isPending && remove.variables === row.id;
                        return (
                            <li
                                key={row.id}
                                className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-stone-50"
                            >
                                <span
                                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-maroon-50 text-sm font-semibold text-maroon-800"
                                    aria-hidden="true"
                                >
                                    {initials(row.person.name)}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-stone-900">
                                        {row.person.name}
                                    </p>
                                    <p className="truncate text-sm text-stone-500">
                                        {row.person.email}
                                    </p>
                                </div>
                                <p className="hidden w-36 shrink-0 text-sm text-stone-700 sm:block">
                                    <span className="sr-only">Task: </span>
                                    {row.task_type.name}
                                </p>
                                <Button
                                    size="md"
                                    variant="secondary"
                                    loading={removing}
                                    onClick={() => {
                                        setError(null);
                                        remove.mutate(row.id);
                                    }}
                                    aria-label={`Remove ${row.person.name}`}
                                >
                                    {removing ? 'Removing...' : 'Remove'}
                                </Button>
                            </li>
                        );
                    })}
                </ul>
            )}

            <form
                onSubmit={submit}
                className="space-y-4 rounded-b-card border-t border-stone-200 bg-stone-50 px-6 py-5"
            >
                <h3 className="text-sm font-semibold text-stone-900">Add a {labels.one}</h3>
                <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <SelectField
                        id={`${role}-person`}
                        label="Person"
                        size="md"
                        placeholder={personPlaceholder}
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        disabled={!candidatesReady || options.length === 0}
                    >
                        {options.map((person) => (
                            <SelectOption key={person.id} value={person.id}>
                                {person.name}
                            </SelectOption>
                        ))}
                    </SelectField>
                    <SelectField
                        id={`${role}-task`}
                        label="Task type"
                        size="md"
                        placeholder="Choose a task"
                        value={taskId}
                        onChange={(e) => setTaskId(e.target.value)}
                        disabled={taskTypes.length === 0}
                    >
                        {taskTypes.map((task) => (
                            <SelectOption key={task.id} value={task.id}>
                                {task.name}
                            </SelectOption>
                        ))}
                    </SelectField>
                    <Button
                        type="submit"
                        size="md"
                        loading={add.isPending}
                        disabled={!userId || !taskId}
                    >
                        {add.isPending ? 'Assigning...' : 'Assign'}
                    </Button>
                </div>
                {error && <Alert tone="error">{error}</Alert>}
            </form>
        </section>
    );
}

function Skeleton() {
    return (
        <div className="mx-auto max-w-[1440px]" aria-busy="true">
            <BackLink />
            <p className="sr-only" role="status">
                Loading the event...
            </p>
            <div className="mt-4 h-1 w-12 rounded-full bg-stone-200" aria-hidden="true" />
            <div className="mt-4 h-7 w-80 animate-pulse rounded bg-stone-200" aria-hidden="true" />
            <div className="mt-4 flex gap-6" aria-hidden="true">
                <div className="h-4 w-28 animate-pulse rounded bg-stone-200" />
                <div className="h-4 w-36 animate-pulse rounded bg-stone-200" />
                <div className="h-4 w-56 animate-pulse rounded bg-stone-200" />
            </div>
            <div className="mt-8 grid gap-6 xl:grid-cols-2" aria-hidden="true">
                {[0, 1].map((card) => (
                    <div key={card} className="rounded-card bg-white p-6 ring-1 ring-stone-200">
                        <div className="h-5 w-28 animate-pulse rounded bg-stone-200" />
                        <div className="mt-6 space-y-4">
                            <div className="h-9 animate-pulse rounded bg-stone-200" />
                            <div className="h-9 animate-pulse rounded bg-stone-200" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function EventDetail() {
    const eventId = Number(useParams().id);

    const event = useQuery({ queryKey: ['event', eventId], queryFn: () => getEvent(eventId) });
    const candidates = useQuery({
        queryKey: ['event-candidates', eventId],
        queryFn: () => listCandidates(eventId),
    });
    const lookups = useQuery({ queryKey: ['event-lookups'], queryFn: getLookups });

    if (event.isPending) return <Skeleton />;

    if (event.isError) {
        const missing = event.error instanceof ApiError && event.error.status === 404;
        return (
            <div className="mx-auto max-w-[1440px]">
                <BackLink />
                <div className="mt-6 max-w-xl space-y-3">
                    <Alert tone="error">
                        {missing
                            ? 'This event does not exist or was removed.'
                            : 'The event did not load. Check your connection and try again.'}
                    </Alert>
                    {!missing && (
                        <Button
                            variant="secondary"
                            size="md"
                            loading={event.isFetching}
                            onClick={() => void event.refetch()}
                        >
                            {event.isFetching ? 'Retrying...' : 'Retry'}
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    const data = event.data;
    const assignments = data.assignments ?? [];
    const status = statuses[data.status];
    const when = schedule(data.starts_at, data.ends_at);
    const sideFailed = candidates.isError || lookups.isError;

    return (
        <div className="mx-auto max-w-[1440px]">
            <BackLink />

            <header className="mt-4">
                <div className="brand-stripe h-1 w-12 rounded-full" aria-hidden="true" />
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-balance text-stone-900">
                        {data.title}
                    </h1>
                    <span className={`${chipClass} ${status.chip}`}>{status.label}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                    <Meta icon={<TagIcon className="size-4" />}>{data.event_type.label}</Meta>
                    <Meta icon={<PinIcon className="size-4" />}>
                        {data.location?.name ?? 'No location set'}
                    </Meta>
                    <Meta icon={<CalendarIcon className="size-4" />}>
                        <span className="tabular-nums">
                            {when.day}, {when.time}
                        </span>
                    </Meta>
                </div>
                {data.description && (
                    <p className="mt-4 max-w-3xl text-pretty whitespace-pre-line text-stone-700">
                        {data.description}
                    </p>
                )}
            </header>

            {sideFailed && (
                <div className="mt-6 flex max-w-2xl flex-wrap items-start gap-3">
                    <div className="flex-1">
                        <Alert tone="error">
                            The people or task types did not load, so you cannot assign yet.
                        </Alert>
                    </div>
                    <Button
                        variant="secondary"
                        size="md"
                        loading={candidates.isFetching || lookups.isFetching}
                        onClick={() => {
                            void candidates.refetch();
                            void lookups.refetch();
                        }}
                    >
                        Retry
                    </Button>
                </div>
            )}

            <div className="mt-8 grid gap-6 xl:grid-cols-2">
                {(['marshal', 'volunteer'] as const).map((role) => (
                    <RoleSection
                        key={role}
                        eventId={eventId}
                        role={role}
                        assignments={assignments.filter((row) => row.role === role)}
                        candidates={candidates.data ?? []}
                        candidatesReady={candidates.isSuccess}
                        taskTypes={lookups.data?.task_types ?? []}
                    />
                ))}
            </div>
        </div>
    );
}
