import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ForgotPassword } from './ForgotPassword';
import { VerifyEmail } from './VerifyEmail';

function json(status: number, body: unknown = {}, headers: Record<string, string> = {}) {
    return Promise.resolve(
        new Response(status === 204 ? null : JSON.stringify(body), { status, headers }),
    );
}

function renderVerify() {
    const router = createMemoryRouter(
        [
            { path: '/register/verify', element: <VerifyEmail /> },
            { path: '/forgot-password', element: <ForgotPassword /> },
        ],
        { initialEntries: ['/register/verify?email=ana%40example.test'] },
    );
    render(<RouterProvider router={router} />);
}

// The countdown re-arms after every render, so move time forward one second at a time.
async function tick(seconds: number) {
    for (let i = 0; i < seconds; i++) {
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1_000);
        });
    }
}

// Lets the first 60 second wait run out, like a person who waited a minute.
const waitOutCooldown = () => tick(60);

// Lets pending promises and state updates settle. Testing Library's own waiting does not run
// under fake timers, so these tests flush by hand and then read the screen.
async function flush() {
    await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
    });
}

const sendButton = () => screen.getByRole('button', { name: /^Send a new code|^Sending/ });

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe('send a new code', () => {
    it('starts with the 60 second wait already counting, because a code was just sent', () => {
        vi.stubGlobal('fetch', vi.fn());
        renderVerify();

        expect(sendButton()).toBeDisabled();
        expect(sendButton()).toHaveTextContent('Send a new code in 60s');
    });

    it('counts down every second and unlocks the button at zero', async () => {
        vi.stubGlobal('fetch', vi.fn());
        renderVerify();

        await tick(5);
        expect(sendButton()).toHaveTextContent('Send a new code in 55s');

        await waitOutCooldown();
        expect(sendButton()).toBeEnabled();
        expect(sendButton()).toHaveTextContent('Send a new code');
    });

    it('shows that it is sending, then a success message, then waits 60 seconds again', async () => {
        let finish: () => void = () => {};
        const fetchMock = vi.fn(
            () =>
                new Promise<Response>((resolve) => {
                    finish = () => resolve(new Response('{}', { status: 200 }));
                }),
        );
        vi.stubGlobal('fetch', fetchMock);
        renderVerify();
        await waitOutCooldown();

        fireEvent.click(sendButton());

        await flush();
        expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled();
        fireEvent.click(screen.getByRole('button', { name: 'Sending...' }));
        expect(fetchMock).toHaveBeenCalledTimes(1);

        await act(async () => {
            finish();
        });

        await flush();
        expect(screen.getByRole('status')).toHaveTextContent(
            'We sent a new code to ana@example.test. It may take a minute.',
        );
        expect(sendButton()).toBeDisabled();
        expect(sendButton()).toHaveTextContent('Send a new code in 60s');
        expect(
            JSON.parse(
                (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string,
            ),
        ).toEqual({
            email: 'ana@example.test',
        });
    });

    it('says to wait when the server answers 429, and uses Retry-After', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => json(429, { code: 'too_many_attempts' }, { 'Retry-After': '45' })),
        );
        renderVerify();
        await waitOutCooldown();

        fireEvent.click(sendButton());

        await flush();
        expect(screen.getByRole('alert')).toHaveTextContent(
            'Please wait a minute before asking again.',
        );
        expect(sendButton()).toBeDisabled();
        expect(sendButton()).toHaveTextContent('Send a new code in 45s');
    });

    it('shows an error and lets the person try again when sending fails', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => json(500, { message: 'Server Error' })),
        );
        renderVerify();
        await waitOutCooldown();

        fireEvent.click(sendButton());

        await flush();
        expect(screen.getByRole('alert')).toHaveTextContent(
            'Could not send a new code. Try again.',
        );
        expect(sendButton()).toBeEnabled();
    });

    it('clears the old message when a new action starts', async () => {
        const fetchMock = vi
            .fn()
            .mockImplementationOnce(() => json(500, {}))
            .mockImplementation(() => json(200, {}));
        vi.stubGlobal('fetch', fetchMock);
        renderVerify();
        await waitOutCooldown();

        fireEvent.click(sendButton());
        await flush();
        expect(screen.getByRole('alert')).toBeInTheDocument();

        fireEvent.click(sendButton());
        await flush();
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
});

describe('forgot password screen', () => {
    it('shows a loading button and then the success message', async () => {
        let finish: () => void = () => {};
        vi.stubGlobal(
            'fetch',
            vi.fn(
                () =>
                    new Promise<Response>((resolve) => {
                        finish = () =>
                            resolve(
                                new Response(JSON.stringify({ message: 'Link sent.' }), {
                                    status: 200,
                                }),
                            );
                    }),
            ),
        );
        const router = createMemoryRouter(
            [{ path: '/forgot-password', element: <ForgotPassword /> }],
            {
                initialEntries: ['/forgot-password'],
            },
        );
        render(<RouterProvider router={router} />);

        fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana@example.test' } });
        fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

        await flush();
        expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled();
        await act(async () => {
            finish();
        });
        await flush();
        expect(screen.getByRole('status')).toHaveTextContent('Link sent.');
    });
});
