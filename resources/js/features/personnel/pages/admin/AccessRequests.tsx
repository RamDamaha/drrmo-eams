// A-Access requests (SCREENS.md). Admin approves or rejects volunteer sign up requests.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import {
    approveRequest,
    listRequests,
    rejectRequest,
    type AccessRequest,
    type RequestStatus,
} from '@/features/personnel/registration';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/TextField';

const filters: { value: RequestStatus | 'all'; label: string }[] = [
    { value: 'pending_approval', label: 'Waiting for review' },
    { value: 'pending_email', label: 'Email not confirmed' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'active', label: 'Approved' },
    { value: 'all', label: 'All' },
];

const statusLabels: Record<RequestStatus, string> = {
    pending_email: 'Email not confirmed',
    pending_approval: 'Waiting for review',
    active: 'Approved',
    rejected: 'Rejected',
};

function when(value: string | null) {
    return value ? new Date(value).toLocaleString() : '';
}

export function AccessRequests() {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<RequestStatus | 'all'>('pending_approval');
    const [rejecting, setRejecting] = useState<AccessRequest | null>(null);
    const [reason, setReason] = useState('');
    const [error, setError] = useState<string | null>(null);

    const list = useQuery({
        queryKey: ['access-requests', filter],
        queryFn: () => listRequests(filter),
    });

    const done = () => queryClient.invalidateQueries({ queryKey: ['access-requests'] });
    const failed = () => setError('That did not work. Refresh the list and try again.');

    const approve = useMutation({
        mutationFn: approveRequest,
        onSuccess: done,
        onError: failed,
    });
    const reject = useMutation({
        mutationFn: ({ id, text }: { id: number; text: string }) => rejectRequest(id, text),
        onSuccess: () => {
            setRejecting(null);
            setReason('');
            return done();
        },
        onError: failed,
    });

    function submitReject(event: FormEvent) {
        event.preventDefault();
        if (rejecting && reason.trim().length >= 3) {
            setError(null);
            reject.mutate({ id: rejecting.id, text: reason.trim() });
        }
    }

    return (
        <div>
            <h1 className="text-2xl font-semibold text-stone-900">Access requests</h1>
            <p className="mt-1 text-stone-600">
                Volunteers who asked for an account. Approving lets them sign in.
            </p>

            <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
                {filters.map((item) => (
                    <button
                        key={item.value}
                        type="button"
                        onClick={() => setFilter(item.value)}
                        aria-pressed={filter === item.value}
                        className={`min-h-10 rounded-control border px-3 text-sm font-medium ${filter === item.value ? 'border-maroon-700 bg-maroon-50 text-maroon-800' : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'}`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="mt-4">
                    <Alert tone="error">{error}</Alert>
                </div>
            )}

            <div className="mt-5 overflow-x-auto rounded-control border border-stone-200 bg-white">
                <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 text-stone-600">
                        <tr>
                            <th className="px-4 py-3 font-medium">Name</th>
                            <th className="px-4 py-3 font-medium">Email</th>
                            <th className="px-4 py-3 font-medium">Requested</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">
                                <span className="sr-only">Actions</span>
                            </th>
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
                                    Could not load the requests.
                                </td>
                            </tr>
                        )}
                        {list.data?.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-stone-500">
                                    No requests here.
                                </td>
                            </tr>
                        )}
                        {list.data?.map((row) => (
                            <tr key={row.id}>
                                <td className="px-4 py-3 font-medium text-stone-900">{row.name}</td>
                                <td className="px-4 py-3 text-stone-700">{row.email}</td>
                                <td className="px-4 py-3 text-stone-600">
                                    {when(row.requested_at)}
                                </td>
                                <td className="px-4 py-3 text-stone-700">
                                    {statusLabels[row.account_status]}
                                    {row.rejection_reason && (
                                        <span className="block text-stone-500">
                                            {row.rejection_reason}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    {row.account_status === 'pending_approval' && (
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="md"
                                                loading={
                                                    approve.isPending &&
                                                    approve.variables === row.id
                                                }
                                                onClick={() => {
                                                    setError(null);
                                                    approve.mutate(row.id);
                                                }}
                                                aria-label={`Approve ${row.name}`}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                size="md"
                                                variant="secondary"
                                                onClick={() => {
                                                    setRejecting(row);
                                                    setReason('');
                                                }}
                                                aria-label={`Reject ${row.name}`}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {rejecting && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="reject-title"
                    className="fixed inset-0 z-10 flex items-center justify-center bg-stone-900/50 p-4"
                >
                    <form
                        onSubmit={submitReject}
                        className="w-full max-w-md space-y-4 rounded-control bg-white p-6"
                    >
                        <h2 id="reject-title" className="text-lg font-semibold text-stone-900">
                            Reject {rejecting.name}
                        </h2>
                        <TextField
                            label="Reason"
                            hint="The person receives this reason by email. It is also kept in the audit log."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            maxLength={500}
                            required
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setRejecting(null)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="danger"
                                loading={reject.isPending}
                                disabled={reason.trim().length < 3}
                            >
                                Reject request
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
