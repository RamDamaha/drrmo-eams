// Emails link to the duties page with ?assignment=<id>. These helpers read that id and say where
// the matching duty sits, so the page can scroll to it and highlight it.
import type { MyAssignment } from '@/features/events/api';

/** The assignment id from a link, or null when it is missing or not a whole number. */
export function linkedAssignmentId(value: string | null): number | null {
    if (value === null || !/^\d+$/.test(value)) return null;
    const id = Number(value);
    return id > 0 ? id : null;
}

export type LinkedDuty = { duty: MyAssignment; cancelled: boolean };

/** Finds the linked duty among the person's own duties. Someone else's id finds nothing. */
export function findLinkedDuty(duties: MyAssignment[], id: number | null): LinkedDuty | null {
    if (id === null) return null;
    const duty = duties.find((d) => d.id === id);
    if (!duty) return null;
    return { duty, cancelled: duty.event.status === 'cancelled' };
}
