// Reset password (M-Reset password in SCREENS.md). Opened from the emailed link,
// which carries the token and email in the address.
import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { AuthLayout, AuthLink } from '@/app/AuthLayout';
import { resetPassword } from '@/app/auth';
import { ApiError } from '@/shared/api/client';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { PasswordField } from '@/shared/ui/PasswordField';

const MIN_LENGTH = 12;

interface ValidationBody {
    errors?: Record<string, string[]>;
}

function messageFor(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.status === 429) return 'Too many attempts. Wait a few minutes and try again.';
        if (error.status === 422) {
            const passwordError = (error.body as ValidationBody | null)?.errors?.password?.[0];
            return (
                passwordError ?? 'This reset link is not valid or has expired. Ask for a new one.'
            );
        }
    }
    return 'Something went wrong. Check your connection and try again.';
}

export function ResetPassword() {
    const [params] = useSearchParams();
    const token = params.get('token') ?? '';
    const email = params.get('email') ?? '';
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [done, setDone] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    if (!token || !email) {
        return (
            <AuthLayout title="Reset password">
                <div className="mt-8 space-y-5">
                    <Alert tone="error">
                        This reset link is not complete. Open the link from your email again, or ask
                        for a new one.
                    </Alert>
                    <p className="text-sm">
                        <AuthLink to="/forgot-password">Ask for a new link</AuthLink>
                    </p>
                </div>
            </AuthLayout>
        );
    }

    async function submit(event: FormEvent) {
        event.preventDefault();
        setError(null);
        if (password.length < MIN_LENGTH) {
            setError(`Use at least ${MIN_LENGTH} characters.`);
            return;
        }
        if (password !== confirmation) {
            setError('The two passwords do not match.');
            return;
        }
        setBusy(true);
        try {
            setDone(
                await resetPassword({
                    token,
                    email,
                    password,
                    password_confirmation: confirmation,
                }),
            );
        } catch (caught) {
            setError(messageFor(caught));
        } finally {
            setBusy(false);
        }
    }

    return (
        <AuthLayout title="Set a new password" subtitle={`For ${email}`}>
            {done ? (
                <div className="mt-8 space-y-5">
                    <Alert tone="success">{done}</Alert>
                    <p className="text-sm text-stone-600">
                        You were signed out on every device. Sign in again with your new password.
                    </p>
                    <p className="text-sm">
                        <AuthLink to="/login">Go to sign in</AuthLink>
                    </p>
                </div>
            ) : (
                <>
                    <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
                        <PasswordField
                            label="New password"
                            autoComplete="new-password"
                            hint={`At least ${MIN_LENGTH} characters. A short sentence is easy to remember.`}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <PasswordField
                            label="Type it again"
                            autoComplete="new-password"
                            value={confirmation}
                            onChange={(e) => setConfirmation(e.target.value)}
                            required
                        />

                        {error && <Alert tone="error">{error}</Alert>}

                        <Button type="submit" block loading={busy}>
                            {busy ? 'Saving...' : 'Save new password'}
                        </Button>
                    </form>

                    <p className="mt-5 text-sm">
                        <AuthLink to="/login">Back to sign in</AuthLink>
                    </p>
                </>
            )}
        </AuthLayout>
    );
}
