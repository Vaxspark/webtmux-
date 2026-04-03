import { createApp } from './app.js';

const app = createApp();

app.listen({ host: '0.0.0.0', port: 3000 }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
