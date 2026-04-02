import { readFileSync } from 'node:fs';
import { Client } from 'ssh2';

export function buildSshConnectOptions(server) {
  const options = {
    host: server.host,
    port: server.port,
    username: server.username,
    readyTimeout: 10000,
    keepaliveInterval: 10000
  };

  if (server.localAddress) {
    options.localAddress = server.localAddress;
  }

  if (server.authStrategy === 'private-key') {
    options.privateKey = readFileSync(server.privateKeyPath, 'utf8');
    if (server.password) {
      options.passphrase = server.password;
    }
    return options;
  }

  if (server.authStrategy === 'password') {
    options.password = server.password;
    return options;
  }

  if (process.env.SSH_AUTH_SOCK) {
    options.agent = process.env.SSH_AUTH_SOCK;
  }

  return options;
}

// Connection pool: server.id -> Promise<Client>
// Each server gets one persistent SSH connection, all commands multiplexed over it.
const connectionPool = new Map();

function openConnection(server) {
  const key = server.id;
  const promise = new Promise((resolve, reject) => {
    const client = new Client();
    client
      .on('ready', () => resolve(client))
      .on('error', (err) => {
        connectionPool.delete(key);
        reject(err);
      })
      .on('close', () => connectionPool.delete(key))
      .connect(buildSshConnectOptions(server));
  });
  connectionPool.set(key, promise);
  // Attach a no-op catch so an early rejection before any awaiter attaches
  // doesn't cause an UnhandledPromiseRejection warning.
  promise.catch(() => {});
  return promise;
}

async function getClient(server) {
  const key = server.id;
  return connectionPool.get(key) ?? openConnection(server);
}

export async function runRemoteCommand(server, command) {
  const client = await getClient(server);
  return new Promise((resolve, reject) => {
    client.exec(command, (error, stream) => {
      if (error) {
        // Connection may have gone bad; remove from pool so next call reconnects.
        connectionPool.delete(server.id);
        reject(error);
        return;
      }

      let stdout = '';
      let stderr = '';

      stream.on('close', (code) => resolve({ stdout, stderr, code: code ?? 0 }));
      stream.on('data', (chunk) => { stdout += chunk.toString('utf8'); });
      stream.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8'); });
    });
  });
}
