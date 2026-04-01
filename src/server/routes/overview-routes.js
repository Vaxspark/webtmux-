import { requireAuth } from '../auth.js';
import { getConfig } from '../config.js';
import { loadServerRegistry } from '../services/server-registry.js';
import { listPanes } from '../services/tmux-gateway.js';

export async function registerOverviewRoutes(app) {
  app.get('/api/overview', { preHandler: requireAuth }, async () => {
    const config = getConfig();
    const servers = loadServerRegistry(config.registryFile);
    const results = await Promise.allSettled(servers.map((server) => listPanes(server)));

    return {
      panes: results.flatMap((result) => result.status === 'fulfilled' ? result.value : []),
      failures: results.flatMap((result, index) => result.status === 'rejected'
        ? [{ serverId: servers[index].id, message: String(result.reason) }]
        : [])
    };
  });
}
