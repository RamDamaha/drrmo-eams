// Ends the session and returns to the login page. Used by both layouts.
import { useNavigate } from 'react-router';
import { useAuthActions } from './auth';

export function SignOutButton({ className = '' }: { className?: string }) {
    const { logout } = useAuthActions();
    const navigate = useNavigate();

    async function signOut() {
        await logout();
        await navigate('/login', { replace: true });
    }

    return (
        <button type="button" onClick={signOut} className={className}>
            Sign out
        </button>
    );
}
