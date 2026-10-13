const { spawn } = require('child_process');

async function testSetupPhase() {
  console.log('=== [E2E TEST] 対戦準備フェーズ & P2P通信 自動検証開始 ===');

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
    // 3. ルーム作成 (Host)
    console.log('3. Chrome: Create Room...');
    await evalH(`actions.createRoom()`);
    const roomNo = await evalH(`state.roomNo`);
    console.log(`   Room created: ${roomNo}`);
    await new Promise(r => setTimeout(r, 1000));

    // 4. ルーム参加 (Guest)
    console.log('4. Edge: Join Room...');
    await evalG(`actions.lobbyTab('join')`);
    await evalG(`document.getElementById('in-room').value = '${roomNo}'`);
    await evalG(`actions.joinRoom()`);

    // 5. 接続待機
    console.log('5. Waiting for P2P connection...');
    let connected = false;
    for (let i = 0; i < 12; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const hConn = await evalH(`P2P.connected`);
      const gConn = await evalG(`P2P.connected`);
      const hBtnText = await evalH(`document.getElementById('btn-start').textContent`);
      const gBtnText = await evalG(`document.getElementById('btn-start').textContent`);
      console.log(`   Sec ${i+1}: Host conn=${hConn} [${hBtnText}], Guest conn=${gConn} [${gBtnText}]`);
      if (hConn && gConn) {
        connected = true;
        break;
      }
    }
    if (!connected) throw new Error("P2P connection timed out");

    // 6. ホストが対戦開始をクリック
    console.log('6. Host clicks Start Battle (Guest should enter automatically)...');
    await evalH(`actions.startBattle()`);
    await new Promise(r => setTimeout(r, 1500));

    const hInGame = await evalH(`!document.getElementById('game').classList.contains('hidden')`);
    const gInGame = await evalG(`!document.getElementById('game').classList.contains('hidden')`);
    console.log(`   Host in game arena: ${hInGame}, Guest in game arena: ${gInGame}`);
    if (!hInGame || !gInGame) throw new Error("Failed to enter game arena");

    // 7. セットアップフェーズ初期状態の確認
    const hSetupPhase = await evalH(`state.isSetupPhase`);
    const gSetupPhase = await evalG(`state.isSetupPhase`);
    const hActive = await evalH(`state.myActive`);
    const gActive = await evalG(`state.myActive`);
    const hHandLen = await evalH(`state.myHand.length`);
    const gHandLen = await evalG(`state.myHand.length`);
    console.log(`   Host setupPhase=${hSetupPhase}, myActive=${hActive}, hand=${hHandLen}`);
    console.log(`   Guest setupPhase=${gSetupPhase}, myActive=${gActive}, hand=${gHandLen}`);
    if (!hSetupPhase || !gSetupPhase) throw new Error("Not in setup phase");
    if (hActive !== null || gActive !== null) throw new Error("Active spot must start empty!");
    if (hHandLen !== 7 || gHandLen !== 7) throw new Error("Hand must have 7 cards");

    // 8. コイントス＆先攻後攻決定の処理
    console.log('8. Checking coin toss & order selection...');
    const hChooser = await evalH(`state.coinChooser`);
    const gChooser = await evalG(`state.coinChooser`);
    console.log(`   Host chooser: ${hChooser}, Guest chooser: ${gChooser}`);

    // 選択権を持つプレイヤーが先攻を選択
    if (hChooser === 'host') {
      console.log('   Host is chooser -> choosing "first"');
      await evalH(`chooseFirstPlayer('first')`);
    } else {
      console.log('   Guest is chooser -> choosing "first"');
      await evalG(`chooseFirstPlayer('first')`);
    }
    await new Promise(r => setTimeout(r, 1000));

    const hFirst = await evalH(`state.firstPlayer`);
    const gFirst = await evalG(`state.firstPlayer`);
    console.log(`   Host firstPlayer=${hFirst}, Guest firstPlayer=${gFirst}`);

    // 9. マリガン防止チェック（たねポケモンがいるときはマリガン無効）
    const hHasBasic = await evalH(`hasBasicPokemon(state.myHand)`);
    const hMulliganDisabled = await evalH(`document.getElementById('btn-mulligan').disabled`);
    console.log(`   Host hasBasic=${hHasBasic}, btn-mulligan disabled=${hMulliganDisabled}`);
    if (hHasBasic && !hMulliganDisabled) throw new Error("Mulligan button should be disabled when basic pokemon exists");

    // 10. たねポケモンをバトル場に出す
    console.log('10. Placing basic pokemon into active spots...');
    // 手札から最初のたねポケモンのインデックスを取得してバトル場へ
    const hBasicIdx = await evalH(`state.myHand.findIndex(c => c.category === "たね" || c.category === "Basic" || (c.type === "pokemon" && !c.category?.includes("進化")))`);
    const gBasicIdx = await evalG(`state.myHand.findIndex(c => c.category === "たね" || c.category === "Basic" || (c.type === "pokemon" && !c.category?.includes("進化")))`);
    console.log(`   Host basic card idx=${hBasicIdx}, Guest basic card idx=${gBasicIdx}`);

    await evalH(`placeHandCardToActive(${hBasicIdx})`);
    await evalG(`placeHandCardToActive(${gBasicIdx})`);
    await new Promise(r => setTimeout(r, 1000));

    // 11. 相手の画面で裏面（伏せカード）になっているか検証
    console.log('11. Verifying opponent cards are FACE-DOWN (hidden)...');
    const hOppActiveFaceDown = await evalH(`document.getElementById('opp-active').innerHTML.includes('setup-facedown')`);
    const gOppActiveFaceDown = await evalG(`document.getElementById('opp-active').innerHTML.includes('setup-facedown')`);
    const hOppLabel = await evalH(`document.getElementById('opp-active').textContent.trim()`);
    const gOppLabel = await evalG(`document.getElementById('opp-active').textContent.trim()`);
    console.log(`   Host sees opponent as facedown: ${hOppActiveFaceDown} (text: "${hOppLabel}")`);
    console.log(`   Guest sees opponent as facedown: ${gOppActiveFaceDown} (text: "${gOppLabel}")`);
    if (!hOppActiveFaceDown || !gOppActiveFaceDown) throw new Error("Opponent cards must be masked as face-down during setup phase");

    // 12. 対戦準備完了ボタンの有効化チェック
    const hReadyDisabled = await evalH(`document.getElementById('btn-setup-ready').disabled`);
    const gReadyDisabled = await evalG(`document.getElementById('btn-setup-ready').disabled`);
    console.log(`   Host btn-setup-ready disabled: ${hReadyDisabled}, Guest: ${gReadyDisabled}`);
    if (hReadyDisabled || gReadyDisabled) throw new Error("Setup ready button should be enabled after placing active pokemon");

    // 13. 双方「対戦準備完了」を押下
    console.log('13. Both players click Confirm Setup Ready...');
    await evalH(`actions.setupReady()`);
    await new Promise(r => setTimeout(r, 500));
    await evalG(`actions.setupReady()`);
    await new Promise(r => setTimeout(r, 1500));

    // 14. せーの、オープン！ 対戦開始・伏せカード公開の検証
    console.log('14. Checking match_open transition...');
    const hFinalSetup = await evalH(`state.isSetupPhase`);
    const gFinalSetup = await evalG(`state.isSetupPhase`);
    const hBannerHidden = await evalH(`document.getElementById('setup-banner').classList.contains('hidden')`);
    const gBannerHidden = await evalG(`document.getElementById('setup-banner').classList.contains('hidden')`);
    const hOppRevealed = await evalH(`!document.getElementById('opp-active').innerHTML.includes('setup-facedown')`);
    const gOppRevealed = await evalG(`!document.getElementById('opp-active').innerHTML.includes('setup-facedown')`);

    console.log(`   Host isSetupPhase: ${hFinalSetup}, banner hidden: ${hBannerHidden}, opp revealed: ${hOppRevealed}`);
    console.log(`   Guest isSetupPhase: ${gFinalSetup}, banner hidden: ${gBannerHidden}, opp revealed: ${gOppRevealed}`);

    if (hFinalSetup || gFinalSetup) throw new Error("Setup phase should be ended");
    if (!hBannerHidden || !gBannerHidden) throw new Error("Setup banner should be hidden after open");
    if (!hOppRevealed || !gOppRevealed) throw new Error("Opponent active pokemon should now be revealed");

    console.log('\n=========================================');
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('=========================================');

  } finally {
    wsH.close();
    wsG.close();
    chrome.kill();
    edge.kill();
  }
}

testSetupPhase().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
