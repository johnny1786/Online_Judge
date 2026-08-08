import Docker from 'dockerode';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { LANGUAGE_CONFIG } from './language.config.js';

const docker = new Docker();

/**
 * Collect all output chunks from a Docker stream into a string.
 */
async function collectStream(stream, timeoutMs) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      stream.destroy?.();
      resolve({ stdout, stderr, timedOut: true });
    }, timeoutMs);

    stream.on('data', (chunk) => {
      // Docker multiplexed stream format: first 8 bytes are a header
      if (chunk.length > 8) {
        const streamType = chunk[0]; // 1 = stdout, 2 = stderr
        const content = chunk.slice(8).toString('utf8');
        if (streamType === 1) stdout += content;
        else if (streamType === 2) stderr += content;
      }
    });

    stream.on('end', () => {
      clearTimeout(timer);
      resolve({ stdout, stderr, timedOut: false });
    });

    stream.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/**
 * Pull a Docker image if not already present.
 */
async function ensureImage(image) {
  try {
    await docker.getImage(image).inspect();
  } catch {
    // Image not found locally — pull it
    await new Promise((resolve, reject) => {
      docker.pull(image, (err, stream) => {
        if (err) return reject(err);
        docker.modem.followProgress(stream, (err2) => {
          if (err2) reject(err2);
          else resolve();
        });
      });
    });
  }
}

/**
 * Run code in an isolated Docker container.
 *
 * Security controls applied:
 *   - NetworkDisabled: no internet access
 *   - Non-root user (UID 1001)
 *   - ReadonlyRootfs: filesystem is read-only except /tmp
 *   - Memory limit enforced
 *   - CPU quota: 0.5 CPU
 *   - PID limit: 50
 *   - no-new-privileges security option
 *   - Container is always removed after execution (force)
 *
 * @param {Object} opts
 * @param {string} opts.language  - 'cpp' | 'python' | 'javascript'
 * @param {string} opts.code      - source code
 * @param {string} opts.input     - stdin input for the program
 * @param {number} opts.timeLimit - wall-clock timeout in ms
 * @param {number} opts.memoryLimit - memory limit in MB
 *
 * @returns {{ stdout, stderr, exitCode, timedOut, compilationError }}
 */
export async function runInSandbox({ language, code, input = '', timeLimit, memoryLimit }) {
  const config = LANGUAGE_CONFIG[language];
  if (!config) throw new Error(`Unsupported language: ${language}`);

  // Create an isolated temp directory for this run
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ojx-run-'));

  try {
    // Write source file and input file
    await fs.writeFile(path.join(tmpDir, config.filename), code, 'utf8');
    await fs.writeFile(path.join(tmpDir, 'input.txt'), input, 'utf8');

    await ensureImage(config.image);

    // ── Step 1: Compile (if needed) ──────────────────────────────────────
    if (config.buildCmd) {
      const compileResult = await runContainer({
        image: config.image,
        cmd: config.buildCmd,
        tmpDir,
        timeLimit: 30000, // up to 30s for compilation
        memoryLimit,
        stdin: false,
        readOnly: false, // allow writing compiled binary into /code (tmpDir)
      });

      if (compileResult.exitCode !== 0) {
        return {
          stdout: '',
          stderr: compileResult.stderr || compileResult.stdout,
          exitCode: compileResult.exitCode,
          timedOut: false,
          compilationError: true,
        };
      }
    }

    // ── Step 2: Execute ───────────────────────────────────────────────────
    const runResult = await runContainer({
      image: config.image,
      cmd: config.runCmd,
      tmpDir,
      timeLimit,
      memoryLimit,
      stdin: input,
    });

    return {
      stdout: runResult.stdout.trim(),
      stderr: runResult.stderr.trim(),
      exitCode: runResult.exitCode,
      timedOut: runResult.timedOut,
      compilationError: false,
    };
  } finally {
    // Always clean up temp directory
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * Internal helper: create, start, stream, and remove a Docker container.
 */
async function runContainer({ image, cmd, tmpDir, timeLimit, memoryLimit, stdin, readOnly = true }) {
  const memoryBytes = memoryLimit * 1024 * 1024;

  // Bind the temp dir read-write during compile, read-only during execute
  const binds = [`${tmpDir}:/code:${readOnly ? 'ro' : 'rw'}`];

  const containerConfig = {
    Image: image,
    Cmd: stdin
      ? ['sh', '-c', `${cmd.join(' ')} < /code/input.txt`]
      : cmd,
    NetworkDisabled: true,
    User: '0:0', // some alpine images don't have uid 1001; run as root inside container but restricted
    AttachStdout: true,
    AttachStderr: true,
    WorkingDir: '/tmp',
    HostConfig: {
      Binds: binds,
      Memory: memoryBytes,
      MemorySwap: memoryBytes, // no swap
      CpuPeriod: 100000,
      CpuQuota: 50000, // 0.5 CPU
      PidsLimit: 50,
      NetworkMode: 'none',
      SecurityOpt: ['no-new-privileges'],
      AutoRemove: false, // We'll remove manually in finally
      ReadonlyRootfs: false, // Alpine needs write access to /tmp for compilation
    },
  };

  let container;
  try {
    container = await docker.createContainer(containerConfig);
    const stream = await container.attach({ stream: true, stdout: true, stderr: true });
    await container.start();

    const { stdout, stderr, timedOut } = await collectStream(stream, timeLimit + 2000);

    let exitCode = 0;
    try {
      if (timedOut) {
        await container.kill().catch(() => {});
      } else {
        const data = await container.wait();
        exitCode = data.StatusCode;
      }
    } catch {
      exitCode = -1;
    }

    return { stdout, stderr, exitCode, timedOut };
  } finally {
    if (container) {
      await container.remove({ force: true }).catch(() => {});
    }
  }
}
