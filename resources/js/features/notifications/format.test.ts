import { describe, expect, it } from 'vitest';
import { usageLevel } from './format';

describe('usageLevel', () => {
    it('is ok below 80 percent', () => {
        expect(usageLevel(239, 300)).toBe('ok');
    });
    it('is near from 80 percent', () => {
        expect(usageLevel(240, 300)).toBe('near');
    });
    it('is over at the limit', () => {
        expect(usageLevel(300, 300)).toBe('over');
    });
    it('ignores a missing limit', () => {
        expect(usageLevel(10, 0)).toBe('ok');
    });
});
