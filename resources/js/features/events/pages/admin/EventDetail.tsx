// A-Event detail (SCREENS.md). Admin sees the event, adds duty requirements and fills them with people.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import {
    assignPerson,
    cancelEvent,
    createRequirement,
    getEvent,
    getLookups,
    listCandidates,
    publishEvent,
    removeAssignment,
    removeRequirement,
    type EventSummary,
    type Option,
    type Requirement,
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
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { TextField } from '@/shared/ui/TextField';

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

interface CardProps {
    requirement: Requirement;
    editable: boolean;
}

const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dayTime = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
});

function shiftText(startsAt: string, endsAt: string) {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    return start.toDateString() === end.toDateString()
        ? `${dayTime.format(start)} to ${time.format(end)}`
        : `${dayTime.format(start)} to ${dayTime.format(end)}`;
}

function RequirementCard({ requirement, editable }: CardProps) {
    const queryClient = useQueryClient();
    const [userId, setUserId] = useState('');
    const [error, setError] = useState<string | null>(null);
    const labels = roleLabels[requirement.role];
    const headingId = `requirement-${requirement.id}`;
    const full = requirement.assignments.length >= requirement.headcount;

    const candidates = useQuery({
        queryKey: ['requirement-candidates', requirement.id],
        queryFn: () => listCandidates(requirement.id),
        enabled: editable,
    });

    const refresh = () =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: ['event'] }),
            queryClient.invalidateQueries({ queryKey: ['requirement-candidates'] }),
        ]);
    const failed = (failure: unknown) =>
        setError(
            failure instanceof ApiError && failure.status === 422
                ? 'That did not work. The duty may be full or the person already assigned. Refresh and try again.'
                : 'That did not work. Check your connection and try again.',
        );

    const add = useMutation({
        mutationFn: () => assignPerson(requirement.id, Number(userId)),
        onSuccess: () => {
            setUserId('');
            return refresh();
        },
        onError: failed,
    });
    const remove = useMutation({
        mutationFn: removeAssignment,
        onSuccess: refresh,
        onError: failed,
    });
    const dropDuty = useMutation({
        mutationFn: () => removeRequirement(requirement.id),
        onSuccess: refresh,
        onError: failed,
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        setError(null);
        if (userId) add.mutate();
    }

    const options = candidates.data ?? [];
    const placeholder = !candidates.isSuccess
        ? 'Loading people...'
        : options.length
          ? 'Choose a person'
          : `No ${labels.plural.toLowerCase()} left to add`;

    return (
        <section
            aria-labelledby={headingId}
            className="flex flex-col rounded-card bg-white ring-1 ring-stone-200"
        >
            <header className="border-b border-stone-200 px-6 py-4">
                <div className="flex items-baseline justify-between gap-4">
                    <h2 id={headingId} className="text-lg font-semibold text-stone-900">
                        {requirement.duty_type.name}
                        <span className="ml-2 text-sm font-normal text-stone-600">
                            {labels.plural}
                            {requirement.team_needed ? `, ${requirement.team_needed}` : ''}
                        </span>
                    </h2>
                    <p
                        className={`shrink-0 text-sm tabular-nums ${full ? 'font-medium text-green-800' : 'text-stone-600'}`}
                    >
                        {requirement.assignments.length} of {requirement.headcount} filled
                    </p>
                </div>
                <p className="mt-1 text-sm text-stone-700 tabular-nums">
                    {shiftText(requirement.shift_starts_at, requirement.shift_ends_at)}
                </p>
                {requirement.instructions && (
                    <p className="mt-2 whitespace-pre-line text-sm text-stone-600">
                        {requirement.instructions}
                    </p>
                )}
            </header>

            {requirement.assignments.length === 0 ? (
                <div className="flex flex-1 flex-col items-center px-6 py-8 text-center">
                    <span className="flex size-11 items-center justify-center rounded-control border border-stone-200 text-maroon-700">
                        <PeopleIcon className="size-5" />
                    </span>
                    <p className="mt-3 font-medium text-stone-900">No one assigned yet</p>
                </div>
            ) : (
                <ul className="flex-1 divide-y divide-stone-100">
                    {requirement.assignments.map((row) => {
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
                                {editable && (
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
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {editable && (
                <form
                    onSubmit={submit}
                    className="space-y-4 rounded-b-card border-t border-stone-200 bg-stone-50 px-6 py-5"
                >
                    <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_auto]">
                        <SelectField
                            id={`${headingId}-person`}
                            label={`Add a ${labels.one}`}
                            size="md"
                            placeholder={full ? 'This duty is full' : placeholder}
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            disabled={full || !candidates.isSuccess || options.length === 0}
                        >
                            {options.map((person) => (
                                <SelectOption key={person.id} value={person.id}>
                                    {person.name}
                                </SelectOption>
                            ))}
                        </SelectField>
                        <Button type="submit" size="md" loading={add.isPending} disabled={!userId}>
                            {add.isPending ? 'Assigning...' : 'Assign'}
                        </Button>
                        {requirement.assignments.length === 0 && (
                            <Button
                                type="button"
                                size="md"
                                variant="secondary"
                                loading={dropDuty.isPending}
                                onClick={() => {
                                    setError(null);
                                    dropDuty.mutate();
                                }}
                            >
                                Delete duty
                            </Button>
                        )}
                    </div>
                    {error && <Alert tone="error">{error}</Alert>}
                </form>
            )}
        </section>
    );
}

// Local date and time input value to an exact moment for the server.
const toUtc = (value: string) => (value ? new Date(value).toISOString() : '');

function AddRequirement({ event, taskTypes }: { event: EventSummary; taskTypes: Option[] }) {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [dutyTypeId, setDutyTypeId] = useState('');
    const [role, setRole] = useState('');
    const [team, setTeam] = useState('');
    const [headcount, setHeadcount] = useState('1');
    const [startsAt, setStartsAt] = useState('');
    const [endsAt, setEndsAt] = useState('');
    const [instructions, setInstructions] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    const save = useMutation({
        mutationFn: () =>
            createRequirement(event.id, {
                duty_type_id: Number(dutyTypeId),
                role,
                team_needed: team,
                headcount: Number(headcount),
                shift_starts_at: toUtc(startsAt),
                shift_ends_at: toUtc(endsAt),
                instructions,
            }),
        onSuccess: async () => {
            setOpen(false);
            setDutyTypeId('');
            setRole('');
            setTeam('');
            setHeadcount('1');
            setStartsAt('');
            setEndsAt('');
            setInstructions('');
            await queryClient.invalidateQueries({ queryKey: ['event', event.id] });
        },
        onError: (failure) => {
            const body =
                failure instanceof ApiError
                    ? (failure.body as { errors?: Record<string, string[]> } | null)
                    : null;
            if (failure instanceof ApiError && failure.status === 422 && body?.errors) {
                setErrors(body.errors);
            } else {
                setFormError('That did not work. Check your connection and try again.');
            }
        },
    });

    const first = (key: string) => errors[key]?.[0] ?? null;

    function submit(e: FormEvent) {
        e.preventDefault();
        setErrors({});
        setFormError(null);
        save.mutate();
    }

    if (!open) {
        return (
            <Button variant="secondary" size="md" onClick={() => setOpen(true)}>
                Add duty requirement
            </Button>
        );
    }

    return (
        <form
            onSubmit={submit}
            className="space-y-4 rounded-card bg-white p-6 ring-1 ring-stone-200"
        >
            <h2 className="text-lg font-semibold text-stone-900">New duty requirement</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SelectField
                    label="Duty type"
                    placeholder="Choose a duty"
                    value={dutyTypeId}
                    onChange={(e) => setDutyTypeId(e.target.value)}
                    error={first('duty_type_id')}
                    required
                >
                    {taskTypes.map((task) => (
                        <SelectOption key={task.id} value={task.id}>
                            {task.name}
                        </SelectOption>
                    ))}
                </SelectField>
                <SelectField
                    label="Role needed"
                    placeholder="Choose a role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    error={first('role')}
                    required
                >
                    <SelectOption value="marshal">Marshal</SelectOption>
                    <SelectOption value="volunteer">Volunteer</SelectOption>
                </SelectField>
                <TextField
                    label="Team (optional)"
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    error={first('team_needed')}
                    maxLength={100}
                />
                <TextField
                    label="Headcount"
                    type="number"
                    min={1}
                    value={headcount}
                    onChange={(e) => setHeadcount(e.target.value)}
                    error={first('headcount')}
                    required
                />
                <TextField
                    label="Shift starts"
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    error={first('shift_starts_at')}
                    required
                />
                <TextField
                    label="Shift ends"
                    type="datetime-local"
                    value={endsAt}
                    min={startsAt || undefined}
                    onChange={(e) => setEndsAt(e.target.value)}
                    error={first('shift_ends_at')}
                    required
                />
            </div>
            <div>
                <label
                    htmlFor="requirement-instructions"
                    className="mb-1.5 block text-sm font-medium text-stone-800"
                >
                    Instructions (optional)
                </label>
                <textarea
                    id="requirement-instructions"
                    rows={3}
                    maxLength={2000}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="block w-full rounded-control border border-stone-300 bg-white px-3.5 py-2 text-base text-stone-900 hover:border-stone-400 focus:border-maroon-700 focus:ring-3 focus:ring-maroon-700/15 focus:outline-none"
                />
            </div>
            <p className="text-sm text-stone-600">The shift must sit inside the event time.</p>
            {formError && <Alert tone="error">{formError}</Alert>}
            <div className="flex gap-3">
                <Button type="submit" size="md" loading={save.isPending}>
                    {save.isPending ? 'Saving...' : 'Save duty'}
                </Button>
                <Button type="button" variant="secondary" size="md" onClick={() => setOpen(false)}>
                    Cancel
                </Button>
            </div>
        </form>
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

function EventActions({ event }: { event: EventSummary }) {
    const queryClient = useQueryClient();
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const done = async () => {
        setConfirmCancel(false);
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['event', event.id] }),
            queryClient.invalidateQueries({ queryKey: ['events'] }),
        ]);
    };
    const failed = () => setError('That did not work. Refresh the page and try again.');
    const publish = useMutation({
        mutationFn: () => publishEvent(event.id),
        onSuccess: done,
        onError: failed,
    });
    const cancel = useMutation({
        mutationFn: () => cancelEvent(event.id),
        onSuccess: done,
        onError: failed,
    });

    if (event.status !== 'draft' && event.status !== 'published') return null;

    return (
        <div className="mt-4 flex flex-wrap items-center gap-3">
            {event.status === 'draft' && (
                <Button
                    size="md"
                    loading={publish.isPending}
                    onClick={() => {
                        setError(null);
                        publish.mutate();
                    }}
                >
                    {publish.isPending ? 'Publishing...' : 'Publish event'}
                </Button>
            )}
            <Button
                size="md"
                variant="secondary"
                onClick={() => {
                    setError(null);
                    setConfirmCancel(true);
                }}
            >
                Cancel event
            </Button>
            {error && <Alert tone="error">{error}</Alert>}
            <ConfirmDialog
                open={confirmCancel}
                title="Cancel this event?"
                description="Assigned people will see the event as cancelled. This cannot be undone."
                confirmLabel="Cancel event"
                cancelLabel="Keep event"
                loading={cancel.isPending}
                loadingLabel="Cancelling..."
                onConfirm={() => cancel.mutate()}
                onCancel={() => setConfirmCancel(false)}
            />
        </div>
    );
}

export function EventDetail() {
    const eventId = Number(useParams().id);

    const event = useQuery({ queryKey: ['event', eventId], queryFn: () => getEvent(eventId) });
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
    const requirements: Requirement[] = data.requirements ?? [];
    const status = statuses[data.status];
    const when = schedule(data.starts_at, data.ends_at);
    const editable = data.status === 'draft' || data.status === 'published';

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
                <EventActions event={data} />
            </header>

            {lookups.isError && (
                <div className="mt-6 flex max-w-2xl flex-wrap items-start gap-3">
                    <div className="flex-1">
                        <Alert tone="error">
                            The duty types did not load, so you cannot add duties yet.
                        </Alert>
                    </div>
                    <Button
                        variant="secondary"
                        size="md"
                        loading={lookups.isFetching}
                        onClick={() => void lookups.refetch()}
                    >
                        Retry
                    </Button>
                </div>
            )}

            <h2 className="mt-8 text-lg font-semibold text-stone-900">Duty requirements</h2>
            {requirements.length === 0 ? (
                <p className="mt-2 text-sm text-stone-600">
                    No duties yet. Add what this event needs, then assign people to it.
                </p>
            ) : (
                <div className="mt-4 grid gap-6 xl:grid-cols-2">
                    {requirements.map((requirement) => (
                        <RequirementCard
                            key={requirement.id}
                            requirement={requirement}
                            editable={editable}
                        />
                    ))}
                </div>
            )}

            {editable && lookups.data && (
                <div className="mt-6 max-w-5xl">
                    <AddRequirement event={data} taskTypes={lookups.data.task_types} />
                </div>
            )}
        </div>
    );
}
