type Props = { title: string };

// Temporary page used until a module ships its real screen.
export function Placeholder({ title }: Props) {
    return (
        <section>
            <h1 className="text-xl font-semibold">{title}</h1>
            <p className="mt-2 text-gray-600">This screen is planned. See docs/SCREENS.md.</p>
        </section>
    );
}
