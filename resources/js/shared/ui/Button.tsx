// Shared button. Variants and sizes follow docs/DESIGN_SYSTEM.md section 5.
import type { ComponentProps } from 'react';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'duty';

const variants: Record<Variant, string> = {
    primary:
        'bg-maroon-700 text-white hover:bg-maroon-800 active:bg-maroon-900 disabled:bg-maroon-700/60',
    secondary:
        'border border-stone-300 bg-white text-stone-800 hover:bg-stone-50 active:bg-stone-100 disabled:text-stone-400',
    ghost: 'text-maroon-700 hover:bg-maroon-50 active:bg-maroon-100 disabled:text-stone-400',
    danger: 'bg-red-700 text-white hover:bg-red-800 active:bg-red-900 disabled:bg-red-700/60',
    duty: 'bg-ember-600 text-white hover:bg-ember-700 active:bg-ember-800 disabled:bg-ember-600/60',
};

interface ButtonProps extends ComponentProps<'button'> {
    variant?: Variant;
    size?: 'md' | 'lg';
    block?: boolean;
    loading?: boolean;
}

export function Button({
    variant = 'primary',
    size = 'lg',
    block = false,
    loading = false,
    disabled,
    className = '',
    children,
    type = 'button',
    ...rest
}: ButtonProps) {
    const sizing = size === 'lg' ? 'min-h-12 px-5 text-base' : 'min-h-10 px-4 text-sm';
    return (
        <button
            type={type}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={`inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors disabled:cursor-not-allowed ${sizing} ${block ? 'w-full' : ''} ${variants[variant]} ${className}`}
            {...rest}
        >
            {loading && <Spinner />}
            {children}
        </button>
    );
}
