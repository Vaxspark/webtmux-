import Fastify from 'fastify';

export function createApp() {
  return Fastify({ logger: false });
}
