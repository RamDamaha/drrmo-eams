// Remembers that the cookie message was read. This uses local storage, not a cookie, so the
// message itself sets no cookie. Raise the version number when the notice text changes in a way
// people should see again.
export const COOKIE_NOTICE_KEY = 'drrmo:cookie-notice:v1';

export function hasSeenCookieNotice(): boolean {
    try {
        return window.localStorage.getItem(COOKIE_NOTICE_KEY) === 'seen';
    } catch {
        // Storage can be blocked (private mode). Then the message simply shows again next time.
        return false;
    }
}

export function rememberCookieNotice(): void {
    try {
        window.localStorage.setItem(COOKIE_NOTICE_KEY, 'seen');
    } catch {
        // Nothing to do. The banner still closes for this visit.
    }
}
