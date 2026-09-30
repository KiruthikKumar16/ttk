import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const reportPath = resolve('coverage/coverage-summary.json')
const report = JSON.parse(await readFile(reportPath, 'utf8'))
const files = Object.entries(report)
  .filter(([path]) => path !== 'total')
  .map(([path, values]) => [path.replaceAll('\\', '/'), values])

function lineCoverage(entries) {
  const total = entries.reduce((sum, [, value]) => sum + value.lines.total, 0)
  const covered = entries.reduce((sum, [, value]) => sum + value.lines.covered, 0)
  return { total, covered, percent: total ? (covered / total) * 100 : 100 }
}

const overall = report.total.lines
const lib = lineCoverage(files.filter(([path]) => path.includes('/lib/')))
const services = files.filter(([path]) => /\/modules\/[^/]+\/service\.ts$/.test(path))
const serviceFailures = services.filter(([, value]) => value.lines.pct < 85)
console.log(
  `Coverage gates: overall ${overall.pct.toFixed(2)}% lines (>= 70%); lib ${lib.percent.toFixed(2)}% (${lib.covered}/${lib.total}, >= 85%); domain services ${services.length} checked (each >= 85%).`,
)
if (overall.pct < 70 || lib.percent < 85 || serviceFailures.length) {
  for (const [path, value] of serviceFailures) console.error(`Below 85% line coverage: ${path} (${value.lines.pct}%).`)
  process.exitCode = 1
}
