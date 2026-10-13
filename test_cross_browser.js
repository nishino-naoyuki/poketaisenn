const { spawn } = require('child_process');
const fs = require('fs');

// HTML for Host
fs.writeFileSync('test_host.html', `
<!DOCTYPE html>
<html>
<head><script src="https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js"></script></head>
<body>
<pre id="log">HOST LOG:\n</pre>
<script>
const log = (m) => { document.getElementById('log').textContent += m + '\\n'; console.log('HOST:', m); };
const peer = new Peer('pokeca-test-cross-99');
peer.on('open', (id) => log('Peer open: ' + id));
peer.on('connection', (conn) => {
  log('Connection received!');
  conn.on('open', () => {
    log('Conn open!');
    conn.send('HELLO FROM HOST');
  });
  conn.on('data', (d) => log('Data received: ' + d));
  conn.on('error', (e) => log('Conn err: ' + e));
  conn.on('close', () => log('Conn closed'));
});
peer.on('error', (e) => log('Peer err: ' + e.type));
</script>
</body>
</html>
`);

// HTML for Guest
fs.writeFileSync('test_guest.html', `
<!DOCTYPE html>
<html>
<head><script src="https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js"></script></head>
<body>
<pre id="log">GUEST LOG:\n</pre>
<script>
const log = (m) => { document.getElementById('log').textContent += m + '\\n'; console.log('GUEST:', m); };
const peer = new Peer();
peer.on('open', (id) => {
  log('Peer open: ' + id);
  const conn = peer.connect('pokeca-test-cross-99', { reliable: true });
  conn.on('open', () => {
    log('Conn open!');
    conn.send('HELLO FROM GUEST');
  });
  conn.on('data', (d) => log('Data received: ' + d));
  conn.on('error', (e) => log('Conn err: ' + e));
  conn.on('close', () => log('Conn closed'));
});
peer.on('error', (e) => log('Peer err: ' + e.type));
</script>
</body>
</html>
`);

async function run() {
  console.log('Launching Chrome (Host)...');
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless',
    '--remote-debugging-port=9222',
    'file:///' + __dirname.replace(/\\\\/g, '/') + '/test_host.html'
  ]);

  await new Promise(r => setTimeout(r, 3000));

  console.log('Launching Edge (Guest)...');
  const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
    '--headless',
    '--remote-debugging-port=9223',
    'file:///' + __dirname.replace(/\\\\/g, '/') + '/test_guest.html'
  ]);

  await new Promise(r => setTimeout(r, 6000));

  // Check Host log
  try {
    const resH = await fetch('http://127.0.0.1:9222/json/list');
    const listH = await resH.json();
    const targetH = listH.find(t => t.url.includes('test_host.html'));
    if (targetH) {
      const wsH = new WebSocket(targetH.webSocketDebuggerUrl);
      wsH.onopen = () => {
        wsH.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: 'document.getElementById("log").textContent' } }));
      };
      wsH.onmessage = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === 1) {
          console.log('=== HOST (Chrome) ===\n' + d.result.result.value);
          wsH.close();
        }
      };
    }
  } catch (e) { console.error('Host fetch err:', e); }

  // Check Guest log
  try {
    const resG = await fetch('http://127.0.0.1:9223/json/list');
    const listG = await resG.json();
    const targetG = listG.find(t => t.url.includes('test_guest.html'));
    if (targetG) {
      const wsG = new WebSocket(targetG.webSocketDebuggerUrl);
      wsG.onopen = () => {
        wsG.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: 'document.getElementById("log").textContent' } }));
      };
      wsG.onmessage = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === 1) {
          console.log('=== GUEST (Edge) ===\n' + d.result.result.value);
          wsG.close();
        }
      };
    }
  } catch (e) { console.error('Guest fetch err:', e); }

  await new Promise(r => setTimeout(r, 2000));
  chrome.kill();
  edge.kill();
  process.exit(0);
}

run();
