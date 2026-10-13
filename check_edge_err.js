const { spawn } = require('child_process');

async function checkConsole() {
  const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
    '--headless',
    '--remote-debugging-port=9223',
    'file:///' + __dirname.replace(/\\\\/g, '/') + '/src/index.html'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const targetG = (await (await fetch('http://127.0.0.1:9223/json/list')).json()).find(t => t.url.includes('src/index.html'));
  const wsG = new WebSocket(targetG.webSocketDebuggerUrl);
  await new Promise(r => wsG.onopen = r);

  wsG.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  wsG.addEventListener('message', (e) => {
    const d = JSON.parse(e.data);
    if (d.method === 'Runtime.exceptionThrown') {
      console.log('EXCEPTION IN EDGE:', JSON.stringify(d.params.exceptionDetails, null, 2));
    }
  });

  await new Promise(r => setTimeout(r, 3000));
  wsG.close();
  edge.kill();
  process.exit(0);
}

checkConsole();
