import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BrandLogos } from './BrandLogos';
import { Button } from './Button';
import { PasswordField } from './PasswordField';

afterEach(cleanup);

describe('shared ui', () => {
    it('shows both logos with alt text, ZPPSU first', () => {
        render(<BrandLogos />);
        const logos = screen.getAllByRole('img');
        expect(logos).toHaveLength(2);
        expect(logos[0]).toHaveAccessibleName(/Zamboanga Peninsula Polytechnic State University/);
        expect(logos[1]).toHaveAccessibleName(/Disaster Risk Reduction and Management Office/);
    });

    it('lets people show and hide the password', () => {
        render(<PasswordField />);
        const input = screen.getByLabelText('Password');
        expect(input).toHaveAttribute('type', 'password');
        fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
        expect(input).toHaveAttribute('type', 'text');
        fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
        expect(input).toHaveAttribute('type', 'password');
    });

    it('disables a loading button so it cannot be pressed twice', () => {
        render(<Button loading>Save</Button>);
        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });
});
