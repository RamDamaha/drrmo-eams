// A-Event form (SCREENS.md). Admin creates an event: title, campus location, start and end.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { createEvent, listLocations } from '@/features/events/api';
import { ApiError } from '@/shared/api/client';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/TextField';

type Errors = Record<string, string[]>;

export function NewEvent() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [locationId, setLocationId] = useState('');
    const [startsAt, setStartsAt] = useState('');
    const [endsAt, setEndsAt] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const [failure, setFailure] = useState<string | null>(null);

    const locations = useQuery({ queryKey: ['event-locations'], queryFn: listLocations });

    const save = useMutation({
        mutationFn: createEvent,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['events'] });
            await navigate('/admin/events');
        },
        onError: (error) => {
            if (error instanceof ApiError && error.status === 422) {
                const body = error.body as { errors?: Errors } | null;
                setErrors(body?.errors ?? {});
            } else {
                setFailure('The event was not saved. Check your connection and try again.');
            }
        },
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        setErrors({});
        setFailure(null);
        save.mutate({
            title: title.trim(),
            description: description.trim(),
            campus_location_id: Number(locationId),
            // The date fields give local time. Convert so the server gets an exact moment.
            starts_at: startsAt ? new Date(startsAt).toISOString() : '',
            ends_at: endsAt ? new Date(endsAt).toISOString() : '',
        });
    }

    const first = (key: string) => errors[key]?.[0] ?? null;

    return (
        <div className="max-w-xl">
            <h1 className="text-2xl font-semibold text-stone-900">New event</h1>
            <p className="mt-1 text-stone-600">
                The event is saved as a draft. Duty requirements come next.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                {failure && <Alert tone="error">{failure}</Alert>}
                {locations.isError && <Alert tone="error">Could not load the locations.</Alert>}

                <TextField
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    error={first('title')}
                    maxLength={255}
                    required
                />

                <div>
                    <label
                        htmlFor="event-description"
                        className="mb-1.5 block text-sm font-medium text-stone-800"
                    >
                        Description (optional)
                    </label>
                    <textarea
                        id="event-description"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={5000}
                        className="block w-full rounded-control border border-stone-300 bg-white px-3.5 py-2 text-base text-stone-900"
                    />
                </div>

                <div>
                    <label
                        htmlFor="event-location"
                        className="mb-1.5 block text-sm font-medium text-stone-800"
                    >
                        Campus location
                    </label>
                    <select
                        id="event-location"
                        value={locationId}
                        onChange={(e) => setLocationId(e.target.value)}
                        aria-invalid={first('campus_location_id') ? true : undefined}
                        className="block min-h-12 w-full rounded-control border border-stone-300 bg-white px-3.5 text-base text-stone-900"
                        required
                    >
                        <option value="">Choose a location</option>
                        {locations.data?.map((location) => (
                            <option key={location.id} value={location.id}>
                                {location.name}
                            </option>
                        ))}
                    </select>
                    {first('campus_location_id') && (
                        <p className="mt-1.5 text-sm font-medium text-red-700">
                            {first('campus_location_id')}
                        </p>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                        label="Starts"
                        type="datetime-local"
                        value={startsAt}
                        onChange={(e) => setStartsAt(e.target.value)}
                        error={first('starts_at')}
                        required
                    />
                    <TextField
                        label="Ends"
                        type="datetime-local"
                        value={endsAt}
                        onChange={(e) => setEndsAt(e.target.value)}
                        error={first('ends_at')}
                        required
                    />
                </div>

                <div className="flex gap-2">
                    <Button type="submit" loading={save.isPending}>
                        Save event
                    </Button>
                    <Link
                        to="/admin/events"
                        className="inline-flex min-h-12 items-center rounded-control border border-stone-300 px-4 text-sm font-medium text-stone-700 hover:bg-stone-50"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}
