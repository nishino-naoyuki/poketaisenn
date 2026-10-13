const { spawn } = require('child_process');

async function testAllActivePlacements() {
  console.log('=== [バトル場へのポケモン配置 全パターン検証テスト開始] ===');

  const os = require('os');
  const path = require('path');
  const tempProfile = path.join(os.tmpdir(), 'chrome_test_' + Date.now());
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless',
    '--remote-debugging-port=9522',
    '--user-data-dir=' + tempProfile,
    'file:///' + __dirname.replace(/\\/g, '/') + '/src/index.html'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const res = await fetch('http://127.0.0.1:9522/json/list');
  const target = (await res.json()).find(t => t.url.includes('src/index.html'));
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));

  ws.addEventListener('message', e => {
    const d = JSON.parse(e.data);
    if (d.method === 'Runtime.consoleAPICalled') {
      console.log('BROWSER LOG:', d.params.type, d.params.args?.map(a => a.value || a.description).join(' '));
    }
    if (d.method === 'Runtime.exceptionThrown') {
      console.log('BROWSER EXCEPTION:', JSON.stringify(d.params.exceptionDetails));
    }
  });

  function ev(expr) {
    return new Promise(resolve => {
      const id = Math.floor(Math.random() * 100000);
      const onMsg = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === id) {
          ws.removeEventListener('message', onMsg);
          if (d.result?.exceptionDetails) {
            console.error('EVAL EXCEPTION in expr [' + expr + ']:', JSON.stringify(d.result.exceptionDetails));
          }
          resolve(d.result?.result?.value);
        }
      };
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
    });
  }

  try {
    // 1. 一人回し開始
    console.log('1. Starting solo battle...');
    await ev('actions.startSoloBattle()');
    await new Promise(r => setTimeout(r, 600));

    // ボタンの存在確認
    const hasHandActiveBtn = await ev('document.querySelector(".hand-btns [data-action=\'handActive\']") !== null');
    const handActiveBtnText = await ev('document.querySelector(".hand-btns [data-action=\'handActive\']")?.textContent.trim()');
    console.log(`   handActive button exists: ${hasHandActiveBtn} ("${handActiveBtnText}")`);
    if (!hasHandActiveBtn) throw new Error("手札ボタンバーに「バトル場に出す」ボタンがありません");

    async function ensurePokemonInHand() {
      await ev(`
        if (!state.myHand.some(c => c && c.type === "pokemon")) {
          const pIdx = state.myDeck.findIndex(c => c && c.type === "pokemon");
          if (pIdx !== -1) {
            state.myHand.push(state.myDeck.splice(pIdx, 1)[0]);
            renderHand();
          }
        }
      `);
    }

    // -------------------------------------------------------------------------
    // 検証パターン 1: 手札ボタン「⚔️ バトル場に出す」をクリックして配置
    // -------------------------------------------------------------------------
    console.log('\n2. Pattern 1: Select hand card and click "⚔️ バトル場に出す" toolbar button...');
    await ensurePokemonInHand();
    const pokeIdx1 = await ev('state.myHand.findIndex(c => c.type === "pokemon")');
    const pokeCard1 = await ev(`state.myHand[${pokeIdx1}].name`);
    console.log(`   Selecting pokemon card at idx ${pokeIdx1}: ${pokeCard1}`);
    await ev(`selectHandCard(${pokeIdx1})`);
    
    // handActive ボタンをクリック
    await ev('actions.handActive()');
    await new Promise(r => setTimeout(r, 300));

    const activeCard1 = await ev('state.myActive?.card?.name');
    console.log(`   myActive after clicking handActive: ${activeCard1}`);
    if (activeCard1 !== pokeCard1) throw new Error(`Pattern 1 FAILED: expected ${pokeCard1}, got ${activeCard1}`);
    console.log('   ✅ Pattern 1 PASS!');

    // -------------------------------------------------------------------------
    // 検証パターン 2: 空のバトル場（#my-active）をクリックして配置
    // -------------------------------------------------------------------------
    console.log('\n3. Pattern 2: Select hand card and click empty #my-active spot...');
    // リセット
    await ev('state.myActive = null; renderAll();');
    await ensurePokemonInHand();
    const pokeIdx2 = await ev('state.myHand.findIndex(c => c.type === "pokemon")');
    const pokeCard2 = await ev(`state.myHand[${pokeIdx2}].name`);
    console.log(`   Selecting pokemon card at idx ${pokeIdx2}: ${pokeCard2}`);
    await ev(`selectHandCard(${pokeIdx2})`);
    
    // #my-active をクリック
    await ev('document.getElementById("my-active").click()');
    await new Promise(r => setTimeout(r, 300));

    const activeCard2 = await ev('state.myActive?.card?.name');
    console.log(`   myActive after clicking #my-active: ${activeCard2}`);
    if (activeCard2 !== pokeCard2) throw new Error(`Pattern 2 FAILED: expected ${pokeCard2}, got ${activeCard2}`);
    console.log('   ✅ Pattern 2 PASS!');

    // -------------------------------------------------------------------------
    // 検証パターン 3: 複数カード選択状態で #my-active をクリックして配置
    // -------------------------------------------------------------------------
    console.log('\n4. Pattern 3: Multi-card selection in hand -> click #my-active spot...');
    await ev('state.myActive = null; renderAll();');
    await ensurePokemonInHand();
    // 手札から2枚選択
    const selDebug = await ev('(() => { clearHandSelection(); toggleSelectHandCard(0); toggleSelectHandCard(1); return { indices: Array.from(state.selectedHandIndices), handLen: state.myHand.length }; })()');
    console.log(`   Multi-selection debug:`, selDebug);
    const multiSelCount = selDebug ? selDebug.indices.length : 0;
    console.log(`   Multi-selected cards count: ${multiSelCount}`);
    
    // #my-active をクリック
    await ev('document.getElementById("my-active").click()');
    await new Promise(r => setTimeout(r, 300));

    const activeCard3 = await ev('state.myActive?.card?.name');
    console.log(`   myActive after multi-select click: ${activeCard3}`);
    if (!activeCard3) throw new Error("Pattern 3 FAILED: Pokémon should be placed even with multiple cards selected");
    console.log('   ✅ Pattern 3 PASS!');

    // -------------------------------------------------------------------------
    // 検証パターン 4: HTML5 ドラッグ＆ドロップ（未選択カードを直接ドラッグしてドロップ）
    // -------------------------------------------------------------------------
    console.log('\n5. Pattern 4: HTML5 native Drag & Drop unselected hand card into #my-active...');
    await ev('state.myActive = null; clearHandSelection(); renderAll();');
    await ensurePokemonInHand();
    const pokeIdx4 = await ev('state.myHand.findIndex(c => c.type === "pokemon")');
    const pokeCard4 = await ev(`state.myHand[${pokeIdx4}].name`);
    console.log(`   Dragging unselected card idx ${pokeIdx4}: ${pokeCard4}`);

    const dndResult = await ev(`(() => {
      const cardEl = document.querySelectorAll("#hand .card")[${pokeIdx4}];
      const dt = new DataTransfer();
      const dragStartEvt = new DragEvent("dragstart", { dataTransfer: dt, bubbles: true });
      cardEl.dispatchEvent(dragStartEvt);
      
      const activeEl = document.getElementById("my-active");
      const dropEvt = new DragEvent("drop", { dataTransfer: dt, bubbles: true });
      activeEl.dispatchEvent(dropEvt);

      return state.myActive ? state.myActive.card.name : null;
    })()`);
    console.log(`   myActive after HTML5 DnD: ${dndResult}`);
    if (dndResult !== pokeCard4) throw new Error(`Pattern 4 FAILED: expected ${pokeCard4}, got ${dndResult}`);
    console.log('   ✅ Pattern 4 PASS!');

    // -------------------------------------------------------------------------
    // 検証パターン 5: ベンチにいるポケモンを空のバトル場へ出す
    // -------------------------------------------------------------------------
    console.log('\n6. Pattern 5: Bench Pokemon promoted to empty battle spot via menu...');
    await ev('state.myActive = null; renderAll();');
    await ensurePokemonInHand();
    // 手札からベンチへ配置
    const pokeIdx5 = await ev('state.myHand.findIndex(c => c.type === "pokemon")');
    const pokeCard5 = await ev(`state.myHand[${pokeIdx5}].name`);
    await ev(`placeHandCardToBenchIndex(${pokeIdx5}, 0)`);
    console.log(`   Placed on bench 0: ${pokeCard5}, myActive is null`);

    // ベンチのカード要素をクリックしてコンテキストメニューを表示
    await ev('showPokemonMenu(new MouseEvent("click"), "bench", 0)');
    const benchMenuBtnText = await ev('document.querySelector("#ctx button.ctx-span-2")?.textContent.trim()');
    console.log(`   Bench context menu button text: "${benchMenuBtnText}"`);
    if (!benchMenuBtnText.includes("バトル場に出す")) {
      throw new Error(`Expected button text to contain "バトル場に出す", got "${benchMenuBtnText}"`);
    }

    // ボタンをクリック
    await ev('swapActiveBench(0)');
    await new Promise(r => setTimeout(r, 300));
    const activeCard5 = await ev('state.myActive?.card?.name');
    console.log(`   myActive after bench promotion: ${activeCard5}`);
    if (activeCard5 !== pokeCard5) throw new Error(`Pattern 5 FAILED: expected ${pokeCard5}, got ${activeCard5}`);
    console.log('   ✅ Pattern 5 PASS!');

    console.log('\n======================================================');
    console.log('🎉 バトル場への配置 全5パターン 全て合格しました！ (100% PASS) 🎉');
    console.log('======================================================');

  } finally {
    ws.close();
    chrome.kill();
  }
}

testAllActivePlacements().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
