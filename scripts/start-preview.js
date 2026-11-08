import { spawn } from 'child_process';
import http from 'http';
import os from 'os';

console.log('\n=============================================================');
console.log('🚀 Starting CampusStash Live Preview & Secure Tunnel...');
console.log('🔒 Production Railway app is SAFE & FROZEN on main branch.');
console.log('=============================================================\n');

// 1. Get local LAN IP
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

// 2. Start Vite Dev Server
const vite = spawn('npx', ['vite', '--host'], {
  shell: true,
  stdio: 'inherit'
});

vite.on('error', (err) => {
  console.error('Failed to start Vite:', err);
});

// 3. Start ngrok tunnel on port 5173
const ngrok = spawn('ngrok', ['http', '5173'], {
  shell: true,
  stdio: 'ignore'
});

ngrok.on('error', (err) => {
  console.error('Failed to start ngrok:', err);
});

// 4. Poll ngrok API for the public URL
function getNgrokUrl(retries = 15) {
  if (retries <= 0) {
    console.log(`\n📱 Local Network URL (same Wi-Fi): http://${localIp}:5173`);
    console.log('⚠️ Could not fetch public ngrok URL. Ensure ngrok is running.\n');
    return;
  }

  const req = http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        const tunnel = json.tunnels && json.tunnels.find(t => t.proto === 'https' || t.proto === 'http');
        if (tunnel && tunnel.public_url) {
          console.log('\n🎉 =============================================================');
          console.log(`🌐 PUBLIC PREVIEW LINK (Works from ANYWHERE on phone/data):`);
          console.log(`👉 ${tunnel.public_url}`);
          console.log(`\n📱 LOCAL NETWORK LINK (Same Wi-Fi):`);
          console.log(`👉 http://${localIp}:5173`);
          console.log('=============================================================');
          console.log('⚡ Any code updates will Hot-Reload LIVE on your phone screen!');
          console.log('Press Ctrl+C to stop the preview tunnel.\n');
          return;
        }
      } catch (e) {}
      setTimeout(() => getNgrokUrl(retries - 1), 1000);
    });
  });

  req.on('error', () => {
    setTimeout(() => getNgrokUrl(retries - 1), 1000);
  });
}

// Start polling for tunnel after 2 seconds
setTimeout(() => getNgrokUrl(), 2000);

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\nStopping preview server and tunnel...');
  try { vite.kill(); } catch (e) {}
  try { ngrok.kill(); } catch (e) {}
  process.exit();
});
