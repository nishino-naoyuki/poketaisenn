const { spawn } = require('child_process');

const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless',
  '--remote-debugging-port=9222',
  'file:///c:/Users/nishino/OneDrive - Asojuku/00_JOB/96_repo/poketaisenn/test_p2p.html'
]);

async function check() {
  await new Promise(r => setTimeout(r, 4000));
  try {
    const res = await fetch('http://127.0.0.1:9222/json/list');
    const list = await res.json();
    const target = list.find(t => t.url.includes('test_p2p.html'));
    console.log('Target found:', target?.title);
    if (target && target.webSocketDebuggerUrl) {
      const ws = new WebSocket(target.webSocketDebuggerUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({
          id: 1,
          method: 'Runtime.evaluate',
          params: { expression: 'document.getElementById("log").textContent' }
        }));
      };
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.id === 1) {
          console.log('=== LOG FROM BROWSER ===\n' + data.result.result.value);
          ws.close();
          chrome.kill();
          process.exit(0);
        }
      };
    }
  } catch (err) {
    console.error('Err:', err);
    chrome.kill();
  }
}
check();
