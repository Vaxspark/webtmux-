import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function collectTestFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectTestFiles(fullPath);
    }
    if (entry.isFile() && entry.name.endsWith('.test.mjs')) {
      return [fullPath];
    }
    return [];
  }));
  return files.flat().sort();
}

const files = await collectTestFiles(path.resolve('tests'));
let failures = 0;
for (const file of files) {
  try {
    await import(pathToFileURL(file).href);
  } catch (error) {
    failures += 1;
    console.error(`FAILED ${path.relative(process.cwd(), file)}`);
    console.error(error);
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log(`PASS ${files.length} test files`);
}
