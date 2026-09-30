import { spawnSync } from 'node:child_process'

const diff = spawnSync('git', ['diff', '--cached', '--unified=0', '--'], {
  encoding: 'utf8',
  maxBuffer: 16 * 1024 * 1024,
})
if (diff.status !== 0) {
  console.error('Secret scan could not inspect staged changes.')
  process.exit(2)
}

const patterns = [
  { name: 'private-key', pattern: /\+[^+].*-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i },
  {
    name: 'service-role-or-upstash-assignment',
    pattern:
      /\+[^+].*(?:SUPABASE_SERVICE_ROLE_KEY|UPSTASH_REDIS_REST_TOKEN)\s*[:=]\s*['"]?(?!\$\{?)[A-Za-z0-9_\-]{16,}/i,
  },
  { name: 'provider-token', pattern: /\+[^+].*\b(?:ghp|github_pat|sk_live|rk_live)_[A-Za-z0-9_]{20,}/ },
  { name: 'supabase-secret-key', pattern: /\+[^+].*\bsb_secret_[A-Za-z0-9_-]{20,}/ },
  { name: 'aws-access-key', pattern: /\+[^+].*\bAKIA[0-9A-Z]{16}\b/ },
]

function isPlaceholder(line) {
  const assignment = line.match(/(?:SUPABASE_SERVICE_ROLE_KEY|UPSTASH_REDIS_REST_TOKEN)\s*[:=]\s*['"]?([^'"\s,}]+)/i)
  if (
    assignment &&
    /(?:^|[_-])(?:replace|your|test|fake|mock|dummy|example|placeholder|local|ci)(?:[_-]|$)/i.test(assignment[1])
  )
    return true
  const secretKey = line.match(/\bsb_secret_([A-Za-z0-9_-]{20,})/)
  return Boolean(
    secretKey &&
    /(?:^|[_-])(?:test|fake|mock|dummy|example|placeholder|replace|your|local|ci)(?:[_-]|$)/i.test(secretKey[1]),
  )
}
let currentFile = 'unknown file'
const matches = new Map()
for (const line of diff.stdout.split(/\r?\n/)) {
  if (line.startsWith('+++ b/')) currentFile = line.slice('+++ b/'.length)
  const matchedPattern = patterns.find(({ pattern }) => pattern.test(line))
  if (matchedPattern && !isPlaceholder(line)) {
    const names = matches.get(currentFile) ?? new Set()
    names.add(matchedPattern.name)
    matches.set(currentFile, names)
  }
}
if (matches.size) {
  console.error(
    `Potential credential found in staged additions: ${[...matches]
      .map(([file, names]) => `${file} (${[...names].join(', ')})`)
      .join('; ')}. Inspect the values, remove any real credentials, and rotate them if exposed.`,
  )
  process.exit(1)
}
console.log('Staged secret scan passed.')
