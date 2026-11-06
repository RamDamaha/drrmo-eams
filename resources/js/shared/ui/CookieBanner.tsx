// First visit cookie message. A bottom sheet on phones and a small card on desktop. It does not
// trap focus and does not block the page: people can ignore it and keep using the form.
// There are no optional cookies, so there is only "Got it", no accept or reject choice.
import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { hasSeenCookieNotice, rememberCookieNotice } from '@/shared/cookieNotice';
import { Button } from './Button';

export function CookieBanner() {
    const { pathname } = useLocation();
    const [seen, setSeen] = useState(hasSeenCookieNotice);

    // The notice page itself is where people read it, so no banner on top of it.
    if (seen || pathname === '/cookies') return null;

    function dismiss() {
        rememberCookieNotice();
        setSeen(true);
    }

    return (
        <>
            {/* Room at the end of the page on phones, so the fixed message never hides the last field. */}
            <div aria-hidden="true" className="h-44 sm:hidden" />
            <section
                aria-label="Cookie notice"
                className="fixed inset-x-0 bottom-0 z-20 p-3 sm:inset-x-auto sm:bottom-4 sm:left-4 sm:max-w-sm sm:p-0"
            >
                <div className="rounded-card bg-white p-4 text-stone-700 shadow-raised ring-1 ring-stone-200">
                    <p className="text-sm text-pretty">
                        We only use cookies that keep you signed in and protect your account. No
                        tracking, no ads.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                        <Button size="md" onClick={dismiss}>
                            Got it
                        </Button>
                        <Link
                            to="/cookies"
                            className="text-sm font-medium text-maroon-700 hover:underline"
                        >
                            Read the cookie notice
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
