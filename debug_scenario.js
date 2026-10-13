const { spawn } = require('child_process');

async function debugScenario() {
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless',
    '--remote-debugging-port=9222',
    'file:///' + __dirname.replace(/\\\\/g, '/') + '/src/index.html'
  ]);
  const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
    '--headless',
    '--remote-debugging-port=9223',
    'file:///' + __dirname.replace(/\\\\/g, '/') + '/src/index.html'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const targetH = (await (await fetch('http://127.0.0.1:9222/json/list')).json()).find(t => t.url.includes('src/index.html'));
  const targetG = (await (await fetch('http://127.0.0.1:9223/json/list')).json()).find(t => t.url.includes('src/index.html'));

  const wsH = new WebSocket(targetH.webSocketDebuggerUrl);
  const wsG = new WebSocket(targetG.webSocketDebuggerUrl);

  await new Promise(r => wsH.onopen = r);
  await new Promise(r => wsG.onopen = r);

  function evalH(expr) {
    return new Promise(resolve => {
      const id = Math.floor(Math.random() * 100000);
      const onMsg = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === id) { wsH.removeEventListener('message', onMsg); resolve(d.result?.result?.value); }
      };
      wsH.addEventListener('message', onMsg);
      wsH.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr } }));
    });
  }

  function evalG(expr) {
    return new Promise(resolve => {
      const id = Math.floor(Math.random() * 100000);
      const onMsg = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === id) { wsG.removeEventListener('message', onMsg); resolve(d.result?.result?.value); }
      };
      wsG.addEventListener('message', onMsg);
      wsG.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr } }));
    });
  }

  // Hook console logs
  wsH.send(JSON.stringify({ id: 101, method: 'Console.enable' }));
  wsH.addEventListener('message', (e) => {
    const d = JSON.parse(e.data);
    if (d.method === 'Console.messageAdded') console.log('[CHROME CONSOLE]:', d.params.message.text);
  });

  wsG.send(JSON.stringify({ id: 102, method: 'Console.enable' }));
  wsG.addEventListener('message', (e) => {
    const d = JSON.parse(e.data);
    if (d.method === 'Console.messageAdded') console.log('[EDGE CONSOLE]:', d.params.message.text);
  });

  console.log('1. Chrome creates room...');
  await evalH(`actions.createRoom()`);
  const roomNo = await evalH(`state.roomNo`);
  console.log('Room:', roomNo);

  console.log('2. Chrome clicks 対戦開始...');
  await evalH(`actions.startBattle()`);

  await new Promise(r => setTimeout(r, 2000));

  console.log('3. Edge joins room...');
  await evalG(`actions.lobbyTab('join')`);
  await evalG(`document.getElementById('in-room').value = '${roomNo}'`);
  await evalG(`actions.joinRoom()`);

  console.log('4. Monitoring status for 6 seconds...');
  for (let i = 0; i < 6; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const hStatus = await evalH(`document.getElementById('conn-status')?.textContent`);
    const gStatus = await evalG(`document.getElementById('conn-status')?.textContent`);
    const hConn = await evalH(`P2P.connected`);
    const gConn = await evalG(`P2P.connected`);
    console.log(`[T=${i+1}s] H(conn=${hConn}, status=${hStatus}) | G(conn=${gConn}, status=${gStatus})`);
  }

  wsH.close();
  wsG.close();
  chrome.kill();
  edge.kill();
  process.exit(0);
}

debugScenario().catch(e => console.error(e));
