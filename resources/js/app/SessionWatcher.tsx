// Mounted once inside the providers. It only watches for the session ending (see useSessionWatcher).
import { useSessionWatcher } from './auth';

export function SessionWatcher() {
    useSessionWatcher();
    return null;
}
