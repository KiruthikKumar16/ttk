import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const outputPath = resolve(fileURLToPath(new URL('../lib/supabase/database.types.ts', import.meta.url)))
const result = spawnSync('supabase', ['gen', 'types', '--local', '--schema', 'public'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
})

if (result.error || result.status !== 0) {
  process.stderr.write(result.stderr || result.error?.message || 'Supabase type generation failed.\n')
  process.exit(result.status || 1)
}

if (process.argv.includes('--check')) {
  let committedTypes
  try {
    committedTypes = readFileSync(outputPath, 'utf8')
  } catch {
    process.stderr.write('Database types are missing. Run pnpm db:types and commit the generated file.\n')
    process.exit(1)
  }
  if (committedTypes !== result.stdout) {
    process.stderr.write('Database types are out of date. Run pnpm db:types and commit the result.\n')
    process.exit(1)
  }
  process.stdout.write('Database types match the local schema.\n')
} else {
  writeFileSync(outputPath, result.stdout)
  process.stdout.write(`Generated ${outputPath}\n`)
}
