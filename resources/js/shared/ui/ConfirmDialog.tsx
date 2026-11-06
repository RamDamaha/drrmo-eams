// Ask before an action. A native <dialog>: centered on desktop, a bottom sheet on phones.
// Rules are in docs/DESIGN_SYSTEM.md section 6.
import { useEffect, useId, useRef } from 'react';
import { Alert } from './Alert';
import { Button } from './Button';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel?: string;
    loading?: boolean;
    loadingLabel?: string;
    error?: string | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel,
    cancelLabel = 'Cancel',
    loading = false,
    loadingLabel,
    error = null,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const opener = useRef<HTMLElement | null>(null);
    const titleId = useId();
    const bodyId = useId();

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) {
            opener.current = document.activeElement as HTMLElement | null;
            dialog.showModal();
            // The safe choice gets focus first.
            cancelRef.current?.focus();
        } else if (!open && dialog.open) {
            dialog.close();
            opener.current?.focus();
            opener.current = null;
        }
    }, [open]);

    // Esc fires "cancel". Handle it ourselves so the parent stays in charge of the state.
    function handleCancel(event: React.SyntheticEvent<HTMLDialogElement>) {
        event.preventDefault();
        if (!loading) onCancel();
    }

    // The dialog has no padding of its own, so a click on the dialog itself is a click on the backdrop.
    function handleClick(event: React.MouseEvent<HTMLDialogElement>) {
        if (event.target === event.currentTarget && !loading) onCancel();
    }

    return (
        <dialog
            ref={dialogRef}
            role="alertdialog"
            aria-labelledby={titleId}
            aria-describedby={bodyId}
            onCancel={handleCancel}
            onClick={handleClick}
            className="animate-dialog-in outline-none m-0 mt-auto w-full max-w-none rounded-t-sheet bg-white p-0 text-stone-600 shadow-raised backdrop:animate-backdrop-in backdrop:bg-stone-950/40 sm:m-auto sm:max-w-sm sm:rounded-card"
        >
            <div className="p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6">
                <h2 id={titleId} className="text-lg font-semibold text-stone-900">
                    {title}
                </h2>
                <p id={bodyId} className="mt-2 text-stone-600">
                    {description}
                </p>
                {error && (
                    <div className="mt-4">
                        <Alert tone="error">{error}</Alert>
                    </div>
                )}
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button
                        ref={cancelRef}
                        variant="secondary"
                        disabled={loading}
                        onClick={onCancel}
                        className="w-full sm:w-auto sm:min-h-10 sm:px-4 sm:text-sm"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant="primary"
                        loading={loading}
                        onClick={onConfirm}
                        className="w-full sm:w-auto sm:min-h-10 sm:px-4 sm:text-sm"
                    >
                        {loading && loadingLabel ? loadingLabel : confirmLabel}
                    </Button>
                </div>
            </div>
        </dialog>
    );
}
