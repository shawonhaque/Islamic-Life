// public/ is gitignored, so the brand mark and favicon are emitted here on
// every build instead of being committed as assets.
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(process.cwd(), 'src/assets/crescent-moon.svg');
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

if (!fs.existsSync(SRC)) {
  console.error(`Missing brand asset at ${SRC}`);
  process.exit(1);
}

fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.copyFileSync(SRC, path.join(PUBLIC_DIR, 'crescent-moon.svg'));
console.log('Wrote public/crescent-moon.svg');
