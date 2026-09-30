import { readFile, writeFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import prettier from 'prettier'

const sourcePath = 'lib/auth/permissions.ts'
const outputPath = 'docs/architecture/role-permissions.md'
const source = await readFile(sourcePath, 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const module = { exports: {} }
runInNewContext(compiled, { exports: module.exports, Object })
const { resources, permissions } = module.exports
const roles = Object.keys(permissions)
const cell = (role, resource) => (permissions[role][resource] ?? []).join(', ') || '—'
const lines = [
  '# Role permissions',
  '',
  '> Generated from `lib/auth/permissions.ts` by `pnpm docs:permissions`. Do not edit this table by hand.',
  '',
  '| Resource | Admin | Staff | Trainer |',
  '| --- | --- | --- | --- |',
  ...resources.map(
    (resource) =>
      `| ${resource} | ${cell('admin', resource)} | ${cell('staff', resource)} | ${cell('trainer', resource)} |`,
  ),
  '',
]
const expected = await prettier.format(lines.join('\n'), { parser: 'markdown' })

if (process.argv.includes('--check')) {
  const existing = await readFile(outputPath, 'utf8').catch(() => '')
  if (existing !== expected) {
    console.error(`${outputPath} is out of date. Run pnpm docs:permissions.`)
    process.exitCode = 1
  }
} else {
  await writeFile(outputPath, expected)
  process.stdout.write(`Generated ${outputPath}\n`)
}
