// Landing and login screen (M-Login in SCREENS.md). Phone first: slim brand bar, then the form.
// On wide screens it splits into a maroon brand column on the left and the form on the right.
import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAuthActions, useMe } from '@/app/auth';
import { ApiError } from '@/shared/api/client';
import { Alert } from '@/shared/ui/Alert';
import { BrandLogos } from '@/shared/ui/BrandLogos';
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

const year = new Date().getFullYear();

// Logos and office names. On phones this is a slim header bar; on desktop it fills the left column.
function BrandPanel() {
    return (
        <section aria-label="ZPPSU DRRMO" className="on-dark bg-maroon-900 text-white lg:flex">
            <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-6 py-6 text-center sm:max-w-lg lg:max-w-none lg:items-start lg:justify-between lg:gap-0 lg:px-14 lg:py-12 lg:text-left xl:px-16">
                <div className="flex shrink-0 items-center gap-4">
                    <BrandLogos size="md" className="shrink-0 text-white lg:[&_img]:size-16" />
                    <div className="hidden leading-snug lg:block">
                        <p className="text-sm text-white/80">
                            Zamboanga Peninsula Polytechnic State University
                        </p>
                        <p className="text-sm font-semibold text-gold-300">
                            Disaster Risk Reduction and Management Office
                        </p>
                    </div>
                </div>

                <div className="leading-snug lg:hidden">
                    <p className="text-xs text-white/80">
                        Zamboanga Peninsula Polytechnic State University
                    </p>
                    <p className="text-xs font-semibold text-gold-300">
                        Disaster Risk Reduction and Management Office
                    </p>
                </div>

                <div className="hidden max-w-md lg:block">
                    <div className="h-0.5 w-10 bg-gold-400" aria-hidden="true" />
                    <p className="mt-6 text-4xl leading-tight font-semibold tracking-tight text-balance">
                        Personnel Event Assignment and Monitoring System
                    </p>
                    <p className="mt-4 text-base leading-relaxed text-pretty text-white/75">
                        Plan campus events, assign marshals and volunteers, and follow each duty
                        from start to end.
                    </p>
                </div>

                <p className="hidden text-sm text-white/60 lg:block">Zamboanga City, Philippines</p>
            </div>
        </section>
    );
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
        <div className="flex min-h-dvh flex-col bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <BrandPanel />

            <main className="flex flex-1 flex-col px-6 pt-10 pb-8 sm:px-10 lg:px-14 lg:pt-12">
                <div className="mx-auto mb-12 w-full max-w-md lg:my-auto lg:max-w-sm">
                    <p className="mb-2 text-sm font-semibold text-maroon-700 lg:hidden">
                        Personnel Event Assignment and Monitoring System
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight text-stone-900 lg:text-[1.75rem]">
                        Sign in
                    </h1>
                    <p className="mt-1 text-pretty text-stone-600">
                        Use the account given to you by the DRRMO office.
                    </p>

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

                        <Button type="submit" block loading={busy} className="mt-1">
                            {busy ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </form>

                    <p className="mt-6 text-sm text-pretty text-stone-600">
                        Forgot your password? Ask the DRRMO office to reset it.
                    </p>
                </div>

                <footer className="mx-auto mt-auto w-full max-w-md border-t border-stone-200 pt-5 text-xs leading-relaxed text-stone-500 lg:mt-0 lg:max-w-sm">
                    <p className="text-pretty">
                        Personal data is handled under the Data Privacy Act of 2012 (RA 10173).
                        Location is shared only while you are on duty.
                    </p>
                    <p className="mt-2">© {year} ZPPSU DRRMO</p>
                </footer>
            </main>
        </div>
    );
}
