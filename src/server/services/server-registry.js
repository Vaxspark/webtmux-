import { readFileSync, writeFileSync, existsSync } from 'node:fs';
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
  tmuxUser: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  privateKeyPath: z.string().min(1).optional(),
  localAddress: z.string().min(1).optional()
});

function applyDefaults(entry) {
  return {
    ...entry,
    shellType: entry.shellType ?? (entry.platform === 'windows' ? 'powershell' : 'posix'),
    tmuxCommand: entry.tmuxCommand ?? (entry.platform === 'windows' ? 'wsl.exe -e tmux' : 'tmux')
  };
}

function stripUtf8Bom(source) {
  return source.charCodeAt(0) === 0xFEFF ? source.slice(1) : source;
}

export function parseServerRegistry(source) {
  const parsed = z.array(serverSchema).parse(JSON.parse(stripUtf8Bom(source)));
  return parsed.map(applyDefaults);
}

export function loadServerRegistry(filePath) {
  if (!existsSync(filePath)) return [];
  return parseServerRegistry(readFileSync(filePath, 'utf8'));
}

export function saveServerRegistry(filePath, servers) {
  // Strip runtime defaults before saving to keep the file clean
  const cleaned = servers.map(({ shellType, tmuxCommand, ...rest }) => {
    const entry = { ...rest };
    // Only save non-default values
    if (shellType && shellType !== (rest.platform === 'windows' ? 'powershell' : 'posix')) {
      entry.shellType = shellType;
    }
    if (tmuxCommand && tmuxCommand !== (rest.platform === 'windows' ? 'wsl.exe -e tmux' : 'tmux')) {
      entry.tmuxCommand = tmuxCommand;
    }
    return entry;
  });
  writeFileSync(filePath, JSON.stringify(cleaned, null, 2), 'utf8');
}

export function addServer(filePath, serverData) {
  const validated = serverSchema.parse(serverData);
  const servers = loadServerRegistry(filePath);
  if (servers.some((s) => s.id === validated.id)) {
    throw new Error(`Server with id "${validated.id}" already exists`);
  }
  const raw = existsSync(filePath) ? JSON.parse(stripUtf8Bom(readFileSync(filePath, 'utf8'))) : [];
  raw.push(validated);
  writeFileSync(filePath, JSON.stringify(raw, null, 2), 'utf8');
  return applyDefaults(validated);
}

export function updateServer(filePath, serverId, serverData) {
  const raw = existsSync(filePath) ? JSON.parse(stripUtf8Bom(readFileSync(filePath, 'utf8'))) : [];
  const index = raw.findIndex((s) => s.id === serverId);
  if (index < 0) throw new Error(`Server "${serverId}" not found`);
  const merged = { ...raw[index], ...serverData, id: serverId };
  const validated = serverSchema.parse(merged);
  raw[index] = validated;
  writeFileSync(filePath, JSON.stringify(raw, null, 2), 'utf8');
  return applyDefaults(validated);
}

export function deleteServer(filePath, serverId) {
  const raw = existsSync(filePath) ? JSON.parse(stripUtf8Bom(readFileSync(filePath, 'utf8'))) : [];
  const index = raw.findIndex((s) => s.id === serverId);
  if (index < 0) throw new Error(`Server "${serverId}" not found`);
  raw.splice(index, 1);
  writeFileSync(filePath, JSON.stringify(raw, null, 2), 'utf8');
}
