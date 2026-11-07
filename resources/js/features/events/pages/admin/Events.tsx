// A-Events list (SCREENS.md). Admin sees every event, newest first.
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { listEvents } from '@/features/events/api';

const statusLabels = {
    draft: 'Draft',
    published: 'Published',
    cancelled: 'Cancelled',
    completed: 'Completed',
};

function when(value: string) {
    return new Date(value).toLocaleString();
}

export function Events() {
    const list = useQuery({ queryKey: ['events'], queryFn: listEvents });

    return (
        <div>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-stone-900">Events</h1>
                    <p className="mt-1 text-stone-600">Campus events that need DRRMO personnel.</p>
                </div>
                <Link
                    to="/admin/events/new"
                    className="inline-flex min-h-10 items-center rounded-control bg-maroon-700 px-4 text-sm font-medium text-white hover:bg-maroon-800"
                >
                    New event
                </Link>
            </div>

            <div className="mt-5 overflow-x-auto rounded-control border border-stone-200 bg-white">
                <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 text-stone-600">
                        <tr>
                            <th className="px-4 py-3 font-medium">Title</th>
                            <th className="px-4 py-3 font-medium">Location</th>
                            <th className="px-4 py-3 font-medium">Starts</th>
                            <th className="px-4 py-3 font-medium">Ends</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {list.isPending && (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-stone-500">
                                    Loading...
                                </td>
                            </tr>
                        )}
                        {list.isError && (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-red-700">
                                    Could not load the events.
                                </td>
                            </tr>
                        )}
                        {list.data?.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-stone-500">
                                    No events yet. Create the first one.
                                </td>
                            </tr>
                        )}
                        {list.data?.map((event) => (
                            <tr key={event.id}>
                                <td className="px-4 py-3 font-medium text-stone-900">
                                    {event.title}
                                </td>
                                <td className="px-4 py-3 text-stone-700">
                                    {event.location?.name}
                                </td>
                                <td className="px-4 py-3 text-stone-600">{when(event.starts_at)}</td>
                                <td className="px-4 py-3 text-stone-600">{when(event.ends_at)}</td>
                                <td className="px-4 py-3 text-stone-700">
                                    {statusLabels[event.status]}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
