# botmux-plugin-template

Official data-only project template consumed by `botmux plugin init`.

```bash
botmux plugin init agent-chrome
```

The repository itself is not a Botmux plugin. It has the same split as a
Create React App custom template:

```plain
template.json       package.json fields for the generated project
template/           project files copied into the generated repository
```

Files below `template/` are copied byte-for-byte by default. Only files with a
`.tmpl` suffix are rendered, and the suffix is removed in the generated
project. Template paths may also contain variables, for example:

```plain
template/skills/{{pluginId}}/SKILL.md.tmpl
```

Supported variables are:

- `pluginId`
- `packageName`
- `repoName`
- `displayName`
- `commandPrefix`
- `envPrefix`

The generator is implemented in Botmux core. This repository never supplies
executable generator code, so choosing a template does not grant it an extra
code-execution phase. Botmux installs the generated project's dependencies and
runs its own `npm test` before `plugin init` publishes the result to the target
directory, matching the create-app workflow.

## Validate

```bash
npm test
```

This checks the data contract, known variables, output collisions, reserved
paths, and symlink policy. The Botmux core test suite additionally generates a
real project and verifies that binary files remain byte-identical.
