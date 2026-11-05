/** What a first launch shows: five languages, thirty snippets (retry-with-backoff selected first), three collections and some recent use. */
import { type Snippet, type VaultState, variablesOf } from './domain.ts'

const at = (day: string, time = '10:00') => `${day}T${time}`

interface Row {
  id: string
  title: string
  description: string
  language: string
  tags: string[]
  code: string
  updated: string
  starred?: boolean
  used?: string
}

const rows: Row[] = [
  { id: 'retry-with-backoff', title: 'retry-with-backoff', description: 'Exponential retry wrapper for async calls', language: 'ts', tags: ['async', 'resilience', 'network'], updated: at('2026-11-05', '06:40'), starred: true, used: at('2026-11-05', '07:30'),
    code: `export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    attempts = {{attempts}},
    baseDelay = {{baseDelay}},
    maxDelay = 5000,
  } = options;

  for (let attempt = 0;; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= attempts) throw error;
      const delay = Math.min(
        baseDelay * 2 ** attempt, maxDelay
      );
      await sleep(delay);
    }
  }
}` },
  { id: 'use-debounced-value', title: 'use-debounced-value', description: 'React hook with cleanup', language: 'ts', tags: ['react', 'hooks'], updated: at('2026-11-04', '16:20'), starred: true, used: at('2026-11-04', '17:00'),
    code: `import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delay = {{delay}}): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}` },
  { id: 'postgres-json-merge', title: 'postgres-json-merge', description: 'Merge JSONB fields atomically', language: 'sql', tags: ['postgres', 'jsonb'], updated: at('2026-10-31'), starred: true,
    code: `UPDATE {{table}}
SET data = data || '{{patch}}'::jsonb,
    updated_at = now()
WHERE id = {{id}}
RETURNING data;` },
  { id: 'safe-fetch', title: 'safe-fetch', description: 'Timeout + typed response', language: 'ts', tags: ['network', 'fetch'], updated: at('2026-10-30'),
    code: `export async function safeFetch<T>(url: string, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(\`\${response.status} \${response.statusText}\`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}` },
  { id: 'parse-env-file', title: 'parse-env-file', description: 'Small .env parser', language: 'js', tags: ['config', 'env'], updated: at('2026-10-28'),
    code: `export function parseEnv(text) {
  const env = {};
  for (const line of text.split(/\\r?\\n/)) {
    const match = line.match(/^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*(.*)\\s*$/);
    if (match) env[match[1]] = match[2].replace(/^(['"])(.*)\\1$/, '$2');
  }
  return env;
}` },
  { id: 'csv-to-dict', title: 'csv-to-dict', description: 'CSV rows to objects', language: 'py', tags: ['csv', 'data'], updated: at('2026-10-27'),
    code: `import csv

def csv_to_dicts(path, delimiter="{{delimiter}}"):
    with open(path, newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle, delimiter=delimiter))` },
  { id: 'debounce', title: 'debounce', description: 'Trailing-edge debounce for any function', language: 'js', tags: ['timing', 'utility'], updated: at('2026-10-26'),
    code: `export function debounce(fn, wait = {{wait}}) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}` },
  { id: 'group-by', title: 'group-by', description: 'Group an array by a key function', language: 'ts', tags: ['array', 'utility'], updated: at('2026-10-25'),
    code: `export function groupBy<T, K extends string | number>(items: T[], key: (item: T) => K): Record<K, T[]> {
  const groups = {} as Record<K, T[]>;
  for (const item of items) (groups[key(item)] ??= []).push(item);
  return groups;
}` },
  { id: 'express-error-handler', title: 'error-middleware', description: 'JSON error handler for a Node HTTP app', language: 'ts', tags: ['api', 'errors'], updated: at('2026-10-24'),
    code: `export function errorMiddleware(error: Error, _req: Request, res: Response, _next: NextFunction) {
  const status = (error as { status?: number }).status ?? 500;
  res.status(status).json({ error: status === 500 ? 'Internal error' : error.message });
}` },
  { id: 'paginate-cursor', title: 'paginate-cursor', description: 'Keyset pagination query', language: 'sql', tags: ['pagination', 'postgres'], updated: at('2026-10-23'),
    code: `SELECT *
FROM {{table}}
WHERE (created_at, id) < ({{after_created_at}}, {{after_id}})
ORDER BY created_at DESC, id DESC
LIMIT {{limit}};` },
  { id: 'upsert-row', title: 'upsert-row', description: 'Insert or update on conflict', language: 'sql', tags: ['postgres', 'upsert'], updated: at('2026-10-22'),
    code: `INSERT INTO {{table}} (id, name, updated_at)
VALUES ({{id}}, '{{name}}', now())
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, updated_at = now();` },
  { id: 'running-totals', title: 'running-totals', description: 'Window function running total per group', language: 'sql', tags: ['analytics', 'window'], updated: at('2026-10-21'),
    code: `SELECT day, amount,
       SUM(amount) OVER (PARTITION BY account_id ORDER BY day) AS running_total
FROM payments
ORDER BY account_id, day;` },
  { id: 'find-large-files', title: 'find-large-files', description: 'Largest files under a folder', language: 'sh', tags: ['disk', 'cleanup'], updated: at('2026-10-20'),
    code: `find {{folder}} -type f -size +{{size}}M -exec ls -lh {} + | sort -k5 -h -r | head -n 20` },
  { id: 'git-prune-branches', title: 'git-prune-branches', description: 'Delete local branches already merged', language: 'sh', tags: ['git', 'cleanup'], updated: at('2026-10-19'), used: at('2026-11-03', '12:00'),
    code: `git fetch --prune
git branch --merged {{base}} | grep -v -E "(^\\*|{{base}})" | xargs -r git branch -d` },
  { id: 'wait-for-port', title: 'wait-for-port', description: 'Block until a TCP port accepts connections', language: 'sh', tags: ['ci', 'network'], updated: at('2026-10-18'),
    code: `until nc -z {{host}} {{port}}; do
  echo "waiting for {{host}}:{{port}}"
  sleep 1
done` },
  { id: 'tar-backup', title: 'tar-backup', description: 'Dated gzip backup of a folder', language: 'sh', tags: ['backup'], updated: at('2026-10-17'),
    code: `tar -czf "backup-$(date +%F).tar.gz" {{folder}}` },
  { id: 'read-json-lines', title: 'read-json-lines', description: 'Stream a JSON Lines file', language: 'py', tags: ['json', 'files'], updated: at('2026-10-16'),
    code: `import json

def read_jsonl(path):
    with open(path, encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                yield json.loads(line)` },
  { id: 'timeit-decorator', title: 'timeit-decorator', description: 'Print how long a function took', language: 'py', tags: ['performance', 'decorator'], updated: at('2026-10-15'),
    code: `import functools
import time

def timeit(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            return fn(*args, **kwargs)
        finally:
            print(f"{fn.__name__} took {time.perf_counter() - start:.3f}s")
    return wrapper` },
  { id: 'chunked', title: 'chunked', description: 'Split a list into fixed-size chunks', language: 'py', tags: ['list', 'utility'], updated: at('2026-10-14'),
    code: `def chunked(items, size={{size}}):
    for start in range(0, len(items), size):
        yield items[start:start + size]` },
  { id: 'sleep-helper', title: 'sleep-helper', description: 'Promise-based sleep', language: 'ts', tags: ['async', 'utility'], updated: at('2026-10-13'),
    code: `export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));` },
  { id: 'event-emitter', title: 'tiny-event-emitter', description: 'Typed event emitter in 15 lines', language: 'ts', tags: ['events', 'utility'], updated: at('2026-10-12'),
    code: `export class Emitter<E extends Record<string, unknown>> {
  private handlers: { [K in keyof E]?: ((payload: E[K]) => void)[] } = {};
  on<K extends keyof E>(event: K, handler: (payload: E[K]) => void) {
    (this.handlers[event] ??= []).push(handler);
    return () => { this.handlers[event] = this.handlers[event]?.filter((h) => h !== handler); };
  }
  emit<K extends keyof E>(event: K, payload: E[K]) {
    for (const handler of this.handlers[event] ?? []) handler(payload);
  }
}` },
  { id: 'format-bytes', title: 'format-bytes', description: 'Human readable file sizes', language: 'js', tags: ['format', 'utility'], updated: at('2026-10-11'),
    code: `export function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
  return \`\${value.toFixed(unit === 0 ? 0 : 1)} \${units[unit]}\`;
}` },
  { id: 'deep-clone', title: 'deep-clone', description: 'structuredClone with a JSON fallback', language: 'js', tags: ['object', 'utility'], updated: at('2026-10-10'),
    code: `export const deepClone = (value) =>
  typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));` },
  { id: 'rate-limit-queue', title: 'rate-limit-queue', description: 'Run async tasks at most N at a time', language: 'ts', tags: ['async', 'concurrency'], updated: at('2026-10-09'),
    code: `export async function runLimited<T>(tasks: (() => Promise<T>)[], limit = {{limit}}): Promise<T[]> {
  const results: T[] = [];
  let next = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (next < tasks.length) {
      const index = next++;
      results[index] = await tasks[index]!();
    }
  }));
  return results;
}` },
  { id: 'select-or-create', title: 'select-or-create', description: 'Find a row or insert it, atomically', language: 'sql', tags: ['postgres', 'upsert'], updated: at('2026-10-08'),
    code: `WITH found AS (
  SELECT id FROM {{table}} WHERE name = '{{name}}'
), created AS (
  INSERT INTO {{table}} (name) SELECT '{{name}}' WHERE NOT EXISTS (SELECT 1 FROM found) RETURNING id
)
SELECT id FROM found UNION ALL SELECT id FROM created;` },
  { id: 'docker-clean', title: 'docker-clean', description: 'Remove stopped containers and dangling images', language: 'sh', tags: ['docker', 'cleanup'], updated: at('2026-10-07'),
    code: `docker container prune -f && docker image prune -f` },
  { id: 'env-check', title: 'env-check', description: 'Fail fast when a variable is missing', language: 'sh', tags: ['config', 'env'], updated: at('2026-10-06'),
    code: `: "\${{{variable}}:?{{variable}} is not set}"` },
  { id: 'argparse-skeleton', title: 'argparse-skeleton', description: 'A small command line with one flag', language: 'py', tags: ['cli'], updated: at('2026-10-05'),
    code: `import argparse

def main():
    parser = argparse.ArgumentParser(description="{{description}}")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()
    if args.verbose:
        print("verbose on")

if __name__ == "__main__":
    main()` },
  { id: 'array-unique', title: 'array-unique', description: 'Unique values of an array, order kept', language: 'js', tags: ['array', 'utility'], updated: at('2026-10-04'),
    code: `export const unique = (items) => [...new Set(items)];` },
]

