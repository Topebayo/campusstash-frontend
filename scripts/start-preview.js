import { spawn } from 'child_process';
import os from 'os';

console.log('\n=============================================================');
console.log('🔒 CampusStash 100% Private Local Wi-Fi Preview');
console.log('🚫 Zero third parties, zero public exposure, 100% private.');
console.log('=============================================================\n');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();

console.log(`📱 Connect your phone to your local Wi-Fi and open:`);
console.log(`👉 http://${localIp}:5173\n`);

const vite = spawn('npx', ['vite', '--host'], {
  shell: true,
  stdio: 'inherit'
});

process.on('SIGINT', () => {
  try { vite.kill(); } catch (e) {}
  process.exit();
});
