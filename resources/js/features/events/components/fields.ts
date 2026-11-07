// Shared field styles and hints for the events forms.

// Same look as TextField's input, for the native textarea.
export function controlClass(error: boolean) {
    return `block w-full rounded-control border bg-white px-3.5 text-base text-stone-900 transition-colors placeholder:text-stone-400 focus:border-maroon-700 focus:ring-3 focus:ring-maroon-700/15 focus:outline-none disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500 ${error ? 'border-red-600' : 'border-stone-300 hover:border-stone-400'}`;
}

// Native date and time pickers: light scheme, and a quiet calendar icon that turns maroon on hover.
export const pickerClass =
    '[&_input]:[color-scheme:light] [&_input]:tabular-nums [&_input::-webkit-calendar-picker-indicator]:cursor-pointer [&_input::-webkit-calendar-picker-indicator]:rounded [&_input::-webkit-calendar-picker-indicator]:p-1 [&_input::-webkit-calendar-picker-indicator]:opacity-60 [&_input::-webkit-calendar-picker-indicator]:transition-opacity [&_input::-webkit-calendar-picker-indicator:hover]:opacity-100 [&_input::-webkit-calendar-picker-indicator:hover]:bg-maroon-50';

// "Lasts 2 h 30 min" under the end field, so a wrong AM or PM is easy to spot.
export function duration(startsAt: string, endsAt: string): string | undefined {
    if (!startsAt || !endsAt) return undefined;
    const minutes = Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000);
    if (Number.isNaN(minutes)) return undefined;
    if (minutes <= 0) return 'Must be after the start.';
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const rest = minutes % 60;
    const parts = [days && `${days} d`, hours && `${hours} h`, rest && `${rest} min`].filter(
        Boolean,
    );
    return `Lasts ${parts.join(' ')}.`;
}
