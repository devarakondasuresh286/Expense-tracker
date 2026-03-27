import net from 'node:net';
import { spawn } from 'node:child_process';

const API_PORT = Number(process.env.API_PORT || 4000);
const API_HEALTH_URL = `http://127.0.0.1:${API_PORT}/api/health`;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

  const command = backendAlreadyRunning
    ? 'npm run dev:client'
    : 'npx concurrently "npm run server" "npm run dev:client"';

  if (backendAlreadyRunning) {
    console.log(`Port ${API_PORT} is already in use. Assuming backend is already running.`);
    console.log('Starting frontend only...');
  }

  const child = spawn(command, {
    shell: true,
    stdio: 'inherit',
    windowsHide: false,
  });

  if (!backendAlreadyRunning) {
    // Give backend a moment to boot before giving users clear diagnostics.
    await wait(2000);
    const isHealthy = await hasHealthyApi();
    if (!isHealthy) {
      console.warn(`Warning: API health check failed at ${API_HEALTH_URL}.`);
      console.warn('Frontend started, but auth requests may fail until backend is healthy.');
    }
  }

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });

  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
};

run().catch((error) => {
  console.error('Failed to start dev environment:', error.message);
  process.exit(1);
});
