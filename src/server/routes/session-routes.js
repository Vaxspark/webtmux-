import { z } from 'zod';
import { requireAuth } from '../auth.js';
import { getConfig } from '../config.js';
import { loadServerRegistry } from '../services/server-registry.js';
import { capturePane, sendKeys } from '../services/tmux-gateway.js';
import { mapControlAction } from '../services/session-stream.js';

const inputSchema = z.object({
  serverId: z.string().min(1),
  target: z.string().min(1),
  text: z.string().optional(),
  control: z.enum(['enter', 'ctrl-c', 'esc']).optional()
});

export async function registerSessionRoutes(app) {
  app.get('/api/session/:serverId/:target', { preHandler: requireAuth }, async (request, reply) => {
    const params = z.object({ serverId: z.string(), target: z.string() }).parse(request.params ?? {});
    const config = getConfig();
    const server = loadServerRegistry(config.registryFile).find((entry) => entry.id === params.serverId);

    if (!server) {
      return reply.code(404).send({ message: 'Server not found' });
    }

    return { lines: await capturePane(server, params.target) };
  });

  app.post('/api/session/input', { preHandler: requireAuth }, async (request, reply) => {
    const body = inputSchema.parse(request.body ?? {});
    const config = getConfig();
    const server = loadServerRegistry(config.registryFile).find((entry) => entry.id === body.serverId);

    if (!server) {
      return reply.code(404).send({ message: 'Server not found' });
    }

    if (body.text) {
      await sendKeys(server, body.target, [body.text]);
    }

    if (body.control) {
      await sendKeys(server, body.target, mapControlAction(body.control));
    }

    return { ok: true };
  });
}
