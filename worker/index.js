export default function registerWorker(api) {
  if (!api.worker?.configureMcp?.tap) return undefined;
  return api.worker.configureMcp.tap('template-plugin-worker', (ctx) => {
    ctx.addMcpServer('template-dynamic', {
      command: ['node', './mcp/server.js', '--dynamic', ctx.botId, ctx.sessionId],
      env: {
        TEMPLATE_DYNAMIC_BOT: ctx.botId,
        TEMPLATE_DYNAMIC_SESSION: ctx.sessionId,
      },
    });
  });
}

