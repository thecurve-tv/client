import { exit } from 'process'
import { exec, run } from './run-script'

async function main() {
  const [serverProcess] = exec('cd .server && npm run start:test')
  let returnCode = 1
  try {
    returnCode = (await run('npm run ci:e2e')).returnCode
  } catch (err) {
    console.error(err)
  }
  serverProcess.kill()
  exit(returnCode)
}

main()
