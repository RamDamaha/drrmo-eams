// Waiting for approval (M-Waiting in SCREENS.md). Shown after the email is confirmed.
import { AuthLayout, AuthLink } from '@/app/AuthLayout';
import { Alert } from '@/shared/ui/Alert';

export function WaitingForApproval() {
    return (
        <AuthLayout title="Waiting for approval">
            <div className="mt-8 space-y-5">
                <Alert tone="success">Your email is confirmed.</Alert>
                <p className="text-stone-700">
                    The DRRMO office will review your request. You will get an email when it is
                    approved or if it cannot be approved. Until then you cannot sign in.
                </p>
                <p className="text-sm">
                    <AuthLink to="/login">Back to sign in</AuthLink>
                </p>
            </div>
        </AuthLayout>
    );
}
