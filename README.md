# botmux-plugin-template

This repository is the authoring template for a botmux plugin. It follows the
same fixed-directory contract exercised by `botmux-plugin-demo`, but removes the
conformance fixtures and keeps one small example for each current plugin slot.

## Contract

The installed package root is the public interface. botmux scans fixed
directories without executing plugin code during install:

| Path | Purpose | Build source |
| --- | --- | --- |
| `skills/*/SKILL.md` | Skills materialized on `botmux plugin enable` | hand-written |
| `mcp/*.json` | Static MCP servers materialized on `botmux plugin enable` | hand-written |
| `cli/index.js` | CLI handler map used by top-level `botmux <command>` | `src/cli/index.js` |
| `cli/commands.json` | Generated command index for install-time scanning | generated from `src/cli/index.js` |
| `dashboard/index.js` | Dashboard React component entry | `src/dashboard/index.js` |
| `service/index.js` | PM2 service definition | `src/service/index.js` |
| `worker/index.js` | Worker runtime extension entry | `src/worker/index.js` |

`package.json#botmux` stays intentionally small:

```json
{
  "schemaVersion": 1,
  "id": "template-plugin",
  "displayName": "Template Plugin",
  "service": { "mode": "manual" }
}
```

Do not put `skills`, `mcp`, `dashboard`, `hooks`, `main`, or `capabilities` in
the manifest. The directories are the declaration.

## Develop

```bash
npm install
npm run build
npm test
```

Install the local plugin into botmux:

```bash
botmux plugin install . --link
botmux plugin enable template-plugin
botmux template:hello
botmux plugin service start template-plugin
botmux plugin service status
```

Open `botmux dashboard`, go to Plugins, and open the Template Plugin dashboard
entry.

## Rename Checklist

When using this repository as a new plugin:

1. Change `package.json#name`, `botmux.id`, and `botmux.displayName`.
2. Rename command keys in `src/cli/index.js`.
3. Rename MCP server names in `mcp/*.json`.
4. Rename skill names in `skills/*/SKILL.md`.
5. Change service env names and default port in `src/service/index.js`.
6. Run `npm run build` so `cli/commands.json` and the convention directories
   match the source.

botmux does not add a namespace for you. Use plugin-specific names for commands,
skills, MCP servers, and services.

## Why Commands Are Generated

The CLI command index exists because `botmux plugin install` validates and scans
plugins without running plugin code. Plugin authors still write one handler map:

```js
export default {
  'template:hello': {
    description: 'Print a hello response.',
    run(ctx) {
      return `hello ${ctx.pluginId}`;
    },
  },
};
```

`npm run build` imports that map and writes `cli/commands.json` automatically.
If a handler is removed or renamed, validation catches a stale generated index.

## Service Mode

`service.mode` controls whether the service follows botmux lifecycle:

| Mode | Behavior |
| --- | --- |
| `manual` | Not started by `botmux start`; can still be started/stopped from CLI or Dashboard |
| `auto` | Ensured on `botmux start`; stopped/restarted only when `--with-plugin` is passed |

Both modes are PM2-managed once started. The service definition returns URLs via
`urls({ host, port })`, so Dashboard shows the reachable development-machine
host instead of `127.0.0.1`.

## Template vs Demo

Use this repository to start a real plugin. Use `botmux-plugin-demo` for
conformance and E2E coverage of the plugin system itself.
