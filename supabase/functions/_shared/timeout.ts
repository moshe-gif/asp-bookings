// A time limit for every call to an outside service (2026-11-12 audit #13.4). Without one, a service that never
// answers holds the whole function run until the platform kills it -- a 10-minute job then sends nothing.
// A call that runs out of time throws like a lost connection, which every caller already reports as a failure.
export const OUTSIDE_CALL_MS = 20_000;
export const timeout = (ms = OUTSIDE_CALL_MS): AbortSignal => AbortSignal.timeout(ms);
