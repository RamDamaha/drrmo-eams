// Landing and login screen (M-Login in SCREENS.md). The brand frame lives in AuthLayout.
import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { AuthLayout, AuthLink } from '@/app/AuthLayout';
import { useAuthActions, useMe } from '@/app/auth';
import { ApiError } from '@/shared/api/client';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { PasswordField } from '@/shared/ui/PasswordField';
import { TextField } from '@/shared/ui/TextField';

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
        <AuthLayout title="Sign in" subtitle="Use the account given to you by the DRRMO office.">
            <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
                <TextField
                    label="Email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <PasswordField
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                {error && <Alert tone="error">{error}</Alert>}

                <Button type="submit" block loading={busy}>
                    {busy ? 'Signing in...' : 'Sign in'}
                </Button>
            </form>

            <p className="mt-5 text-sm">
                <AuthLink to="/forgot-password">Forgot your password?</AuthLink>
            </p>
        </AuthLayout>
    );
}
