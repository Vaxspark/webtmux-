import { createApp } from './app.js';

const app = createApp();

app.listen({ host: '0.0.0.0', port: Number(process.env.PORT ?? 3000) }).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
