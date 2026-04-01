import { Client } from 'ssh2';

export async function runRemoteCommand(server, command) {
  return new Promise((resolve, reject) => {
    const client = new Client();
    let stdout = '';
    let stderr = '';

    client
      .on('ready', () => {
        client.exec(command, (error, stream) => {
          if (error) {
            client.end();
            reject(error);
            return;
          }

          stream.on('close', (code) => {
            client.end();
            resolve({ stdout, stderr, code: code ?? 0 });
          });

          stream.on('data', (chunk) => {
            stdout += chunk.toString('utf8');
          });

          stream.stderr.on('data', (chunk) => {
            stderr += chunk.toString('utf8');
          });
        });
      })
      .on('error', reject)
      .connect({
        host: server.host,
        port: server.port,
        username: server.username,
        agent: process.env.SSH_AUTH_SOCK,
        password: server.password,
        readyTimeout: 10000
      });
  });
}
