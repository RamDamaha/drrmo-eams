// Asks "Sign out?" first, then ends the session and returns to the login page. Used by both layouts.
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { useAuthActions } from './auth';

// children replaces the plain "Sign out" text, for example with an icon and a label.
export function SignOutButton({
    className = '',
    children = 'Sign out',
}: {
    className?: string;
    children?: ReactNode;
}) {
    const { logout } = useAuthActions();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);

    async function signOut() {
        if (loading) return;
        setFailed(false);
        setLoading(true);
        try {
            await logout();
        } catch {
            setLoading(false);
            setFailed(true);
            return;
        }
        await navigate('/login', { replace: true });
    }

    function cancel() {
        setFailed(false);
        setOpen(false);
    }

    return (
        <>
            <button type="button" onClick={() => setOpen(true)} className={className}>
                {children}
            </button>
            <ConfirmDialog
                open={open}
                title="Sign out?"
                description="You will need your email and password to sign in again."
                confirmLabel="Sign out"
                loadingLabel="Signing out..."
                loading={loading}
                error={failed ? 'Could not sign out. Try again.' : null}
                onConfirm={signOut}
                onCancel={cancel}
            />
        </>
    );
}
