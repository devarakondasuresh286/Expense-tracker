import net from 'node:net';
import { spawn } from 'node:child_process';

const API_PORT = Number(process.env.API_PORT || 4000);
const API_HEALTH_URL = `http://127.0.0.1:${API_PORT}/api/health`;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const wireChildShutdown = (child) => {
  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
};

const hasHealthyApi = async () => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const response = await fetch(API_HEALTH_URL, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return false;
    }

    const data = await response.json().catch(() => ({}));
    return data?.status === 'ok';
  } catch {
    return false;
  }
};

const waitForHealthyApi = async ({ timeoutMs = 45000, intervalMs = 1000 } = {}) => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const healthy = await hasHealthyApi();
    if (healthy) {
      return true;
    }

    await wait(intervalMs);
  }

  return false;
};

const isPortInUse = (port) =>
  new Promise((resolve) => {
    const tester = net
      .createServer()
      .once('error', (error) => {
        resolve(error?.code === 'EADDRINUSE');
      })
      .once('listening', () => {
        tester.close(() => resolve(false));
      })
      .listen(port, '0.0.0.0');
  });

const run = async () => {
  const backendAlreadyRunning = await hasHealthyApi();
  const apiPortInUse = await isPortInUse(API_PORT);

  if (!backendAlreadyRunning && apiPortInUse) {
    console.error(`Port ${API_PORT} is already in use, but /api/health is not reachable.`);
    console.error('Stop the process using this port or change PORT/API_PORT, then run again.');
    process.exit(1);
  }

  if (backendAlreadyRunning) {
    console.log(`Port ${API_PORT} is already in use. Assuming backend is already running.`);
    console.log('Starting frontend only...');

    const frontend = spawn('npm run dev:client', {
      shell: true,
      stdio: 'inherit',
      windowsHide: false,
    });

    wireChildShutdown(frontend);
    frontend.on('exit', (code) => {
      process.exit(code ?? 0);
    });
    return;
  }

  const backend = spawn('npm run server', {
    shell: true,
    stdio: 'inherit',
    windowsHide: false,
  });

  wireChildShutdown(backend);

  console.log(`Waiting for API health check at ${API_HEALTH_URL}...`);
  const isHealthy = await waitForHealthyApi();

  if (!isHealthy) {
    console.error(`API did not become healthy at ${API_HEALTH_URL} within the timeout.`);
    backend.kill('SIGTERM');
    process.exit(1);
  }

  console.log('API is healthy. Starting frontend...');

  const frontend = spawn('npm run dev:client', {
    shell: true,
    stdio: 'inherit',
    windowsHide: false,
  });

  wireChildShutdown(frontend);

  backend.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`Backend exited with code ${code}. Stopping frontend...`);
      frontend.kill('SIGTERM');
      process.exit(code);
    }
  });

  frontend.on('exit', (code) => {
    backend.kill('SIGTERM');
    process.exit(code ?? 0);
  });
};

run().catch((error) => {
  console.error('Failed to start dev environment:', error.message);
  process.exit(1);
});
