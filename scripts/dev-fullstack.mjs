import net from 'node:net';
import { spawn } from 'node:child_process';

const API_PORT = Number(process.env.API_PORT || 4000);

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
  const backendAlreadyRunning = await isPortInUse(API_PORT);

  const command = backendAlreadyRunning
    ? 'npm run dev'
    : 'npx concurrently "npm run server" "npm run dev"';

  if (backendAlreadyRunning) {
    console.log(`Port ${API_PORT} is already in use. Assuming backend is already running.`);
    console.log('Starting frontend only...');
  }

  const child = spawn(command, {
    shell: true,
    stdio: 'inherit',
    windowsHide: false,
  });

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
