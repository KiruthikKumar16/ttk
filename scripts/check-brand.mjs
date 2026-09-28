import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const self = path.resolve(fileURLToPath(import.meta.url))
const excludedDirectories = new Set(['node_modules', '.next', '.git'])
const forbiddenBrand = new RegExp(['ely', 'sium'].join(''), 'i')
const gstinLiteral = /\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/
const applicationSourceExtensions = new Set([
  '.cjs', '.css', '.html', '.js', '.json', '.jsx', '.mjs', '.py', '.ts', '.tsx',
])
const failures = []

async function inspectDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue
    const filename = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      await inspectDirectory(filename)
      continue
    }
    if (!entry.isFile() || path.resolve(filename) === self || entry.name === 'pnpm-lock.yaml') continue

    const contents = await readFile(filename)
    if (contents.includes(0)) continue
    const source = contents.toString('utf8')
    const relativePath = path.relative(root, filename)
    if (forbiddenBrand.test(source)) failures.push(`${relativePath}: old brand reference`)
    // SQL migration seeds are treated as historical database data, not application source.
    if (applicationSourceExtensions.has(path.extname(filename)) && gstinLiteral.test(source)) {
      failures.push(`${relativePath}: GSTIN literal`)
    }
  }
}

await inspectDirectory(root)

if (failures.length > 0) {
  console.error(`Brand check failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`)
  process.exit(1)
}

console.log('Brand check passed: no old brand references or GSTIN literals found.')
