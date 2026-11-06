// Ends the session and returns to the login page. Used by both layouts.
// One click starts one sign out. The button is disabled until the server answers, so a double
// click or a slow network cannot send it twice.
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthActions } from './auth';

export function SignOutButton({ className = '' }: { className?: string }) {
    const { logout } = useAuthActions();
    const navigate = useNavigate();
    const [busy, setBusy] = useState(false);
    const [failed, setFailed] = useState(false);
    const running = useRef(false);

    async function signOut() {
        if (running.current) return;
        running.current = true;
        setBusy(true);
        setFailed(false);
        try {
            await logout();
        } catch {
            running.current = false;
            setBusy(false);
            setFailed(true);
            return;
        }
        // Signed out: leave this page for good. The button stays disabled while it unmounts.
        await navigate('/login', { replace: true });
    }

    return (
        <>
            <button
                type="button"
                onClick={signOut}
                disabled={busy}
                aria-busy={busy || undefined}
                className={`${className} disabled:cursor-wait disabled:opacity-60`}
            >
                {busy ? 'Signing out...' : 'Sign out'}
            </button>
            {failed && <p role="alert">Could not sign out. Try again.</p>}
        </>
    );
}
