// Inline message box. "error" is announced to screen readers right away.
import type { ReactNode } from 'react';

const tones = {
    error: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    success: 'border-green-200 bg-green-50 text-green-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
};

export function Alert({
    tone = 'info',
    children,
}: {
    tone?: keyof typeof tones;
    children: ReactNode;
}) {
    return (
        <div
            role={tone === 'error' ? 'alert' : 'status'}
            className={`flex gap-2.5 rounded-control border px-3.5 py-3 text-sm ${tones[tone]}`}
        >
            <svg
                viewBox="0 0 20 20"
                className="mt-0.5 size-4 shrink-0"
                fill="currentColor"
                aria-hidden="true"
            >
                <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.5a.75.75 0 0 0-1.5 0v4a.75.75 0 0 0 1.5 0v-4ZM10 14.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                    clipRule="evenodd"
                />
            </svg>
            <div>{children}</div>
        </div>
    );
}
