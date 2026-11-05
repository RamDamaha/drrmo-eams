// Login screen. Phone friendly: one column, large fields and button.
import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAuthActions, useMe } from '@/app/auth';
import { ApiError } from '@/shared/api/client';

function messageFor(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.status === 429) return 'Too many attempts. Wait a minute and try again.';
        if (error.status === 422) return 'The email or password is wrong.';
    }
    return 'Something went wrong. Check your connection and try again.';
}

export function Login() {
    const { data: me } = useMe();
    const { login } = useAuthActions();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    if (me) return <Navigate to={me.home} replace />;

    async function submit(event: FormEvent) {
        event.preventDefault();
        setBusy(true);
        setError(null);
        try {
            const user = await login(email, password);
            await navigate(user.home, { replace: true });
        } catch (caught) {
            setError(messageFor(caught));
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
            <h1 className="mb-1 text-2xl font-semibold text-red-700">DRRMO</h1>
            <p className="mb-6 text-gray-600">Sign in to see your duties.</p>
            <form onSubmit={submit} className="space-y-4" noValidate>
                <label className="block">
                    <span className="mb-1 block text-base">Email</span>
                    <input
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="min-h-12 w-full rounded border border-gray-300 px-3 text-base"
                        required
                    />
                </label>
                <label className="block">
                    <span className="mb-1 block text-base">Password</span>
                    <input
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="min-h-12 w-full rounded border border-gray-300 px-3 text-base"
                        required
                    />
                </label>
                {error && (
                    <p role="alert" className="text-red-700">
                        {error}
                    </p>
                )}
                <button
                    type="submit"
                    disabled={busy}
                    className="min-h-12 w-full rounded bg-red-700 px-4 text-base font-semibold text-white disabled:opacity-60"
                >
                    {busy ? 'Signing in...' : 'Sign in'}
                </button>
            </form>
        </main>
    );
}
