// Minimal .env loader for one-off scripts (no dotenv dep). Reads apps/api/.env.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export function loadEnv() {
  const here = dirname(fileURLToPath(import.meta.url));
  const raw = readFileSync(join(here, '..', '.env'), 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^"|"$/g, '');
  }
  return env;
}
