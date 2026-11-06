// Confirm email (M-Confirm email in SCREENS.md). Enter the 6 digit code sent by email.
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AuthLayout, AuthLink } from '@/app/AuthLayout';
import { confirmEmail, resendCode } from '@/features/personnel/registration';
import { ApiError } from '@/shared/api/client';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/TextField';

const RESEND_WAIT = 60;

export function VerifyEmail() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const email = params.get('email') ?? '';
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [locked, setLocked] = useState(false);
    const [busy, setBusy] = useState(false);
    const [wait, setWait] = useState(RESEND_WAIT);

    useEffect(() => {
        if (wait <= 0) return;
        const timer = setTimeout(() => setWait((w) => w - 1), 1000);
        return () => clearTimeout(timer);
    }, [wait]);

    if (!email) {
        return (
            <AuthLayout title="Confirm your email">
                <div className="mt-8 space-y-5">
                    <Alert tone="error">Start from the request access form.</Alert>
                    <p className="text-sm">
                        <AuthLink to="/register">Request access</AuthLink>
                    </p>
                </div>
            </AuthLayout>
        );
    }

    async function submit(event: FormEvent) {
        event.preventDefault();
        setError(null);
        setNotice(null);
        if (!/^\d{6}$/.test(code)) {
            setError('Enter the 6 digit code from the email.');
            return;
        }
        setBusy(true);
        try {
            await confirmEmail(email, code);
            await navigate('/register/pending', { replace: true });
        } catch (caught) {
            if (caught instanceof ApiError && caught.status === 422) {
                const body = caught.body as { code?: string } | null;
                if (body?.code === 'code_locked') {
                    setLocked(true);
                    setError('Too many wrong codes. Ask for a new code.');
                } else {
                    setError('That code is wrong or has expired.');
                }
            } else if (caught instanceof ApiError && caught.status === 429) {
                setError('Too many attempts. Wait a few minutes and try again.');
            } else {
                setError('Something went wrong. Check your connection and try again.');
            }
        } finally {
            setBusy(false);
        }
    }

    async function resend() {
        setError(null);
        setNotice(null);
        try {
            await resendCode(email);
            setLocked(false);
            setCode('');
            setWait(RESEND_WAIT);
            setNotice('If this email can be used, we sent a new code.');
        } catch {
            setError('Could not send a new code. Wait a few minutes and try again.');
        }
    }

    return (
        <AuthLayout
            title="Confirm your email"
            subtitle={`We sent a 6 digit code to ${email}. It works for 10 minutes.`}
        >
            <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
                <TextField
                    label="Confirmation code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    disabled={locked}
                    className="[&_input]:text-center [&_input]:text-2xl [&_input]:tracking-[0.5em]"
                    required
                />

                {error && <Alert tone="error">{error}</Alert>}
                {notice && <Alert tone="success">{notice}</Alert>}

                <Button type="submit" block loading={busy} disabled={locked}>
                    {busy ? 'Checking...' : 'Confirm email'}
                </Button>
            </form>

            <div className="mt-5 flex items-center justify-between text-sm">
                <Button variant="ghost" size="md" onClick={resend} disabled={wait > 0 && !locked}>
                    {wait > 0 && !locked ? `Send a new code in ${wait}s` : 'Send a new code'}
                </Button>
                <AuthLink to="/login">Back to sign in</AuthLink>
            </div>
        </AuthLayout>
    );
}
