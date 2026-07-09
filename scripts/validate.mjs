import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function fail(message) {
  throw new Error(message);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

const pkg = readJson(join(repoRoot, 'package.json'));
if (!pkg.keywords?.includes('botmux-plugin')) fail('package.json must include keywords: ["botmux-plugin"]');
if (pkg.botmux?.schemaVersion !== 1) fail('package.json#botmux.schemaVersion must be 1');
if (!/^[a-z][a-z0-9._-]{0,63}$/.test(pkg.botmux?.id ?? '')) fail('package.json#botmux.id is invalid');

if (pkg.botmux?.service && !existsSync(join(repoRoot, 'service', 'index.js'))) {
  fail('botmux.service is set, but service/index.js does not exist');
}

const commandIndexPath = join(repoRoot, 'cli', 'commands.json');
if (existsSync(join(repoRoot, 'cli', 'index.js'))) {
  if (!existsSync(commandIndexPath)) fail('cli/index.js exists, but cli/commands.json does not exist');
  const commands = readJson(commandIndexPath).commands ?? [];
  const mod = await import(pathToFileURL(join(repoRoot, 'cli', 'index.js')).href + `?t=${Date.now()}`);
  const handlers = mod.default ?? mod;
  for (const command of commands) {
    const handler = handlers?.[command.name];
    if (typeof handler !== 'function' && typeof handler?.run !== 'function') {
      fail(`cli/commands.json declares ${command.name}, but cli/index.js has no handler`);
    }
  }
}

console.log('template plugin validation passed');

