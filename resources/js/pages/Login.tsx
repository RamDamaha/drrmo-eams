// Landing and login screen (M-Login in SCREENS.md). The brand frame lives in AuthLayout.
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { AuthLayout, AuthLink } from '@/app/AuthLayout';
import { useAuthActions, useMe } from '@/app/auth';
import { keepLinkedAssignment } from '@/features/events/dutyLink';
import { ApiError } from '@/shared/api/client';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { PasswordField } from '@/shared/ui/PasswordField';
import { TextField } from '@/shared/ui/TextField';

interface LoginProblem {
    message: string;
    // Set when the password was right but the account cannot be used yet.
    code?: string;
}

// The server only names the account state after the password was verified, so these messages
// never reveal whether an email has an account. Wrong password and unknown email stay generic.
const accountMessages: Record<string, string> = {
    email_not_confirmed: 'Confirm your email first. Enter the 6 digit code we sent you.',
    awaiting_approval:
        'Your account is waiting for admin approval. We will email you when it is approved.',
    request_rejected: 'Your access request was not approved. Contact the DRRMO office.',
    account_disabled: 'This account is disabled. Contact the DRRMO office.',
};

function problemFor(error: unknown): LoginProblem {
    if (error instanceof ApiError) {
        if (error.status === 429) {
            return { message: 'Too many attempts. Wait a minute and try again.' };
        }
        if (error.status === 403) {
            const code = (error.body as { code?: string } | null)?.code ?? '';
            if (code in accountMessages) return { message: accountMessages[code], code };
        }
        if (error.status === 422) return { message: 'The email or password is wrong.' };
    }
    return { message: 'Something went wrong. Check your connection and try again.' };
}

export function Login() {
    const { data: me } = useMe();
    const { login } = useAuthActions();
    const navigate = useNavigate();
    const { search } = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [problem, setProblem] = useState<LoginProblem | null>(null);
    const [busy, setBusy] = useState(false);

    if (me) return <Navigate to={keepLinkedAssignment(me.home, search)} replace />;

    async function submit(event: FormEvent) {
        event.preventDefault();
        setBusy(true);
        setProblem(null);
        try {
            const user = await login(email, password);
            await navigate(keepLinkedAssignment(user.home, search), { replace: true });
        } catch (caught) {
            setProblem(problemFor(caught));
        } finally {
            setBusy(false);
        }
    }

    return (
        <AuthLayout
            title="Sign in"
            subtitle="Use the account given to you by the DRRMO office, or one the office approved."
        >
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

                {problem && (
                    <Alert tone={problem.code === 'awaiting_approval' ? 'warning' : 'error'}>
                        <p>{problem.message}</p>
                        {problem.code === 'email_not_confirmed' && (
                            <p className="mt-2">
                                <AuthLink
                                    to={`/register/verify?email=${encodeURIComponent(email)}`}
                                >
                                    Enter your code
                                </AuthLink>
                            </p>
                        )}
                    </Alert>
                )}

                <Button type="submit" block loading={busy}>
                    {busy ? 'Signing in...' : 'Sign in'}
                </Button>
            </form>

            <p className="mt-5 text-sm">
                <AuthLink to="/forgot-password">Forgot your password?</AuthLink>
            </p>
            <p className="mt-2 text-sm">
                Volunteer without an account? <AuthLink to="/register">Request access</AuthLink>
            </p>
        </AuthLayout>
    );
}