export function seed(): VaultState {
  const snippets: Snippet[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    language: row.language,
    code: row.code,
    tags: row.tags,
    variables: variablesOf(row.code),
    createdAt: at(row.updated.slice(0, 10), '09:00'),
    updatedAt: row.updated,
    starred: row.starred === true,
    ...(row.used === undefined ? {} : { lastUsedAt: row.used }),
  }))
  return {
    version: 1,
    languages: [
      { id: 'ts', label: 'TypeScript', short: 'TS', ext: 'ts', enabled: true },
      { id: 'js', label: 'JavaScript', short: 'JS', ext: 'js', enabled: true },
      { id: 'py', label: 'Python', short: 'Py', ext: 'py', enabled: true },
      { id: 'sql', label: 'SQL', short: 'SQL', ext: 'sql', enabled: true },
      { id: 'sh', label: 'Shell', short: '$', ext: 'sh', enabled: true },
      { id: 'go', label: 'Go', short: 'Go', ext: 'go', enabled: false },
    ],
    snippets,
    collections: [
      { id: 'api-patterns', name: 'API patterns', snippetIds: ['retry-with-backoff', 'safe-fetch', 'express-error-handler', 'rate-limit-queue'] },
      { id: 'react-hooks', name: 'React hooks', snippetIds: ['use-debounced-value'] },
      { id: 'database-recipes', name: 'Database recipes', snippetIds: ['postgres-json-merge', 'paginate-cursor', 'upsert-row', 'running-totals', 'select-or-create'] },
      { id: 'empty-shelf', name: 'Scratch (empty)', snippetIds: [] },
    ],
  }
}
