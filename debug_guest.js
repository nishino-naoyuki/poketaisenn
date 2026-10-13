const { spawn } = require('child_process');

async function debugEdge() {
  const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
    '--headless',
    '--remote-debugging-port=9223',
    'file:///' + __dirname.replace(/\\/g, '/') + '/src/index.html'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const res = await fetch('http://127.0.0.1:9223/json/list');
  const target = (await res.json()).find(t => t.url.includes('src/index.html'));
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  ws.onmessage = (e) => {
    const d = JSON.parse(e.data);
    if (d.params && d.params.message) {
      console.log('CONSOLE:', d.params.message.text);
    } else if (d.result) {
      console.log('RESULT id=' + d.id + ':', JSON.stringify(d.result));
    }
  };

  ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));

  // Test calling P2P._onData({ t: 'start', name: 'Host' })
  ws.send(JSON.stringify({
    id: 3,
    method: 'Runtime.evaluate',
    params: { expression: `
      try {
        console.log('Calling P2P._onData directly...');
        P2P._onData({ t: 'start', name: 'HostPlayer' });
        console.log('Called successfully. game hidden?', document.getElementById('game').classList.contains('hidden'));
      } catch (err) {
        console.error('ERROR in _onData:', err.stack);
      }
    ` }
  }));

  await new Promise(r => setTimeout(r, 2000));
  ws.close();
  edge.kill();
}

debugEdge();
