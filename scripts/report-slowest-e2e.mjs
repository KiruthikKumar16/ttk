import { readFile } from 'node:fs/promises'

const report = JSON.parse(await readFile('test-results/e2e-results.json', 'utf8'))
const tests = []
function collect(suite, parents = []) {
  const current = suite.title ? [...parents, suite.title] : parents
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const result = test.results?.at(-1)
      if (result)
        tests.push({ name: [...current, spec.title].join(' › '), project: test.projectName, duration: result.duration })
    }
  }
  for (const nested of suite.suites ?? []) collect(nested, current)
}
for (const suite of report.suites ?? []) collect(suite)
tests.sort((a, b) => b.duration - a.duration)
console.log('Slowest E2E tests (latest attempt):')
for (const test of tests.slice(0, 10))
  console.log(`${(test.duration / 1000).toFixed(2)}s  [${test.project}] ${test.name}`)
