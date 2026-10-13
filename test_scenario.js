const { spawn } = require('child_process');

async function testScenario() {
  console.log('Test Scenario: Host clicks Start Battle before Guest joins');
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
        if (d.id === id) { wsH.removeEventListener('message', onMsg); resolve(d.result.result.value); }
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
        if (d.id === id) { wsG.removeEventListener('message', onMsg); resolve(d.result.result.value); }
      };
      wsG.addEventListener('message', onMsg);
      wsG.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr } }));
    });
  }

  console.log('1. Chrome creates room...');
  await evalH(`actions.createRoom()`);
  const roomNo = await evalH(`state.roomNo`);

  console.log('2. Chrome clicks 対戦開始 BEFORE guest connects!');
  await evalH(`actions.startBattle()`);
  const hPreOpp = await evalH(`state.oppActive?.card?.name`);
  console.log('Chrome opponent right after startBattle:', hPreOpp);

  await new Promise(r => setTimeout(r, 1000));

  console.log('3. Edge joins room...');
  await evalG(`actions.lobbyTab('join')`);
  await evalG(`document.getElementById('in-room').value = '${roomNo}'`);
  await evalG(`actions.joinRoom()`);

  await new Promise(r => setTimeout(r, 3000));

  console.log('4. Edge clicks 対戦開始...');
  await evalG(`actions.startBattle()`);

  await new Promise(r => setTimeout(r, 3000));

  const hFinalOpp = await evalH(`state.oppActive?.card?.name`);
  const gFinalOpp = await evalG(`state.oppActive?.card?.name`);
  const hConn = await evalH(`P2P.connected`);
  const gConn = await evalG(`P2P.connected`);
  console.log('Host connected:', hConn, 'Host sees Opponent:', hFinalOpp);
  console.log('Guest connected:', gConn, 'Guest sees Opponent:', gFinalOpp);

  wsH.close();
  wsG.close();
  chrome.kill();
  edge.kill();
  process.exit(0);
}

testScenario().catch(e => console.error(e));
