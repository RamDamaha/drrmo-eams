// Password input with a show and hide toggle, so people on phones can check what they typed.
import { useState, type InputHTMLAttributes } from 'react';
import { TextField } from './TextField';

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    hint?: string;
    error?: string | null;
}

export function PasswordField({ label = 'Password', ...rest }: PasswordFieldProps) {
    const [visible, setVisible] = useState(false);

    return (
        <TextField
            label={label}
            type={visible ? 'text' : 'password'}
            trailing={
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    aria-pressed={visible}
                    className="flex size-11 items-center justify-center rounded-control text-stone-500 hover:text-stone-800"
                >
                    <svg
                        viewBox="0 0 24 24"
                        className="size-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="3" />
                        {visible && <path d="M4 4l16 16" />}
                    </svg>
                </button>
            }
            {...rest}
        />
    );
}
