import { readdir, stat, writeFile } from 'node:fs/promises'
import { resolve, relative } from 'node:path'

const buildRoot = resolve('.next')
const budgetBytes = Number(process.env.NEXT_BUILD_BUDGET_BYTES ?? 350 * 1024 * 1024)
let totalBytes = 0
const files = []

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (directory === buildRoot && entry.isDirectory() && ['cache', 'dev'].includes(entry.name)) continue
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) await visit(path)
    else {
      const { size } = await stat(path)
      files.push({ path: relative(buildRoot, path).replaceAll('\\', '/'), bytes: size })
      totalBytes += size
    }
  }
}

await visit(buildRoot)
files.sort((a, b) => b.bytes - a.bytes)
const report = {
  buildBytes: totalBytes,
  budgetBytes,
  excludedDirectories: ['cache', 'dev'],
  files: files.length,
  largestFiles: files.slice(0, 20),
}
await writeFile('.next-size-report.json', `${JSON.stringify(report, null, 2)}\n`)
console.log(
  `Next production output: ${(totalBytes / 1024 / 1024).toFixed(1)} MiB across ${files.length} files ` +
    `(excluding cache/dev; budget ${(budgetBytes / 1024 / 1024).toFixed(0)} MiB).`,
)
if (totalBytes > budgetBytes) {
  console.error('Next build output exceeds the configured bundle budget.')
  process.exitCode = 1
}
