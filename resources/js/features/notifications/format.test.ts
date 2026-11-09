import { describe, expect, it } from 'vitest';
import { dayLabel, groupByDay, usageLevel } from './format';

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

describe('dayLabel', () => {
    const now = new Date(2026, 10, 9, 8, 0);
    it('names today and yesterday', () => {
        expect(dayLabel(new Date(2026, 10, 9, 0, 5), now)).toBe('Today');
        expect(dayLabel(new Date(2026, 10, 8, 23, 59), now)).toBe('Yesterday');
    });
    it('uses the date for older days', () => {
        expect(dayLabel(new Date(2026, 10, 2, 12, 0), now)).not.toMatch(/Today|Yesterday/);
    });
});

describe('groupByDay', () => {
    it('groups by day in order and puts undated items last', () => {
        const now = new Date(2026, 10, 9, 8, 0);
        const at = (d: number, h: number) => new Date(2026, 10, d, h).toISOString();
        const groups = groupByDay(
            [
                { id: 1, sent_at: at(9, 7) },
                { id: 2, sent_at: at(9, 6) },
                { id: 3, sent_at: at(8, 20) },
                { id: 4, sent_at: null },
            ],
            now,
        );
        expect(groups.map((g) => g.label)).toEqual(['Today', 'Yesterday', 'Earlier']);
        expect(groups[0].items.map((i) => i.id)).toEqual([1, 2]);
    });
});
