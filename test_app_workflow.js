const { spawn } = require('child_process');

async function testApp() {
  console.log('1. Launching Chrome (Host)...');
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless',
    '--remote-debugging-port=9222',
    'file:///' + __dirname.replace(/\\\\/g, '/') + '/src/index.html'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  console.log('2. Launching Edge (Guest)...');
  const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
    '--headless',
    '--remote-debugging-port=9223',
    'file:///' + __dirname.replace(/\\\\/g, '/') + '/src/index.html'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const resH = await fetch('http://127.0.0.1:9222/json/list');
  const targetH = (await resH.json()).find(t => t.url.includes('src/index.html'));

  const resG = await fetch('http://127.0.0.1:9223/json/list');
  const targetG = (await resG.json()).find(t => t.url.includes('src/index.html'));

  const wsH = new WebSocket(targetH.webSocketDebuggerUrl);
  const wsG = new WebSocket(targetG.webSocketDebuggerUrl);

  await new Promise(r => wsH.onopen = r);
  await new Promise(r => wsG.onopen = r);

  function evalH(expr) {
    return new Promise(resolve => {
      const id = Math.floor(Math.random() * 100000);
      const onMsg = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === id) {
          wsH.removeEventListener('message', onMsg);
          resolve(d.result.result.value);
        }
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
        if (d.id === id) {
          wsG.removeEventListener('message', onMsg);
          resolve(d.result.result.value);
        }
      };
      wsG.addEventListener('message', onMsg);
      wsG.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr } }));
    });
  }

  console.log('3. Chrome: Create Room...');
  await evalH(`actions.createRoom()`);
  const roomNo = await evalH(`state.roomNo`);
  console.log('Room created:', roomNo);

  await new Promise(r => setTimeout(r, 1000));

  console.log('4. Edge: Join Room...');
  await evalG(`actions.lobbyTab('join')`);
  await evalG(`document.getElementById('in-room').value = '${roomNo}'`);
  await evalG(`actions.joinRoom()`);

  console.log('Waiting for P2P connection...');
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const hConn = await evalH(`P2P.connected`);
    const gConn = await evalG(`P2P.connected`);
    const hStatus = await evalH(`document.getElementById('conn-status').textContent`);
    const gStatus = await evalG(`document.getElementById('conn-status').textContent`);
    console.log(`Sec ${i+1}: Host conn=${hConn} (${hStatus}), Guest conn=${gConn} (${gStatus})`);
    if (hConn && gConn) break;
  }

  console.log('5. Clicking Start Battle on both...');
  await evalH(`actions.startBattle()`);
  await evalG(`actions.startBattle()`);

  await new Promise(r => setTimeout(r, 2000));

  console.log('Checking state on Host:');
  const hOppActive = await evalH(`JSON.stringify(state.oppActive)`);
  const hOppDeck = await evalH(`state.oppDeckCount`);
  const hOppHand = await evalH(`state.oppHandCount`);
  console.log('Host oppActive:', hOppActive);
  console.log('Host oppDeckCount:', hOppDeck, 'oppHandCount:', hOppHand);

  console.log('Checking state on Guest:');
  const gOppActive = await evalG(`JSON.stringify(state.oppActive)`);
  const gOppDeck = await evalG(`state.oppDeckCount`);
  const gOppHand = await evalG(`state.oppHandCount`);
  console.log('Guest oppActive:', gOppActive);
  console.log('Guest oppDeckCount:', gOppDeck, 'oppHandCount:', gOppHand);

  wsH.close();
  wsG.close();
  chrome.kill();
  edge.kill();
  process.exit(0);
}

testApp().catch(e => console.error(e));
