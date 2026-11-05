import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Placeholder } from './Placeholder';

describe('Placeholder', () => {
    it('shows the page title', () => {
        render(<Placeholder title="My duties" />);
        expect(screen.getByRole('heading', { name: 'My duties' })).toBeInTheDocument();
    });
});
