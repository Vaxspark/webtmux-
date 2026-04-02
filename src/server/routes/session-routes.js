import { z } from 'zod';
import { requireAuth } from '../auth.js';
import { getConfig } from '../config.js';
import { loadServerRegistry } from '../services/server-registry.js';
import * as tmuxGateway from '../services/tmux-gateway.js';
import { mapControlAction } from '../services/session-stream.js';

const inputSchema = z.object({
  serverId: z.string().min(1),
  target: z.string().min(1),
  text: z.string().optional(),
  control: z.enum(['enter', 'ctrl-c', 'esc', 'up', 'down', 'tab']).optional()
});

const createSessionSchema = z.object({
  serverId: z.string().min(1),
  cliType: z.enum(['claude-code', 'codex-cli', 'copilot-cli']),
  workspacePath: z.string().min(1),
  launchCommand: z.string().min(1)
});

export async function registerSessionRoutes(app, dependencies = {}) {
  const gateway = dependencies.gateway ?? tmuxGateway;

  app.get('/api/session/:serverId/:target', { preHandler: requireAuth }, async (request, reply) => {
    const params = z.object({ serverId: z.string(), target: z.string() }).parse(request.params ?? {});
    const config = getConfig();
    const server = loadServerRegistry(config.registryFile).find((entry) => entry.id === params.serverId);

    if (!server) {
      return reply.code(404).send({ message: 'Server not found' });
    }

    return { lines: await gateway.capturePane(server, params.target) };
  });

  app.post('/api/session/create', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = createSessionSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ message: 'Invalid create session payload' });
    }

    const body = parsed.data;
    const config = getConfig();
    const server = loadServerRegistry(config.registryFile).find((entry) => entry.id === body.serverId);

    if (!server) {
      return reply.code(404).send({ message: 'Server not found' });
    }

    const validWorkspace = await gateway.ensureWorkspaceDirectory(server, body.workspacePath);
    if (!validWorkspace) {
      return reply.code(400).send({ message: 'Workspace path must be an existing directory' });
    }

    const created = await gateway.createCliWindow(server, body);
    return {
      serverId: server.id,
      ...created,
      cliType: body.cliType,
      paneTitle: created.windowName
    };
  });

  app.post('/api/session/input', { preHandler: requireAuth }, async (request, reply) => {
    const body = inputSchema.parse(request.body ?? {});
    const config = getConfig();
    const server = loadServerRegistry(config.registryFile).find((entry) => entry.id === body.serverId);

    if (!server) {
      return reply.code(404).send({ message: 'Server not found' });
    }

    if (body.text) {
      await gateway.sendKeys(server, body.target, [body.text]);
    }

    if (body.control) {
      await gateway.sendKeys(server, body.target, mapControlAction(body.control));
    }

    return { ok: true };
  });
}