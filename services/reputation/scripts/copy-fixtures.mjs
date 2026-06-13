/**
 * Copy fixture JSON (and the fixtures README) into dist so the compiled
 * loader can read them at runtime. tsc only emits .js/.d.ts, not .json.
 */
import { cpSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const srcDir = join(root, 'src', 'fixtures');
const outDir = join(root, 'dist', 'fixtures');

mkdirSync(outDir, { recursive: true });

let copied = 0;
for (const name of readdirSync(srcDir)) {
  if (name.endsWith('.json') || name.endsWith('.md')) {
    cpSync(join(srcDir, name), join(outDir, name));
    copied += 1;
  }
}

console.log(`[copy-fixtures] copied ${copied} fixture file(s) -> dist/fixtures`);
