// Labelled text input with optional hint and error. Label always visible, never a placeholder only.
import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    hint?: string;
    error?: string | null;
    // Shown inside the right edge of the input, for example a show password button.
    trailing?: ReactNode;
}

export function TextField({
    label,
    hint,
    error,
    trailing,
    id,
    className = '',
    ...rest
}: TextFieldProps) {
    const autoId = useId();
    const inputId = id ?? autoId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
        <div className={className}>
            <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-stone-800">
                {label}
            </label>
            <div className="relative">
                <input
                    id={inputId}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
                    className={`block min-h-12 w-full rounded-control border bg-white px-3.5 text-base text-stone-900 transition-colors placeholder:text-stone-400 focus:border-maroon-700 focus:ring-3 focus:ring-maroon-700/15 focus:outline-none ${error ? 'border-red-600' : 'border-stone-300 hover:border-stone-400'} ${trailing ? 'pr-12' : ''}`}
                    {...rest}
                />
                {trailing && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                        {trailing}
                    </div>
                )}
            </div>
            {hint && !error && (
                <p id={hintId} className="mt-1.5 text-sm text-stone-500">
                    {hint}
                </p>
            )}
            {error && (
                <p id={errorId} className="mt-1.5 text-sm font-medium text-red-700">
                    {error}
                </p>
            )}
        </div>
    );
}
