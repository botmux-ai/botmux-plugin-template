import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(root);

const GENERATED_DIRS = ['cli', 'dashboard', 'service', 'worker'];

function isDirectory(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function copyDir(src, dest) {
  if (!isDirectory(src)) return;
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    const from = join(src, name);
    const to = join(dest, name);
    if (statSync(from).isDirectory()) {
      copyDir(from, to);
    } else {
      mkdirSync(dirname(to), { recursive: true });
      writeFileSync(to, readFileSync(from));
    }
  }
}

async function generateCliCommandIndex() {
  const cliEntry = join(repoRoot, 'src', 'cli', 'index.js');
  const mod = await import(pathToFileURL(cliEntry).href + `?t=${Date.now()}`);
  const handlers = mod.default ?? mod;
  if (!handlers || typeof handlers !== 'object' || Array.isArray(handlers)) {
    throw new Error('src/cli/index.js must default-export a command handler object');
  }
  const commands = Object.entries(handlers).map(([name, handler]) => {
    if (!/^[a-z][a-z0-9._:-]{0,63}$/.test(name)) {
      throw new Error(`invalid plugin command name: ${name}`);
    }
    const description = typeof handler?.description === 'string' && handler.description.trim()
      ? handler.description.trim()
      : undefined;
    if (typeof handler !== 'function' && typeof handler?.run !== 'function') {
      throw new Error(`command handler must be a function or { run() }: ${name}`);
    }
    return { name, ...(description ? { description } : {}) };
  }).sort((a, b) => a.name.localeCompare(b.name));
  mkdirSync(join(repoRoot, 'cli'), { recursive: true });
  writeFileSync(join(repoRoot, 'cli', 'commands.json'), JSON.stringify({ schemaVersion: 1, commands }, null, 2) + '\n');
}

for (const dir of GENERATED_DIRS) rmSync(join(repoRoot, dir), { recursive: true, force: true });
for (const dir of GENERATED_DIRS) copyDir(join(repoRoot, 'src', dir), join(repoRoot, dir));
await generateCliCommandIndex();

