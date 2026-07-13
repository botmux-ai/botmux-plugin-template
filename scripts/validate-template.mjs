import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const templateDir = join(root, 'template');
const variables = {
  pluginId: 'template-plugin',
  packageName: '@botmux-ai/plugin-template-plugin',
  repoName: 'botmux-plugin-template-plugin',
  displayName: 'Template Plugin',
  commandPrefix: 'template-plugin:',
  envPrefix: 'BOTMUX_PLUGIN_TEMPLATE_PLUGIN',
};
const outputs = new Map();

function fail(message) {
  throw new Error(message);
}

function render(value, field) {
  const rendered = value.replace(/\{\{([A-Za-z][A-Za-z0-9]*)\}\}/g, (_match, name) => {
    if (!Object.prototype.hasOwnProperty.call(variables, name)) fail(`unknown template variable ${name} in ${field}`);
    return variables[name];
  });
  return rendered;
}

function validateTemplateValue(value, field) {
  if (typeof value === 'string') {
    render(value, field);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => validateTemplateValue(entry, `${field}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) validateTemplateValue(entry, `${field}.${key}`);
}

function registerOutput(output, source) {
  if (!output || isAbsolute(output) || output === '..' || output.startsWith(`..${sep}`)) fail(`invalid output path: ${output}`);
  if (output === 'package.json') fail('template/package.json is reserved; use template.json#package');
  const previous = outputs.get(output);
  if (previous) fail(`output collision: ${output} from ${previous} and ${source}`);
  outputs.set(output, source);
}

function visit(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const sourcePath = join(dir, entry.name);
    const sourceRelative = relative(templateDir, sourcePath).split(sep).join('/');
    if (entry.isSymbolicLink()) fail(`symlink not allowed: ${sourceRelative}`);
    let output = render(sourceRelative, `path:${sourceRelative}`);
    const templateFile = entry.isFile() && output.endsWith('.tmpl');
    if (templateFile) output = output.slice(0, -'.tmpl'.length);
    if (output === 'gitignore') output = '.gitignore';
    registerOutput(output, sourceRelative);
    if (entry.isDirectory()) {
      visit(sourcePath);
    } else if (templateFile) {
      render(new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(sourcePath)), `file:${sourceRelative}`);
    }
  }
}

if (!existsSync(join(root, 'template.json'))) fail('template.json is missing');
const rootPackage = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));
if (rootPackage.publishConfig?.registry !== 'https://registry.npmjs.org/' || rootPackage.publishConfig?.access !== 'public') {
  fail('template package must publish publicly to npmjs');
}
const definition = JSON.parse(readFileSync(join(root, 'template.json'), 'utf-8'));
if (!definition?.package || typeof definition.package !== 'object' || Array.isArray(definition.package)) {
  fail('template.json#package is required');
}
validateTemplateValue(definition.package, 'template.package');
if (definition.package.files?.length !== 1 || definition.package.files[0] !== 'dist/') {
  fail('generated package must publish only dist/');
}
if (definition.package.publishConfig?.registry !== 'https://registry.npmjs.org/'
  || definition.package.publishConfig?.access !== 'public') {
  fail('generated package must publish publicly to npmjs');
}
if (!definition.package.devDependencies?.esbuild) fail('generated package must include esbuild');
if (!existsSync(templateDir)) fail('template/ is missing');
visit(templateDir);

for (const required of [
  'README.md',
  '.gitignore',
  'scripts/build.mjs',
  'scripts/validate.mjs',
  'src/cli/index.js',
  'src/dashboard/index.js',
  'src/mcp/index.js',
  'src/mcp/server.js',
  'src/service/index.js',
  'src/service/server.js',
  'skills/template-plugin/SKILL.md',
]) {
  if (!outputs.has(required)) fail(`generated output is missing: ${required}`);
}

const outputRoot = resolve(root, '.template-validation-output');
for (const output of outputs.keys()) {
  const resolved = resolve(outputRoot, output);
  if (resolved !== outputRoot && !resolved.startsWith(`${outputRoot}${sep}`)) fail(`output escapes project root: ${output}`);
}

console.log('botmux plugin generation template validation passed');
