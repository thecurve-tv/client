import { ChildProcess, exec as systemExec } from 'child_process'
import { Writable } from 'stream'

class WritableTextStream extends Writable {
  public text: string = ''

  constructor() {
    super()
  }

  _write(chunk: Buffer, _encoding: BufferEncoding, done: (error?: Error | null) => void): void {
    const chunkText = chunk.toString()
    this.text += chunkText
    console.log(chunkText)
    done()
  }
}


class RunResult {
  public returnCode: number = NaN
  public signal: string | null = null
  public completed: boolean = false

  constructor(
    private _stdout: WritableTextStream,
    private _stderr: WritableTextStream
  ) { }

  stdout() {
    return this._stdout.text.trim()
  }

  stderr() {
    return this._stderr.text.trim()
  }
}

async function awaitProcess(child: ChildProcess): Promise<[code: number | null, signal: string | null]> {
  return new Promise((resolve, reject) => {
    child.once('exit', (code, signal) => resolve([code, signal]))
    child.once('error', err => reject(err))
  })
}

export async function run(cmd: string) {
  const [child, stdout, stderr] = exec(cmd)
  const result = new RunResult(stdout, stderr)
  const [returnCode, signal] = await awaitProcess(child)
  result.returnCode = returnCode == null ? NaN : returnCode // ChildProcess can supply null return codes
  result.signal = signal
  result.completed = true
  return result
}

export function exec(cmd: string): [child: ChildProcess, stdout: WritableTextStream, stderr: WritableTextStream] {
  const child = systemExec(cmd)
  const stdout = new WritableTextStream()
  const stderr = new WritableTextStream()
  child.stdout?.pipe(stdout)
  child.stderr?.pipe(stderr)
  return [child, stdout, stderr]
}
