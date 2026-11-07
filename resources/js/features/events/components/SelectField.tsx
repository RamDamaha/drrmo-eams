// Labelled native select styled like TextField, with a line chevron and an error line.
import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import { ChevronIcon } from './icons';

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
    label: string;
    // The empty first option, for example "Choose a location".
    placeholder: string;
    error?: string | null;
    // lg (48 px) for forms, md (40 px) for dense admin rows.
    size?: 'md' | 'lg';
    children: ReactNode;
}

export function SelectField({
    label,
    placeholder,
    error,
    size = 'lg',
    id,
    value,
    className = '',
    children,
    ...rest
}: SelectFieldProps) {
    const autoId = useId();
    const selectId = id ?? autoId;
    const errorId = error ? `${selectId}-error` : undefined;
    const sizing = size === 'lg' ? 'min-h-12 text-base' : 'min-h-10 text-sm';

    return (
        <div className={className}>
            <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-stone-800">
                {label}
            </label>
            <div className="relative">
                <select
                    id={selectId}
                    value={value}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={errorId}
                    className={`block w-full cursor-pointer appearance-none rounded-control border bg-white pr-11 pl-3.5 transition-colors focus:border-maroon-700 focus:ring-3 focus:ring-maroon-700/15 focus:outline-none disabled:cursor-not-allowed disabled:bg-stone-50 ${sizing} ${value ? 'text-stone-900' : 'text-stone-500'} ${error ? 'border-red-600' : 'border-stone-300 hover:border-stone-400'}`}
                    {...rest}
                >
                    <option value="">{placeholder}</option>
                    {children}
                </select>
                <ChevronIcon className="pointer-events-none absolute top-1/2 right-3.5 size-5 -translate-y-1/2 text-stone-500" />
            </div>
            {error && (
                <p id={errorId} className="mt-1.5 text-sm font-medium text-red-700">
                    {error}
                </p>
            )}
        </div>
    );
}

// Options inside a muted select keep the normal text color.
export function SelectOption({
    value,
    disabled,
    children,
}: {
    value: string | number;
    disabled?: boolean;
    children: ReactNode;
}) {
    return (
        <option
            value={value}
            disabled={disabled}
            className="text-stone-900 disabled:text-stone-500"
        >
            {children}
        </option>
    );
}
