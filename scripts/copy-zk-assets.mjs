import { cp, mkdir } from 'node:fs/promises';

const source = new URL('../contracts/managed/veil-aid/', import.meta.url);
const destination = new URL('../dist/', import.meta.url);

await mkdir(destination, { recursive: true });
await Promise.all([
  cp(new URL('keys/', source), new URL('keys/', destination), { recursive: true }),
  cp(new URL('zkir/', source), new URL('zkir/', destination), { recursive: true }),
]);
