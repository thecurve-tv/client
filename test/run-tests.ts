import { ChildProcess } from 'child_process'
import { exit } from 'process'
import { exec, run } from './run-script'

async function main() {
  const serverPath = '../../server'//'../.server'
  const [serverProcess, serverStdout] = exec(`cd ${serverPath} && npm run start:test`)
  const [angularProcess, angularStdout] = exec('cd ../ && npm run ng serve -- -c test')
  console.log(`
    ==========
    run_tests.ts:
    Started service processes.
      Server pid = ${serverProcess.pid}
      Angular pid = ${angularProcess.pid}
    ==========
  `)
  let numTries = 0, maxTries = 6, retryInterval = 15
  let serverReady = false, angularReady = false
  while (numTries < maxTries) {
    numTries++
    await new Promise(resolve => setTimeout(resolve, retryInterval * 1000))
    serverReady = serverStdout.text.toLocaleLowerCase().includes('connected to mongodb')
    angularReady = angularStdout.text.toLocaleLowerCase().includes('compiled successfully')
    if (serverReady && angularReady) break
    console.log(`
    ==========
    run_tests.ts:
    \tServer ready = ${serverReady}
    \tAngular ready = ${angularReady}
    This is attempt ${numTries} of ${maxTries}
    ${numTries < maxTries ? `Will try again after ${retryInterval} seconds` : 'Exiting.'}
    ==========
    `)
  }
  let returnCode = 1
  if (serverReady && angularReady) {
    console.log(`
    ==========
    run_tests.ts:
    Services are ready. Starting e2e tests.
    ==========
    `)
    try {
      returnCode = (await run('npm run cypress:run')).returnCode
    } catch (err) {
      console.error(err)
    }
  }
  console.log(`
    ==========
    run_tests.ts:
    Killing service processes.
      Server pid = ${serverProcess.pid}
      Angular pid = ${angularProcess.pid}
    ==========
  `)
  const kill = (child: ChildProcess) => new Promise<void>(resolve => setTimeout(() => {
    child.kill()
    resolve()
  }, 1000))
  await kill(serverProcess)
  await kill(angularProcess)
  exit(returnCode)
}

main()
