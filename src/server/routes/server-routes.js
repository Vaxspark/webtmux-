import { z } from 'zod';
import { requireAuth } from '../auth.js';
import { getConfig } from '../config.js';
import { loadServerRegistry, addServer, updateServer, deleteServer } from '../services/server-registry.js';
import * as tmuxGateway from '../services/tmux-gateway.js';

const addServerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  host: z.string().min(1),
  port: z.number().int().positive(),
  username: z.string().min(1),
  authStrategy: z.enum(['agent', 'private-key', 'password']),
  platform: z.enum(['ubuntu', 'windows']),
  shellType: z.enum(['posix', 'powershell']).optional(),
  tmuxCommand: z.string().min(1).optional(),
  tmuxSocketName: z.string().min(1).optional(),
  tmuxUser: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  privateKeyPath: z.string().min(1).optional()
});

export async function registerServerRoutes(app, dependencies = {}) {
  const gateway = dependencies.gateway ?? tmuxGateway;

  app.get('/api/servers', { preHandler: requireAuth }, async () => {
    const config = getConfig();
    const servers = loadServerRegistry(config.registryFile);
    // Return servers without sensitive fields
    return {
      servers: servers.map(({ password, privateKeyPath, ...rest }) => rest)
    };
  });

  app.post('/api/servers', { preHandler: requireAuth }, async (request, reply) => {
    const body = addServerSchema.parse(request.body ?? {});
    const config = getConfig();
    try {
      const server = addServer(config.registryFile, body);
      const { password, privateKeyPath, ...safe } = server;
      return { ok: true, server: safe };
    } catch (error) {
      return reply.code(409).send({ message: error.message });
    }
  });

  app.put('/api/servers/:serverId', { preHandler: requireAuth }, async (request, reply) => {
    const { serverId } = z.object({ serverId: z.string() }).parse(request.params ?? {});
    const body = addServerSchema.partial().parse(request.body ?? {});
    const config = getConfig();
    try {
      const server = updateServer(config.registryFile, serverId, body);
      const { password, privateKeyPath, ...safe } = server;
      return { ok: true, server: safe };
    } catch (error) {
      return reply.code(404).send({ message: error.message });
    }
  });

  app.get('/api/servers/:serverId/fs', { preHandler: requireAuth }, async (request, reply) => {
    const params = z.object({ serverId: z.string().min(1) }).parse(request.params ?? {});
    const query = z.object({ path: z.string().optional() }).parse(request.query ?? {});
    const config = getConfig();
    const server = loadServerRegistry(config.registryFile).find((entry) => entry.id === params.serverId);

    if (!server) {
      return reply.code(404).send({ message: 'Server not found' });
    }

    const directories = await gateway.listDirectories(server, query.path);
    const path = query.path ?? null;
    const parentPath = path ? path.replace(/[\\/][^\\/]+$/, '') || null : null;

    return {
      path,
      parentPath,
      directories
    };
  });

  app.delete('/api/servers/:serverId', { preHandler: requireAuth }, async (request, reply) => {
    const { serverId } = z.object({ serverId: z.string() }).parse(request.params ?? {});
    const config = getConfig();
    try {
      deleteServer(config.registryFile, serverId);
      return { ok: true };
    } catch (error) {
      return reply.code(404).send({ message: error.message });
    }
  });
}