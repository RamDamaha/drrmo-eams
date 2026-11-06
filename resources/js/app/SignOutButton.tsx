// Ends the session and returns to the login page. Used by both layouts.
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthActions } from './auth';

export function SignOutButton({ className = '' }: { className?: string }) {
    const { logout } = useAuthActions();
    const navigate = useNavigate();
    const [failed, setFailed] = useState(false);

    async function signOut() {
        setFailed(false);
        try {
            await logout();
        } catch {
            setFailed(true);
            return;
        }
        await navigate('/login', { replace: true });
    }

    return (
        <>
            <button type="button" onClick={signOut} className={className}>
                Sign out
            </button>
            {failed && <p role="alert">Could not sign out. Try again.</p>}
        </>
    );
}
