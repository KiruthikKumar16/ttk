import { spawn } from 'node:child_process'
import process from 'node:process'

const child = spawn('pnpm', ['exec', 'next', 'build'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, ANALYZE: 'true' },
})
child.once('error', (error) => {
  console.error(error.message)
  process.exitCode = 1
})
child.once('exit', (code) => {
  process.exitCode = code ?? 1
})
