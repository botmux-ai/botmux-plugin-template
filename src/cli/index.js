export default {
  'template:hello': {
    description: 'Print a hello response from the template plugin.',
    run(ctx) {
      return JSON.stringify({
        ok: true,
        pluginId: ctx.pluginId,
        args: ctx.args,
      });
    },
  },

  'template:set-config': {
    description: 'Write a demo value into the plugin config file.',
    run(ctx) {
      const value = ctx.args[0] ?? 'configured';
      ctx.api.config.set('demo.value', value);
      return `template plugin config demo.value=${value}`;
    },
  },

  'template:show-config': {
    description: 'Read values from the plugin config file.',
    run(ctx) {
      return JSON.stringify(ctx.api.config.get() ?? {});
    },
  },
};

