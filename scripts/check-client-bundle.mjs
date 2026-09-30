import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, relative, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import vm from 'node:vm'

const appRoot = resolve('.next/server/app')
const clientRoot = resolve('.next/static/chunks')
const budgetBytes = Number(process.env.NEXT_CLIENT_GZIP_BUDGET_BYTES ?? 200 * 1024)
const manifests = []

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) await collect(path)
    else if (entry.name.endsWith('page_client-reference-manifest.js')) manifests.push(path)
  }
}

await collect(appRoot)
const routes = []
for (const manifestPath of manifests) {
  const sandbox = { globalThis: {} }
  vm.runInNewContext(await readFile(manifestPath, 'utf8'), sandbox, { timeout: 1000 })
  const manifest = sandbox.globalThis.__RSC_MANIFEST
  const routeName = Object.keys(manifest ?? {})[0]
  if (!routeName || !['/(dashboard)/page', '/(dashboard)/students/page'].includes(routeName)) continue
  const chunks = new Set()
  for (const module of Object.values(manifest[routeName].clientModules ?? {})) {
    for (const chunk of module.chunks ?? []) {
      if (chunk.startsWith('/_next/static/chunks/') && chunk.endsWith('.js')) chunks.add(chunk)
    }
  }
  let gzipBytes = 0
  const files = []
  for (const chunk of chunks) {
    const path = resolve(clientRoot, chunk.slice('/_next/static/chunks/'.length))
    try {
      const source = await readFile(path)
      const bytes = gzipSync(source, { level: 9 }).byteLength
      gzipBytes += bytes
      files.push({ file: relative(resolve('.next'), path).split(sep).join('/'), gzipBytes: bytes })
    } catch {
      // Some manifests include chunks emitted by the framework outside the static chunk directory.
    }
  }
  routes.push({ route: routeName, gzipBytes, files: files.sort((a, b) => b.gzipBytes - a.gzipBytes) })
}

if (routes.length === 0) throw new Error('No dashboard client-reference manifests were found after build.')
const report = { budgetBytes, routes }
await writeFile('.next-client-size-report.json', `${JSON.stringify(report, null, 2)}\n`)
for (const route of routes) {
  console.log(`${route.route}: ${(route.gzipBytes / 1024).toFixed(1)} KiB gzip (${route.files.length} chunks).`)
  if (route.gzipBytes > budgetBytes) {
    console.error(
      `Client JavaScript for ${route.route} exceeds the ${(budgetBytes / 1024).toFixed(0)} KiB gzip budget.`,
    )
    process.exitCode = 1
  }
}
