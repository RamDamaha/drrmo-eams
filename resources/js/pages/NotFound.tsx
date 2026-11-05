import { Link } from 'react-router';

export function NotFound() {
    return (
        <main className="p-6">
            <h1 className="text-xl font-semibold">Page not found</h1>
            <Link to="/" className="mt-4 inline-block text-red-700 underline">
                Go to the home page
            </Link>
        </main>
    );
}
