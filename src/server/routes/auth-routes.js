import { z } from 'zod';
import { getConfig } from '../config.js';

const loginSchema = z.object({
  password: z.string().min(1)
});

export async function registerAuthRoutes(app) {
  app.post('/api/auth/login', async (request, reply) => {
    const body = loginSchema.parse(request.body ?? {});
    const config = getConfig();

    if (body.password !== config.password) {
      return reply.code(401).send({ message: 'Invalid password' });
    }

    const token = await reply.jwtSign({ authenticated: true });
    reply.setCookie('webtmux_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/'
    });

    return { ok: true };
  });
}
