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

export function createApp() {
  const app = Fastify({ logger: false });
  const config = getConfig();

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
    index: ['index.html']
  });
  app.register(registerAuthRoutes);
  app.register(registerOverviewRoutes);
  app.register(registerSessionRoutes);
  app.get('/health', async () => ({ ok: true }));

  return app;
}
