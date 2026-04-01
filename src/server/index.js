import { createApp } from './app.js';

const app = createApp();

app.get('/health', async () => ({ ok: true }));

app.listen({ host: '0.0.0.0', port: Number(process.env.PORT ?? 3000) }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
