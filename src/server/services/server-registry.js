import { readFileSync } from 'node:fs';
import { z } from 'zod';

const serverSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  host: z.string().min(1),
  port: z.number().int().positive(),
  username: z.string().min(1),
  authStrategy: z.enum(['agent', 'private-key', 'password']),
  platform: z.enum(['ubuntu', 'windows']),
  shellType: z.enum(['posix', 'powershell']).optional(),
  tmuxCommand: z.string().min(1).optional(),
  tmuxSocketName: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  privateKeyPath: z.string().min(1).optional()
});

function applyDefaults(entry) {
  return {
    ...entry,
    shellType: entry.shellType ?? (entry.platform === 'windows' ? 'powershell' : 'posix'),
    tmuxCommand: entry.tmuxCommand ?? (entry.platform === 'windows' ? 'wsl.exe -e tmux' : 'tmux')
  };
}

export function parseServerRegistry(source) {
  const parsed = z.array(serverSchema).parse(JSON.parse(source));
  return parsed.map(applyDefaults);
}

export function loadServerRegistry(filePath) {
  return parseServerRegistry(readFileSync(filePath, 'utf8'));
}
