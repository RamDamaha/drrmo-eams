// Calendar style date tile for phone cards: month, day number, weekday or "Today".
const month = new Intl.DateTimeFormat(undefined, { month: 'short' });
const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' });

export function DateBlock({ date, muted = false }: { date: Date; muted?: boolean }) {
    const today = date.toDateString() === new Date().toDateString();
    return (
        <div
            className="flex w-14 shrink-0 flex-col items-center rounded-control border border-stone-200 py-2"
            aria-hidden="true"
        >
            <span
                className={`text-xs font-semibold tracking-wide uppercase ${muted ? 'text-stone-500' : 'text-maroon-700'}`}
            >
                {month.format(date)}
            </span>
            <span
                className={`mt-0.5 text-2xl leading-none font-semibold tabular-nums ${muted ? 'text-stone-500' : 'text-stone-900'}`}
            >
                {date.getDate()}
            </span>
            <span
                className={`mt-1 text-xs ${today && !muted ? 'font-semibold text-stone-900' : 'text-stone-500'}`}
            >
                {today ? 'Today' : weekday.format(date)}
            </span>
        </div>
    );
}
