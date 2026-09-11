import { Buffer } from 'buffer';

(globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;

// @ts-expect-error Third-party packages inspect process.env.NODE_ENV in-browser.
globalThis.process = { env: { NODE_ENV: import.meta.env.MODE } };
