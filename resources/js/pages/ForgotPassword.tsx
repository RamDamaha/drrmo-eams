// Forgot password (M-Forgot password in SCREENS.md). Sends a reset link by email.
// The success message never says whether the email has an account.
import { useState, type FormEvent } from 'react';
import { AuthLayout, AuthLink } from '@/app/AuthLayout';
import { requestPasswordReset } from '@/app/auth';
import { ApiError } from '@/shared/api/client';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/TextField';

function messageFor(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.status === 429) return 'Too many requests. Wait a few minutes and try again.';
        if (error.status === 422) return 'Enter a valid email address.';
    }
    return 'Something went wrong. Check your connection and try again.';
}

export function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function submit(event: FormEvent) {
        event.preventDefault();
        setBusy(true);
        setError(null);
        try {
            setSent(await requestPasswordReset(email));
        } catch (caught) {
            setError(messageFor(caught));
        } finally {
            setBusy(false);
        }
    }

    return (
        <AuthLayout
            title="Forgot password"
            subtitle="Enter your email and we will send you a link to set a new password."
        >
            {sent ? (
                <div className="mt-8 space-y-5">
                    <Alert tone="success">{sent}</Alert>
                    <p className="text-sm text-stone-600">
                        The link works for 60 minutes. If nothing arrives, check your spam folder or
                        ask the DRRMO office.
                    </p>
                </div>
            ) : (
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

                    {error && <Alert tone="error">{error}</Alert>}

                    <Button type="submit" block loading={busy}>
                        {busy ? 'Sending...' : 'Send reset link'}
                    </Button>
                </form>
            )}

            <p className="mt-5 text-sm">
                <AuthLink to="/login">Back to sign in</AuthLink>
            </p>
        </AuthLayout>
    );
}
