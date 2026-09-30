import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const workflowDirectory = resolve('.github/workflows')
const files = (await readdir(workflowDirectory)).filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
const failures = []

for (const file of files) {
  const lines = (await readFile(resolve(workflowDirectory, file), 'utf8')).split(/\r?\n/)
  for (const [index, line] of lines.entries()) {
    const match = line.match(/^\s*-\s*uses:\s*([^\s#]+)/)
    if (!match) continue
    const reference = match[1].split('@').at(-1) ?? ''
    if (!/^[\da-f]{40}$/i.test(reference)) failures.push(`${file}:${index + 1}: action must use a full commit SHA`)
    if (!/#\s*v?\d/.test(line)) failures.push(`${file}:${index + 1}: action pin must include a version comment`)
  }
}

if (failures.length) {
  console.error(`Workflow pin check failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`)
  process.exitCode = 1
} else {
  console.log(
    `Workflow pin check passed: all third-party actions in ${files.length} workflow files use SHA pins and version comments.`,
  )
}
