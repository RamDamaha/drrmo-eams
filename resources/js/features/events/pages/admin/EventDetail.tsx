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
import { controlClass, duration, pickerClass } from '@/features/events/components/fields';
import {
    CalendarIcon,
    ChevronIcon,
    ClipboardIcon,
    ClockIcon,
    PeopleIcon,
    PinIcon,
    PlusIcon,
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
    const filled = requirement.assignments.length;
    const full = filled >= requirement.headcount;
    const open = Math.max(requirement.headcount - filled, 0);
    const percent = Math.min(100, Math.round((filled / requirement.headcount) * 100));

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
            <header className="px-6 pt-5 pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold tracking-[0.14em] text-stone-500 uppercase">
                            {labels.plural}
                            {requirement.team_needed ? `, ${requirement.team_needed}` : ''}
                        </p>
                        <h3 id={headingId} className="mt-1 text-lg font-semibold text-stone-900">
                            {requirement.duty_type.name}
                        </h3>
                    </div>
                    <div className="shrink-0 text-right">
                        <p className="text-sm text-stone-600 tabular-nums">
                            <span className="text-lg font-semibold text-stone-900">{filled}</span>{' '}
                            of {requirement.headcount}
                        </p>
                        <p
                            className={`text-xs font-medium ${full ? 'text-green-800' : 'text-stone-500'}`}
                        >
                            {full ? 'Full' : `${open} open`}
                        </p>
                    </div>
                </div>
                <div
                    className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100"
                    role="progressbar"
                    aria-label={`${requirement.duty_type.name} filled`}
                    aria-valuemin={0}
                    aria-valuemax={requirement.headcount}
                    aria-valuenow={filled}
                >
                    <div
                        className={`h-full rounded-full transition-[width] duration-200 ${full ? 'bg-green-700' : 'bg-maroon-700'}`}
                        style={{ width: `${percent}%` }}
                    />
                </div>
                <p className="mt-3 flex items-center gap-2 text-sm text-stone-700 tabular-nums">
                    <ClockIcon className="size-4 shrink-0 text-stone-500" />
                    {shiftText(requirement.shift_starts_at, requirement.shift_ends_at)}
                </p>
                {requirement.instructions && (
                    <p className="mt-3 border-l-2 border-stone-200 pl-3 text-sm text-pretty whitespace-pre-line text-stone-600">
                        {requirement.instructions}
                    </p>
                )}
            </header>

            <ul className="flex-1 divide-y divide-stone-100 border-t border-stone-200">
                {requirement.assignments.map((row) => {
                    const removing = remove.isPending && remove.variables === row.id;
                    return (
                        <li
                            key={row.id}
                            className="flex min-h-14 items-center gap-3 px-6 py-2.5 transition-colors hover:bg-stone-50"
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
                                    variant="ghost"
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
                {open > 0 && (
                    <li className="flex min-h-14 items-center gap-3 px-6 py-2.5 text-sm text-stone-500">
                        <span
                            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-dashed border-stone-300"
                            aria-hidden="true"
                        >
                            <PeopleIcon className="size-4" />
                        </span>
                        {filled === 0
                            ? `No one assigned yet. ${open} ${open === 1 ? 'spot' : 'spots'} to fill.`
                            : `${open} more ${open === 1 ? labels.one : labels.plural.toLowerCase()} needed.`}
                    </li>
                )}
            </ul>

            {editable && (
                <form
                    onSubmit={submit}
                    className="space-y-3 rounded-b-card border-t border-stone-200 bg-stone-50 px-6 py-4"
                >
                    <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
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
                    </div>
                    {error && <Alert tone="error">{error}</Alert>}
                    {filled === 0 && (
                        <button
                            type="button"
                            disabled={dropDuty.isPending}
                            onClick={() => {
                                setError(null);
                                dropDuty.mutate();
                            }}
                            className="-ml-2 inline-flex min-h-10 items-center rounded-control px-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-progress disabled:opacity-60"
                        >
                            {dropDuty.isPending ? 'Deleting...' : 'Delete this duty'}
                        </button>
                    )}
                </form>
            )}
        </section>
    );
}

// Local date and time input value to an exact moment for the server.
const toUtc = (value: string) => (value ? new Date(value).toISOString() : '');

// Exact moment to a local "YYYY-MM-DDTHH:mm" value for a datetime-local input.
function toLocalInput(iso: string) {
    const date = new Date(iso);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
}

interface AddProps {
    event: EventSummary;
    taskTypes: Option[];
    onClose: () => void;
}

// The shift starts as the whole event, so the common case is one change or none.
function AddRequirement({ event, taskTypes, onClose }: AddProps) {
    const queryClient = useQueryClient();
    const eventStart = toLocalInput(event.starts_at);
    const eventEnd = toLocalInput(event.ends_at);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [dutyTypeId, setDutyTypeId] = useState('');
    const [role, setRole] = useState('');
    const [team, setTeam] = useState('');
    const [headcount, setHeadcount] = useState('1');
    const [startsAt, setStartsAt] = useState(eventStart);
    const [endsAt, setEndsAt] = useState(eventEnd);
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
            await queryClient.invalidateQueries({ queryKey: ['event', event.id] });
            onClose();
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
    const instructionsError = first('instructions');

    function submit(e: FormEvent) {
        e.preventDefault();
        setErrors({});
        setFormError(null);
        save.mutate();
    }

    return (
        <form
            onSubmit={submit}
            aria-labelledby="new-requirement-heading"
            className="mt-6 rounded-card bg-white ring-1 ring-stone-200"
        >
            <div className="px-6 pt-6">
                <h3 id="new-requirement-heading" className="text-lg font-semibold text-stone-900">
                    New duty requirement
                </h3>
                <p className="mt-1 text-sm text-pretty text-stone-600">
                    Say what this event needs. You assign people after you save.
                </p>
            </div>
            <div className={`grid gap-5 px-6 py-6 md:grid-cols-3 ${pickerClass}`}>
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
                    hint="For example, Gate A."
                    maxLength={100}
                />
                <TextField
                    label="People needed"
                    type="number"
                    inputMode="numeric"
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
                    min={eventStart}
                    max={eventEnd}
                    onChange={(e) => setStartsAt(e.target.value)}
                    error={first('shift_starts_at')}
                    required
                />
                <TextField
                    label="Shift ends"
                    type="datetime-local"
                    value={endsAt}
                    min={startsAt || eventStart}
                    max={eventEnd}
                    onChange={(e) => setEndsAt(e.target.value)}
                    error={first('shift_ends_at')}
                    hint={duration(startsAt, endsAt) ?? 'Must sit inside the event time.'}
                    required
                />
                <div className="md:col-span-3">
                    <label
                        htmlFor="requirement-instructions"
                        className="mb-1.5 block text-sm font-medium text-stone-800"
                    >
                        Instructions <span className="font-normal text-stone-500">(optional)</span>
                    </label>
                    <textarea
                        id="requirement-instructions"
                        rows={3}
                        maxLength={2000}
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="Where to report, what to bring, who to call."
                        aria-invalid={instructionsError ? true : undefined}
                        aria-describedby={
                            instructionsError ? 'requirement-instructions-error' : undefined
                        }
                        className={`${controlClass(Boolean(instructionsError))} min-h-24 resize-y py-3 leading-relaxed`}
                    />
                    {instructionsError && (
                        <p
                            id="requirement-instructions-error"
                            className="mt-1.5 text-sm font-medium text-red-700"
                        >
                            {instructionsError}
                        </p>
                    )}
                </div>
            </div>
            <div className="space-y-4 rounded-b-card border-t border-stone-200 bg-stone-50 px-6 py-4">
                {formError && <Alert tone="error">{formError}</Alert>}
                <div className="flex flex-wrap items-center justify-end gap-3">
                    <Button type="button" variant="secondary" size="md" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" size="md" loading={save.isPending}>
                        {save.isPending ? 'Saving...' : 'Save duty'}
                    </Button>
                </div>
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
            <div className="mt-10 border-b border-stone-200 pb-4" aria-hidden="true">
                <div className="h-5 w-44 animate-pulse rounded bg-stone-200" />
                <div className="mt-2 h-4 w-64 animate-pulse rounded bg-stone-200" />
            </div>
            <div className="mt-6 grid gap-6 xl:grid-cols-2" aria-hidden="true">
                {[0, 1].map((card) => (
                    <div key={card} className="rounded-card bg-white p-6 ring-1 ring-stone-200">
                        <div className="h-3 w-20 animate-pulse rounded bg-stone-200" />
                        <div className="mt-2 h-5 w-40 animate-pulse rounded bg-stone-200" />
                        <div className="mt-4 h-1.5 animate-pulse rounded-full bg-stone-200" />
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
        <div className="flex max-w-sm flex-col items-start gap-3 lg:items-end">
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
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
            </div>
            {error && <Alert tone="error">{error}</Alert>}
            <ConfirmDialog
                open={confirmCancel}
                title="Cancel this event?"
                description="Assigned people will see the event as cancelled. This cannot be undone."
                confirmLabel="Cancel event"
                cancelLabel="Keep event"
                tone="danger"
                loading={cancel.isPending}
                loadingLabel="Cancelling..."
                onConfirm={() => cancel.mutate()}
                onCancel={() => setConfirmCancel(false)}
            />
        </div>
    );
}

function NoDuties({ editable }: { editable: boolean }) {
    return (
        <div className="mt-6 flex flex-col items-center rounded-card bg-white px-6 py-12 text-center ring-1 ring-stone-200">
            <span className="flex size-11 items-center justify-center rounded-control border border-stone-200 text-maroon-700">
                <ClipboardIcon className="size-5" />
            </span>
            <p className="mt-4 font-semibold text-stone-900">No duties yet</p>
            <p className="mt-1 max-w-sm text-sm text-pretty text-stone-600">
                {editable
                    ? 'Add what this event needs, then assign marshals and volunteers to each duty.'
                    : 'This event has no duty requirements.'}
            </p>
        </div>
    );
}

export function EventDetail() {
    const eventId = Number(useParams().id);
    const [adding, setAdding] = useState(false);

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
    const needed = requirements.reduce((sum, r) => sum + r.headcount, 0);
    const assigned = requirements.reduce(
        (sum, r) => sum + Math.min(r.assignments.length, r.headcount),
        0,
    );

    return (
        <div className="mx-auto max-w-[1440px]">
            <BackLink />

            <header className="mt-4 flex flex-col gap-x-10 gap-y-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
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
                </div>
                <EventActions event={data} />
            </header>

            {data.status === 'draft' && (
                <div className="mt-6 max-w-3xl">
                    <Alert tone="info">
                        This event is a draft. Assigned people see their duties after you publish
                        it.
                    </Alert>
                </div>
            )}

            <section aria-labelledby="duties-heading" className="mt-10">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-4">
                    <div>
                        <h2 id="duties-heading" className="text-lg font-semibold text-stone-900">
                            Duty requirements
                        </h2>
                        <p className="mt-1 text-sm text-stone-600 tabular-nums">
                            {requirements.length === 0
                                ? 'What this event needs, and who fills it.'
                                : `${requirements.length} ${requirements.length === 1 ? 'duty' : 'duties'}, ${assigned} of ${needed} people assigned.`}
                        </p>
                    </div>
                    {editable && lookups.data && !adding && (
                        <Button variant="secondary" size="md" onClick={() => setAdding(true)}>
                            <PlusIcon className="size-4" />
                            Add duty requirement
                        </Button>
                    )}
                </div>

                {lookups.isError && editable && (
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

                {adding && editable && lookups.data && (
                    <div className="max-w-5xl">
                        <AddRequirement
                            event={data}
                            taskTypes={lookups.data.task_types}
                            onClose={() => setAdding(false)}
                        />
                    </div>
                )}

                {requirements.length === 0 ? (
                    !adding && <NoDuties editable={editable} />
                ) : (
                    <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
                        {requirements.map((requirement) => (
                            <RequirementCard
                                key={requirement.id}
                                requirement={requirement}
                                editable={editable}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
