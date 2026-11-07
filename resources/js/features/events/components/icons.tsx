// Line icons for the events screens: 24 px grid, 1.8 stroke, round caps (DESIGN_SYSTEM.md section 6).
import type { ReactNode } from 'react';

function Icon({ className = 'size-5', children }: { className?: string; children: ReactNode }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {children}
        </svg>
    );
}

export function PlusIcon({ className }: { className?: string }) {
    return (
        <Icon className={className}>
            <path d="M12 5v14M5 12h14" />
        </Icon>
    );
}

export function ChevronIcon({ className }: { className?: string }) {
    return (
        <Icon className={className}>
            <path d="m6 9 6 6 6-6" />
        </Icon>
    );
}

export function CalendarIcon({ className }: { className?: string }) {
    return (
        <Icon className={className}>
            <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
            <path d="M3.5 10h17M8 3v4M16 3v4" />
        </Icon>
    );
}

export function PinIcon({ className }: { className?: string }) {
    return (
        <Icon className={className}>
            <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
            <circle cx="12" cy="10" r="2.5" />
        </Icon>
    );
}

export function TagIcon({ className }: { className?: string }) {
    return (
        <Icon className={className}>
            <path d="M3.5 12.1V4.5a1 1 0 0 1 1-1h7.6l8.4 8.4a1 1 0 0 1 0 1.4l-7.2 7.2a1 1 0 0 1-1.4 0Z" />
            <circle cx="8" cy="8" r="1.3" />
        </Icon>
    );
}

export function PeopleIcon({ className }: { className?: string }) {
    return (
        <Icon className={className}>
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6" />
        </Icon>
    );
}

export function ClockIcon({ className }: { className?: string }) {
    return (
        <Icon className={className}>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7.5V12l3 2" />
        </Icon>
    );
}

export function ClipboardIcon({ className }: { className?: string }) {
    return (
        <Icon className={className}>
            <path d="M9 4.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-13a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="3" rx="1" />
            <path d="M9 12h6M9 16h4" />
        </Icon>
    );
}

export function SlidersIcon({ className }: { className?: string }) {
    return (
        <Icon className={className}>
            <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
            <circle cx="15" cy="7" r="2" />
            <circle cx="9" cy="17" r="2" />
        </Icon>
    );
}
