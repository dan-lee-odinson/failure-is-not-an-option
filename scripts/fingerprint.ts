/** `npm run fingerprint` — prints the content version and fingerprint this build integrates. */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SIM_VERSION, contentFingerprint } from '../core/content';
import { loadBundle } from './lib/load-content';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const bundle = loadBundle(root);
console.log(`content_version:     ${bundle.mission.content_version}`);
console.log(`content_fingerprint: ${contentFingerprint(bundle)}`);
console.log(`sim_version:         ${SIM_VERSION}`);
