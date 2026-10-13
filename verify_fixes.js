const { spawn } = require('child_process');

async function verifyAllFixes() {
  console.log('=== [4箇所の修正ポイント 全検証テスト開始] ===');

  console.log('1. Launching Chrome (Host, port 9222)...');
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless',
    '--remote-debugging-port=9222',
    'file:///' + __dirname.replace(/\\/g, '/') + '/src/index.html'
  ]);
  await new Promise(r => setTimeout(r, 2000));

  console.log('2. Launching Edge (Guest, port 9223)...');
  const edge = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
    '--headless',
    '--remote-debugging-port=9223',
    'file:///' + __dirname.replace(/\\/g, '/') + '/src/index.html'
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

  wsH.send(JSON.stringify({ id: 991, method: 'Runtime.enable' }));
  wsH.send(JSON.stringify({ id: 992, method: 'Console.enable' }));
  wsG.send(JSON.stringify({ id: 993, method: 'Runtime.enable' }));
  wsG.send(JSON.stringify({ id: 994, method: 'Console.enable' }));

  wsH.addEventListener('message', (e) => {
    const d = JSON.parse(e.data);
    if (d.method === 'Runtime.consoleAPICalled') {
      console.log('HOST CONSOLE:', d.params.type, d.params.args?.map(a => a.value || a.description).join(' '));
    }
  });

  wsG.addEventListener('message', (e) => {
    const d = JSON.parse(e.data);
    if (d.method === 'Runtime.consoleAPICalled') {
      console.log('GUEST CONSOLE:', d.params.type, d.params.args?.map(a => a.value || a.description).join(' '));
    }
  });

  function evalH(expr) {
    return new Promise(resolve => {
      const id = Math.floor(Math.random() * 100000);
      const onMsg = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === id) {
          wsH.removeEventListener('message', onMsg);
          resolve(d.result?.result?.value);
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
          resolve(d.result?.result?.value);
        }
      };
      wsG.addEventListener('message', onMsg);
      wsG.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr } }));
    });
  }

  try {
    // 【検証ポイント1: スクリプト読み込み & 初期状態のボタン非活性】
    console.log('\n--- 検証1: 初期状態のボタン制御とステータス表示 ---');
    const hInitBtnDisabled = await evalH(`document.getElementById('btn-start').disabled`);
    const hInitBtnText = await evalH(`document.getElementById('btn-start').textContent`);
    const gInitBtnDisabled = await evalG(`document.getElementById('btn-start').disabled`);
    console.log(`Host初期ボタン: disabled=${hInitBtnDisabled}, text="${hInitBtnText}"`);
    console.log(`Guest初期ボタン: disabled=${gInitBtnDisabled}`);
    if (!hInitBtnDisabled || !gInitBtnDisabled) {
      throw new Error("初期状態で対戦開始ボタンが非活性化されていません");
    }

    // 名前を設定
    await evalH(`document.getElementById('in-name').value = 'ホスト花子'`);
    await evalG(`document.getElementById('in-name').value = 'ゲスト太郎'`);

    // 【検証ポイント2: ルーム作成・入室・WebRTC接続とボタン活性化】
    console.log('\n--- 検証2: ルーム作成・Enterキー入室・接続ランプ連動 ---');
    await evalH(`actions.createRoom()`);
    const roomNo = await evalH(`state.roomNo`);
    const hStatusCreated = await evalH(`document.getElementById('conn-status').textContent`);
    console.log(`Hostルーム作成後 status="${hStatusCreated}", roomNo=${roomNo}`);

    // Guest側: 参加タブへ切り替え、Enterキーで入室
    await evalG(`actions.lobbyTab('join')`);
    await evalG(`document.getElementById('in-room').value = '${roomNo}'`);
    // Enterキーイベントを発火
    await evalG(`document.getElementById('in-room').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))`);

    console.log('接続待機中...');
    let connected = false;
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const hConn = await evalH(`P2P.connected`);
      const gConn = await evalG(`P2P.connected`);
      const hBtn = await evalH(`document.getElementById('btn-start').textContent`);
      const gBtn = await evalG(`document.getElementById('btn-start').textContent`);
      const hStatus = await evalH(`document.getElementById('conn-status').textContent`);
      console.log(`  Sec ${i+1}: Host conn=${hConn} [${hStatus}] / btn="${hBtn}"`);
      if (hConn && gConn) {
        connected = true;
        break;
      }
    }
    if (!connected) throw new Error("P2P接続がタイムアウトしました");

    // 接続完了後のボタン表示とステータスランプ検証
    const hBtnConnectedText = await evalH(`document.getElementById('btn-start').textContent`);
    const hBtnConnectedDisabled = await evalH(`document.getElementById('btn-start').disabled`);
    const hConnStatus = await evalH(`document.getElementById('conn-status').textContent`);
    console.log(`Host接続後: disabled=${hBtnConnectedDisabled}, text="${hBtnConnectedText}", status="${hConnStatus}"`);

    if (hBtnConnectedDisabled || !hBtnConnectedText.includes('相手と接続しました')) {
      throw new Error("接続完了時に「相手と接続しました！（対戦開始）」ボタンが活性化していません");
    }
    if (!hConnStatus.includes('接続完了')) {
      throw new Error("ステータスランプ（🟢 接続完了）が表示されていません");
    }

    // 【検証ポイント3: 双方向対戦開始シグナル & 実デッキ同期 & ダミーBOT破棄】
    console.log('\n--- 検証3: 双方向対戦開始シグナル & ダミーBOT破棄 ---');
    // ホストが対戦開始をクリック
    await evalH(`actions.startBattle()`);
    await new Promise(r => setTimeout(r, 1500));

    // ゲスト側も自動的に対戦画面へ遷移したか検証
    const hInGame = await evalH(`!document.getElementById('game').classList.contains('hidden')`);
    const gInGame = await evalG(`!document.getElementById('game').classList.contains('hidden')`);
    console.log(`画面遷移: Host in game arena = ${hInGame}, Guest in game arena = ${gInGame}`);
    if (!hInGame || !gInGame) throw new Error("対戦開始シグナルによる自動画面遷移が失敗しました");

    // ダミーBOTデータ（フシギバナex）が完全に破棄されているか検証
    const hOppActive = await evalH(`state.oppActive`);
    const gOppActive = await evalG(`state.oppActive`);
    const hOppBench = await evalH(`JSON.stringify(state.oppBench)`);
    const gOppBench = await evalG(`JSON.stringify(state.oppBench)`);
    console.log(`HostのoppActive:`, hOppActive, `oppBench:`, hOppBench);
    console.log(`GuestのoppActive:`, gOppActive, `oppBench:`, gOppBench);

    if (hOppActive !== null || gOppActive !== null) {
      throw new Error("ダミーBOTデータ（フシギバナex）が残っています！ oppActiveは初期nullである必要があります");
    }

    // 【検証ポイント4: 対戦画面ヘッダーでの接続・相手情報表示】
    console.log('\n--- 検証4: 対戦画面ヘッダーの「🟢 通信対戦中: [相手の名前]」表示 ---');
    const hHeaderBadge = await evalH(`document.getElementById('g-conn-badge').textContent.trim()`);
    const gHeaderBadge = await evalG(`document.getElementById('g-conn-badge').textContent.trim()`);
    console.log(`Host側ヘッダーバッジ: "${hHeaderBadge}"`);
    console.log(`Guest側ヘッダーバッジ: "${gHeaderBadge}"`);

    if (!hHeaderBadge.includes('通信対戦中') || !hHeaderBadge.includes('ゲスト太郎')) {
      throw new Error(`Hostヘッダーに相手名（ゲスト太郎）が表示されていません: "${hHeaderBadge}"`);
    }
    if (!gHeaderBadge.includes('通信対戦中') || !gHeaderBadge.includes('ホスト花子')) {
      throw new Error(`Guestヘッダーに相手名（ホスト花子）が表示されていません: "${gHeaderBadge}"`);
    }

    console.log('\n======================================================');
    console.log('🎉 4箇所の修正要求項目 すべて合格しました！ (100% PASS) 🎉');
    console.log('======================================================');

  } finally {
    wsH.close();
    wsG.close();
    chrome.kill();
    edge.kill();
  }
}

verifyAllFixes().catch(err => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
