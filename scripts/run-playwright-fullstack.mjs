import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const DEFAULT_SPEC = 'e2e/approval-publish-fullstack.spec.ts'

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workspaceDir = path.resolve(frontendDir, '..')
const backendDir = path.join(workspaceDir, 'BKVolunteersBackend')

const isWindows = process.platform === 'win32'

const toWindowsPath = (value) => {
    if (isWindows && value.startsWith('/')) {
        return value.slice(1)
    }
    return value
}

const normalizedFrontendDir = toWindowsPath(frontendDir)
const normalizedBackendDir = toWindowsPath(backendDir)

const npmCommand = isWindows ? 'npm.cmd' : 'npm'

const parseArgs = (argv) => {
    const specs = []

    for (let index = 0; index < argv.length; index += 1) {
        if (argv[index] === '--spec' && argv[index + 1]) {
            specs.push(argv[index + 1])
            index += 1
        }
    }

    return {
        specs: specs.length > 0 ? specs : [DEFAULT_SPEC],
    }
}

const parseEnvFile = async (filepath) => {
    try {
        const content = await readFile(filepath, 'utf8')
        return content
            .split(/\r?\n/)
            .filter((line) => line.includes('=') && !line.trim().startsWith('#'))
            .reduce((result, line) => {
                const [key, ...rest] = line.split('=')
                result[key.trim()] = rest.join('=').trim()
                return result
            }, {})
    } catch {
        return {}
    }
}

const getDatabaseUrl = async () => {
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL
    }

    const envFile = await parseEnvFile(path.join(normalizedBackendDir, '.env'))
    return envFile.DATABASE_URL
}

const waitHttpReady = async (url, timeoutMs = 90_000) => {
    const deadline = Date.now() + timeoutMs

    while (Date.now() < deadline) {
        try {
            const response = await fetch(url, {
                signal: AbortSignal.timeout(2_000),
            })
            if (response.status >= 200 && response.status < 500) {
                return
            }
        } catch {
        }

        await new Promise((resolve) => setTimeout(resolve, 500))
    }

    throw new Error(`Timed out waiting for ${url}`)
}

const quoteWindowsArg = (value) => {
    const stringValue = String(value)
    if (!/[\s"]/u.test(stringValue)) {
        return stringValue
    }

    return `"${stringValue.replace(/"/g, '\\"')}"`
}

const getSpawnTarget = (command, args) => {
    if (!isWindows) {
        return {
            command,
            args,
        }
    }

    return {
        command: process.env.ComSpec || 'cmd.exe',
        args: [
            '/d',
            '/c',
            [quoteWindowsArg(command), ...args.map(quoteWindowsArg)].join(' '),
        ],
    }
}

const runCommand = (command, args, options = {}) =>
    new Promise((resolve, reject) => {
        const spawnTarget = getSpawnTarget(command, args)
        const child = spawn(spawnTarget.command, spawnTarget.args, {
            cwd: options.cwd,
            env: options.env ?? process.env,
            stdio: 'inherit',
            shell: false,
            detached: !isWindows,
        })

        child.on('error', reject)
        child.on('exit', (code) => {
            if (code === 0) {
                resolve()
                return
            }
            reject(new Error(`Command failed: ${command} ${args.join(' ')} (${code ?? 'null'})`))
        })
    })

const startProcess = (command, args, options = {}) =>
    (() => {
        const spawnTarget = getSpawnTarget(command, args)
        return spawn(spawnTarget.command, spawnTarget.args, {
        cwd: options.cwd,
        env: options.env ?? process.env,
        stdio: 'inherit',
        shell: false,
        detached: !isWindows,
    })
    })()

const stopProcess = async (child) => {
    if (!child?.pid) return

    if (isWindows) {
        await new Promise((resolve) => {
            const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
                stdio: 'ignore',
                shell: false,
            })
            killer.on('exit', () => resolve())
            killer.on('error', () => resolve())
        })
        return
    }

    try {
        process.kill(-child.pid, 'SIGTERM')
    } catch {
        try {
            child.kill('SIGTERM')
        } catch {
        }
    }
}

const main = async () => {
    const { specs } = parseArgs(process.argv.slice(2))
    const databaseUrl = await getDatabaseUrl()

    if (!databaseUrl || !databaseUrl.includes('BKVolunteers_test')) {
        throw new Error('Fullstack runner may only reset BKVolunteers_test')
    }

    const sharedEnv = {
        ...process.env,
        DATABASE_URL: databaseUrl,
    }

    await runCommand(
        npmCommand,
        ['exec', 'prisma', '--', 'db', 'push', '--force-reset', '--accept-data-loss'],
        { cwd: normalizedBackendDir, env: sharedEnv }
    )
    await runCommand(npmCommand, ['run', 'db:seed'], {
        cwd: normalizedBackendDir,
        env: sharedEnv,
    })

    const backendProcess = startProcess(npmCommand, ['run', 'dev'], {
        cwd: normalizedBackendDir,
        env: sharedEnv,
    })
    const frontendProcess = startProcess(npmCommand, ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '3000'], {
        cwd: normalizedFrontendDir,
        env: {
            ...sharedEnv,
            VITE_APP_API_URL: 'http://127.0.0.1:4000',
            VITE_APP_ENABLE_API_MOCKING: 'false',
            VITE_APP_APP_URL: 'http://127.0.0.1:3000',
        },
    })

    try {
        await waitHttpReady('http://127.0.0.1:4000/api-docs')
        await waitHttpReady('http://127.0.0.1:3000')

        await runCommand(
            npmCommand,
            ['exec', 'playwright', '--', 'test', ...specs, '--reporter=line'],
            {
                cwd: normalizedFrontendDir,
                env: {
                    ...sharedEnv,
                    CI: process.env.CI || '1',
                    PLAYWRIGHT_NO_WEBSERVER: '1',
                    PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:3000',
                },
            }
        )
    } finally {
        await stopProcess(frontendProcess)
        await stopProcess(backendProcess)
    }
}

main()
    .then(() => {
        process.exit(0)
    })
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
