export function getConfig() {
  return {
    port: Number(process.env.PORT ?? 3000),
    password: process.env.WEBTMUX_PASSWORD ?? 'change-me',
    registryFile: process.env.WEBTMUX_REGISTRY_FILE ?? 'config/servers.json'
  };
}
