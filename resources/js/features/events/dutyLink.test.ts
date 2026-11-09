import { describe, expect, it } from 'vitest';
import type { MyAssignment } from '@/features/events/api';
import { findLinkedDuty, linkedAssignmentId } from './dutyLink';

const duty = (id: number, eventStatus = 'published') =>
    ({ id, event: { status: eventStatus } }) as unknown as MyAssignment;

describe('linkedAssignmentId', () => {
    it('reads a whole number', () => {
        expect(linkedAssignmentId('42')).toBe(42);
    });
    it('ignores anything else', () => {
        for (const bad of [null, '', '0', '-3', '4.5', 'abc', '7x']) {
            expect(linkedAssignmentId(bad)).toBeNull();
        }
    });
});

describe('findLinkedDuty', () => {
    it('finds the duty and says if its event was cancelled', () => {
        const list = [duty(1), duty(2, 'cancelled')];
        expect(findLinkedDuty(list, 1)?.cancelled).toBe(false);
        expect(findLinkedDuty(list, 2)?.cancelled).toBe(true);
    });
    it('finds nothing for an id that is not in the list', () => {
        expect(findLinkedDuty([duty(1)], 99)).toBeNull();
        expect(findLinkedDuty([duty(1)], null)).toBeNull();
    });
});
