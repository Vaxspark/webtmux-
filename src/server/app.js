import path from 'node:path';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import staticPlugin from '@fastify/static';
import websocket from '@fastify/websocket';
import { getConfig } from './config.js';
import { registerAuthRoutes } from './routes/auth-routes.js';
import { registerOverviewRoutes } from './routes/overview-routes.js';
import { registerSessionRoutes } from './routes/session-routes.js';
import { registerServerRoutes } from './routes/server-routes.js';

export function createApp(dependencies = {}) {
  const app = Fastify({ logger: false });
  const config = getConfig();
  const routeDependencies = dependencies.routes ?? {};

  app.register(cookie);
  app.register(jwt, {
    secret: config.password,
    cookie: {
      cookieName: 'webtmux_session'
    }
  });
  app.register(websocket);
  app.register(staticPlugin, {
    root: path.join(process.cwd(), 'public'),
    prefix: '/',
    index: ['index.html'],
    setHeaders(res, filePath) {
      if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
        res.setHeader('Cache-Control', 'no-store');
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  });
  app.register(registerAuthRoutes);
  app.register(registerOverviewRoutes);
  app.register(async (instance) => registerSessionRoutes(instance, routeDependencies.session ?? {}));
  app.register(async (instance) => registerServerRoutes(instance, routeDependencies.server ?? {}));
  app.get('/health', async () => ({ ok: true }));

  return app;
}