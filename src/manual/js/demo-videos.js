/**
 * PokéCa Lab Arena - Manual Interactive Demo Video Player
 * 操作手順を視覚的に解説する短尺ループアニメーションプレイヤー
 */

document.addEventListener("DOMContentLoaded", () => {
  initDemoVideos();
});

function initDemoVideos() {
  const demos = document.querySelectorAll(".demo-video-box");
  demos.forEach(demo => {
    const demoId = demo.dataset.demoId;
    if (demoId && typeof demoScenarios[demoId] === "function") {
      runDemoLoop(demo, demoScenarios[demoId]);
    }
  });
}

async function runDemoLoop(container, scenarioFn) {
  while (true) {
    try {
      await scenarioFn(container);
      await new Promise(r => setTimeout(r, 2200)); // ループ間の待機
    } catch (e) {
      console.warn("Demo loop error:", e);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

function updateStepUI(container, stepIndex, stepText) {
  const dots = container.querySelectorAll(".demo-dot");
  dots.forEach((dot, idx) => {
    if (idx === stepIndex) dot.classList.add("active");
    else dot.classList.remove("active");
  });

  const numEl = container.querySelector(".demo-step-num");
  const textEl = container.querySelector(".demo-step-text");
  if (numEl) numEl.textContent = `STEP ${stepIndex + 1}`;
  if (textEl) textEl.textContent = stepText;
}

const demoScenarios = {
  // ① ターンの流れ一連操作
  "turn-flow": async (el) => {
    const stage = el.querySelector(".demo-stage");
    stage.innerHTML = `
      <div style="position:relative; width:100%; height:100%; display:flex; flex-direction:column; justify-content:space-between; padding:12px; box-sizing:border-box;">
        <!-- 相手エリア -->
        <div style="display:flex; justify-content:center; align-items:center; gap:20px;">
          <div id="df-opp-active" style="width:70px; height:95px; background:#1e293b; border:2px solid #ef4444; border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; font-size:11px; font-weight:bold; position:relative;">
            <span>リザードンex</span>
            <span style="font-size:9px; color:#94a3b8;">HP 330</span>
            <div id="df-damage-badge" style="display:none; position:absolute; top:-8px; right:-8px; background:#ef4444; color:#fff; font-size:11px; font-weight:bold; padding:2px 6px; border-radius:9999px; border:2px solid #fff;">-180</div>
          </div>
        </div>

        <!-- 中央カットイン/使用枠 -->
        <div id="df-center-area" style="text-align:center; height:34px; display:flex; align-items:center; justify-content:center;">
          <div id="df-play-slot" style="width:90px; height:32px; border:1.5px dashed #f59e0b; border-radius:6px; font-size:10px; color:#f59e0b; display:flex; align-items:center; justify-content:center;">カード使用枠</div>
          <div id="df-cutin" style="display:none; background:linear-gradient(135deg, #b91c1c, #d97706); color:#fff; font-size:13px; font-weight:900; padding:4px 16px; border-radius:20px; box-shadow:0 0 15px #f59e0b;">⚔️ ワザ宣言！『バーニングダーク』</div>
        </div>

        <!-- 自分エリア -->
        <div style="display:flex; justify-content:space-between; align-items:flex-end;">
          <!-- 山札 -->
          <div id="df-my-deck" style="width:50px; height:70px; background:#1d4ed8; border:2px solid #93c5fd; border-radius:5px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:10px; font-weight:bold;">山札</div>
          <!-- バトル場 ＆ 技宣言ボタン -->
          <div style="display:flex; align-items:center; gap:8px;">
            <div id="df-my-active" style="width:65px; height:90px; background:#0f172a; border:2px solid #38bdf8; border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; font-size:10px; font-weight:bold;">
              <span>ピジョットex</span>
              <span style="font-size:8px; color:#94a3b8;">HP 280</span>
            </div>
            <button id="df-btn-attack" style="background:#ef4444; color:#fff; font-size:11px; font-weight:bold; border:1px solid #fecaca; border-radius:20px; padding:4px 10px; cursor:pointer;">⚔️ 技宣言</button>
          </div>
          <!-- ターン終了ボタン -->
          <button id="df-btn-end" style="background:#f59e0b; color:#fff; font-size:11px; font-weight:bold; border:none; border-radius:6px; padding:6px 10px; box-shadow:0 2px 8px rgba(245,158,11,0.4);">ターン終了</button>
        </div>

        <!-- 手札 -->
        <div id="df-my-hand" style="display:flex; justify-content:center; gap:6px; margin-top:4px;">
          <div id="df-hand-c1" style="width:48px; height:65px; background:#ffffff; color:#0f172a; border:1px solid #cbd5e1; border-radius:4px; font-size:9px; font-weight:bold; padding:4px; box-sizing:border-box;">ボスの指令</div>
          <div id="df-hand-c2" style="width:48px; height:65px; background:#ffffff; color:#0f172a; border:1px solid #cbd5e1; border-radius:4px; font-size:9px; font-weight:bold; padding:4px; box-sizing:border-box;">ネスト</div>
        </div>

        <!-- 指カーソル -->
        <div id="df-cursor" class="demo-cursor" style="top:180px; left:40px;">👆</div>
      </div>
    `;

    const cursor = stage.querySelector("#df-cursor");
    const playSlot = stage.querySelector("#df-play-slot");
    const cutin = stage.querySelector("#df-cutin");
    const dmgBadge = stage.querySelector("#df-damage-badge");
    const card1 = stage.querySelector("#df-hand-c1");
    const btnAttack = stage.querySelector("#df-btn-attack");
    const btnEnd = stage.querySelector("#df-btn-end");
    const oppActive = stage.querySelector("#df-opp-active");

    // 1. ターン開始自動ドロー
    updateStepUI(el, 0, "ターン開始！山札からカードが1枚自動でドローされます（山札クリック不要）");
    cursor.style.top = "180px";
    cursor.style.left = "45px";
    await new Promise(r => setTimeout(r, 1400));

    // 2. カードを使う（使用枠へ移動）
    updateStepUI(el, 1, "手札のカードを中央の『手札使用枠』へ置いて使用（相手にもリアルタイム通知）");
    cursor.style.top = "200px";
    cursor.style.left = "42%";
    await new Promise(r => setTimeout(r, 800));
    // カード移動
    card1.style.transition = "all 0.6s ease";
    card1.style.transform = "translateY(-90px)";
    cursor.style.top = "110px";
    await new Promise(r => setTimeout(r, 1000));
    playSlot.innerHTML = `<span style="color:#fff; font-weight:bold;">ボスの指令 (使用中)</span>`;
    playSlot.style.background = "#2563eb";

    // 3. 技宣言 ＆ 相手ポケモンにダメカンを手動で載せる
    updateStepUI(el, 2, "『⚔️ 技宣言』を押してカットイン演出！相手ポケモンをクリックして手動でダメカンを載せます");
    cursor.style.top = "175px";
    cursor.style.left = "58%";
    await new Promise(r => setTimeout(r, 800));
    btnAttack.style.transform = "scale(1.15)";
    await new Promise(r => setTimeout(r, 300));
    btnAttack.style.transform = "scale(1)";

    // カットイン表示
    playSlot.style.display = "none";
    cutin.style.display = "inline-block";
    await new Promise(r => setTimeout(r, 1000));

    // 指が相手ポケモンへ移動してダメカンを載せる
    cursor.style.top = "30px";
    cursor.style.left = "52%";
    await new Promise(r => setTimeout(r, 800));
    oppActive.style.transform = "scale(1.1)";
    oppActive.style.boxShadow = "0 0 15px #ef4444";
    dmgBadge.style.display = "block";
    await new Promise(r => setTimeout(r, 500));
    oppActive.style.transform = "scale(1)";

    // 4. ターン終了ボタンを押す
    updateStepUI(el, 3, "右下の『ターン終了』ボタンを押して相手の手番へ交代します");
    cursor.style.top = "175px";
    cursor.style.left = "86%";
    await new Promise(r => setTimeout(r, 900));
    btnEnd.style.transform = "scale(1.15)";
    btnEnd.style.boxShadow = "0 0 15px #f59e0b";
    await new Promise(r => setTimeout(r, 500));
    btnEnd.style.transform = "scale(1)";
  },

  // ② 相手のカードを自分で操作する
  "opp-control": async (el) => {
    const stage = el.querySelector(".demo-stage");
    stage.innerHTML = `
      <div style="position:relative; width:100%; height:100%; padding:14px; box-sizing:border-box;">
        <div style="text-align:center; color:#93c5fd; font-size:11px; font-weight:bold; margin-bottom:10px;">相手陣地（相手に頼まず、自分で直接ドラッグ＆クリック操作！）</div>
        <div style="display:flex; justify-content:center; gap:20px; align-items:center; margin-top:20px;">
          <!-- 相手バトル場 -->
          <div id="oc-opp-active" style="width:75px; height:100px; background:#1e293b; border:2px dashed #94a3b8; border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#cbd5e1; font-size:11px;">
            <span>バトル場</span>
          </div>
          <!-- 相手ベンチ -->
          <div id="oc-opp-bench" style="width:75px; height:100px; background:#0f172a; border:2px solid #ef4444; border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; font-size:11px; font-weight:bold; position:relative; transition:all 0.6s ease;">
            <span>かがやくゲッコウガ</span>
            <div id="oc-poison-badge" style="display:none; position:absolute; bottom:4px; background:#9333ea; color:#fff; font-size:9px; padding:1px 5px; border-radius:9999px;">どく</div>
          </div>
        </div>
        <div id="oc-cursor" class="demo-cursor" style="top:120px; left:60%;">👆</div>
      </div>
    `;

    const cursor = stage.querySelector("#oc-cursor");
    const oppActive = stage.querySelector("#oc-opp-active");
    const oppBench = stage.querySelector("#oc-opp-bench");
    const poisonBadge = stage.querySelector("#oc-poison-badge");

    // Step 1: ボスの指令で相手ベンチを自分で引っ張り出す
    updateStepUI(el, 0, "ボスの指令を使った時：相手に依頼せず、自分で相手のベンチポケモンをバトル場へ直接ドラッグ！");
    cursor.style.top = "70px";
    cursor.style.left = "58%";
    await new Promise(r => setTimeout(r, 1000));

    // ドラッグ移動
    oppBench.style.transform = "translateX(-95px)";
    cursor.style.left = "42%";
    await new Promise(r => setTimeout(r, 1200));
    oppActive.style.border = "2px solid #ef4444";
    oppActive.style.background = "#1e293b";
    oppActive.innerHTML = `<span style="color:#fff; font-weight:bold;">かがやくゲッコウガ</span>`;
    oppBench.style.opacity = "0.2";

    // Step 2: 相手ポケモンに自分でダメカンや特殊状態を付与
    updateStepUI(el, 1, "相手のポケモンをクリックし、自分で直接ダメカン増減や『どく・やけど』などの特殊状態をつけられます");
    cursor.style.top = "70px";
    cursor.style.left = "42%";
    await new Promise(r => setTimeout(r, 800));
    oppActive.style.transform = "scale(1.15)";
    oppActive.style.boxShadow = "0 0 20px #9333ea";
    poisonBadge.style.display = "block";
    oppActive.appendChild(poisonBadge);
    await new Promise(r => setTimeout(r, 600));
    oppActive.style.transform = "scale(1)";
  },

  // ③ カードを使う（使用エリア同期＆自動トラッシュ）
  "play-card": async (el) => {
    const stage = el.querySelector(".demo-stage");
    stage.innerHTML = `
      <div style="position:relative; width:100%; height:100%; padding:14px; display:flex; flex-direction:column; justify-content:space-between; align-items:center;">
        <div id="pc-slot" style="width:130px; height:70px; border:2px dashed #38bdf8; border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#38bdf8; font-size:11px; font-weight:bold;">
          <span>手札使用枠</span>
          <span style="font-size:9px; color:#94a3b8;">(相手画面にも即時共有)</span>
        </div>
        <div id="pc-card" style="width:60px; height:80px; background:#ffffff; color:#0f172a; border:2px solid #3b82f6; border-radius:6px; font-size:10px; font-weight:bold; padding:6px; transition:all 0.7s ease;">
          ナンジャモ
        </div>
        <div id="pc-cursor" class="demo-cursor" style="bottom:30px; left:52%;">👆</div>
      </div>
    `;
    const cursor = stage.querySelector("#pc-cursor");
    const card = stage.querySelector("#pc-card");
    const slot = stage.querySelector("#pc-slot");

    updateStepUI(el, 0, "手札から『手札使用枠』へドラッグ＆ドロップ（または右クリック/長押しで『使用する』を選択）");
    await new Promise(r => setTimeout(r, 900));

    // 使用枠へドロップ
    card.style.transform = "translateY(-85px)";
    cursor.style.top = "50px";
    await new Promise(r => setTimeout(r, 900));

    updateStepUI(el, 1, "枠内に大きく表示され相手画面にも通知！5秒後に自動でトラッシュへ飛び立ちます♪");
    slot.style.background = "rgba(56, 189, 248, 0.2)";
    slot.style.border = "2px solid #38bdf8";
    await new Promise(r => setTimeout(r, 1200));

    // 自動トラッシュアニメ
    card.style.transform = "translate(120px, -85px) scale(0.3) rotate(360deg)";
    card.style.opacity = "0";
    await new Promise(r => setTimeout(r, 600));
  },

  // ④ ポケモンを進化させる
  "evolve": async (el) => {
    const stage = el.querySelector(".demo-stage");
    stage.innerHTML = `
      <div style="position:relative; width:100%; height:100%; padding:14px; display:flex; flex-direction:column; justify-content:space-between; align-items:center;">
        <div id="ev-base" style="width:75px; height:100px; background:#1e293b; border:2px solid #38bdf8; border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; font-size:11px; font-weight:bold;">
          <span>ヒトカゲ</span>
          <span style="font-size:9px; color:#94a3b8;">HP 70</span>
        </div>
        <div id="ev-card" style="width:70px; height:90px; background:#ffffff; color:#0f172a; border:2px solid #ef4444; border-radius:6px; font-size:11px; font-weight:bold; padding:6px; transition:all 0.7s ease;">
          リザード
        </div>
        <div id="ev-cursor" class="demo-cursor" style="bottom:30px; left:52%;">👆</div>
      </div>
    `;
    const cursor = stage.querySelector("#ev-cursor");
    const card = stage.querySelector("#ev-card");
    const base = stage.querySelector("#ev-base");

    updateStepUI(el, 0, "手札にある進化ポケモンを、場にいる進化元のポケモンに直接重ねてドロップします");
    await new Promise(r => setTimeout(r, 1000));

    card.style.transform = "translateY(-110px)";
    cursor.style.top = "60px";
    await new Promise(r => setTimeout(r, 1000));

    updateStepUI(el, 1, "進化完了！進化元のカードは下敷きとして保持され、退化した際にも復元できます");
    base.innerHTML = `<span style="color:#ef4444;">リザード</span><span style="font-size:9px; color:#94a3b8;">HP 100 (進化1)</span>`;
    base.style.boxShadow = "0 0 20px #ef4444";
    card.style.opacity = "0";
    await new Promise(r => setTimeout(r, 1200));
  },

  // ⑤ エネルギー・どうぐをつける
  "attach": async (el) => {
    const stage = el.querySelector(".demo-stage");
    stage.innerHTML = `
      <div style="position:relative; width:100%; height:100%; padding:14px; display:flex; flex-direction:column; justify-content:space-between; align-items:center;">
        <div id="at-target" style="width:80px; height:105px; background:#1e293b; border:2px solid #38bdf8; border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; font-size:11px; font-weight:bold; position:relative;">
          <span>ミライドンex</span>
          <div id="at-badge" style="display:none; position:absolute; bottom:6px; background:#eab308; color:#0f172a; font-size:10px; font-weight:bold; padding:2px 8px; border-radius:9999px;">⚡ 2個</div>
        </div>
        <div id="at-ene" style="width:60px; height:75px; background:#fef08a; color:#854d0e; border:2px solid #ca8a04; border-radius:6px; font-size:10px; font-weight:bold; padding:4px; transition:all 0.7s ease;">
          ⚡ 基本雷エネ
        </div>
        <div id="at-cursor" class="demo-cursor" style="bottom:30px; left:52%;">👆</div>
      </div>
    `;
    const cursor = stage.querySelector("#at-cursor");
    const ene = stage.querySelector("#at-ene");
    const target = stage.querySelector("#at-target");
    const badge = stage.querySelector("#at-badge");

    updateStepUI(el, 0, "手札のエネルギーや『ポケモンのどうぐ』を、つけたいポケモンへドラッグ＆ドロップ！");
    await new Promise(r => setTimeout(r, 900));

    ene.style.transform = "translateY(-110px)";
    cursor.style.top = "60px";
    await new Promise(r => setTimeout(r, 900));

    updateStepUI(el, 1, "装着完了！ポケモンの下にエネルギーバッジが増加し、何枚ついているか一目で分かります");
    target.style.boxShadow = "0 0 20px #eab308";
    badge.style.display = "block";
    ene.style.opacity = "0";
    await new Promise(r => setTimeout(r, 1200));
  },

  // ⑥ 手札の山札戻し＆トラッシュ（未選択時全戻し確認）
  "hand-confirm": async (el) => {
    const stage = el.querySelector(".demo-stage");
    stage.innerHTML = `
      <div style="position:relative; width:100%; height:100%; padding:14px; display:flex; flex-direction:column; justify-content:center; align-items:center;">
        <button id="hc-btn" style="background:#2563eb; color:#fff; font-size:12px; font-weight:bold; border:none; border-radius:6px; padding:8px 16px;">手札を山に戻す</button>
        <div id="hc-dialog" style="display:none; margin-top:14px; background:#ffffff; color:#0f172a; border:2px solid #ef4444; border-radius:8px; padding:10px 16px; font-size:11px; text-align:center; box-shadow:0 4px 16px rgba(0,0,0,0.5);">
          <b>手札が選択されていません</b><br>
          手札全7枚を山札に戻してシャッフルしますか？
        </div>
        <div id="hc-cursor" class="demo-cursor" style="top:70px; left:48%;">👆</div>
      </div>
    `;
    const cursor = stage.querySelector("#hc-cursor");
    const btn = stage.querySelector("#hc-btn");
    const dialog = stage.querySelector("#hc-dialog");

    updateStepUI(el, 0, "選択時：カードを選んでボタンを押すと選んだカードのみ移動。未選択時は？");
    await new Promise(r => setTimeout(r, 1000));

    cursor.style.top = "80px";
    await new Promise(r => setTimeout(r, 400));
    btn.style.transform = "scale(1.1)";
    await new Promise(r => setTimeout(r, 300));
    btn.style.transform = "scale(1)";

    updateStepUI(el, 1, "未選択時は『全戻し／全トラッシュしますか？』と親切に確認ダイアログが表示される安心設計！");
    dialog.style.display = "block";
    await new Promise(r => setTimeout(r, 1600));
  },

  // ⑦ 相手ポケモンを気絶させる
  "faint": async (el) => {
    const stage = el.querySelector(".demo-stage");
    stage.innerHTML = `
      <div style="position:relative; width:100%; height:100%; padding:14px; display:flex; flex-direction:column; justify-content:center; align-items:center;">
        <div id="fa-pokemon" style="width:80px; height:105px; background:#1e293b; border:2px solid #ef4444; border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; font-size:11px; font-weight:bold;">
          <span>ビーダル</span>
          <span style="font-size:9px; color:#ef4444;">HP 0 (気絶)</span>
        </div>
        <div id="fa-modal" style="display:none; position:absolute; inset:10px; background:#0f172a; border:2px solid #f59e0b; border-radius:12px; padding:12px; text-align:center; box-shadow:0 0 25px rgba(245,158,11,0.5);">
          <div style="font-size:12px; font-weight:bold; color:#f59e0b; margin-bottom:8px;">🏆 サイドカード取得（クリックでめくる）</div>
          <div style="display:flex; justify-content:center; gap:6px;">
            <div style="width:36px; height:50px; background:#1d4ed8; border:1px solid #fff; border-radius:4px; font-size:8px; display:flex; align-items:center; justify-content:center; color:#fff;">サイド1</div>
            <div style="width:36px; height:50px; background:#fef08a; border:2px solid #eab308; border-radius:4px; font-size:8px; display:flex; align-items:center; justify-content:center; color:#854d0e; font-weight:bold;">炎エネ</div>
          </div>
        </div>
        <div id="fa-cursor" class="demo-cursor" style="top:90px; left:52%;">👆</div>
      </div>
    `;
    const cursor = stage.querySelector("#fa-cursor");
    const pokemon = stage.querySelector("#fa-pokemon");
    const modal = stage.querySelector("#fa-modal");

    updateStepUI(el, 0, "HPが0になったポケモンをクリックし、メニューから『気絶させる』を選択！");
    await new Promise(r => setTimeout(r, 1000));
    pokemon.style.transform = "scale(1.15)";
    await new Promise(r => setTimeout(r, 400));
    pokemon.style.transform = "scale(0.8) rotate(20deg)";
    pokemon.style.opacity = "0.4";

    updateStepUI(el, 1, "サイド取得画面が自動起動！3Dカードをめくって手札に加えます（相手画面にも同期）");
    modal.style.display = "block";
    cursor.style.top = "60px";
    cursor.style.left = "54%";
    await new Promise(r => setTimeout(r, 1600));
  },

  // ⑧ トラッシュからの回収・装着
  "trash-recovery": async (el) => {
    const stage = el.querySelector(".demo-stage");
    stage.innerHTML = `
      <div style="position:relative; width:100%; height:100%; padding:14px; display:flex; flex-direction:column; justify-content:center; align-items:center;">
        <div id="tr-list" style="width:90%; background:#1e293b; border:1.5px solid #38bdf8; border-radius:8px; padding:8px; display:flex; flex-direction:column; gap:6px;">
          <div style="font-size:11px; font-weight:bold; color:#38bdf8; border-bottom:1px solid #334155; padding-bottom:4px;">🗑️ トラッシュ一覧（カードを選択）</div>
          <div style="display:flex; gap:8px;">
            <div style="width:45px; height:60px; background:#ffffff; color:#0f172a; border:2px solid #22c55e; border-radius:4px; font-size:9px; font-weight:bold; padding:2px;">すごいつりざお</div>
            <div style="width:45px; height:60px; background:#fef08a; color:#854d0e; border:1px solid #ca8a04; border-radius:4px; font-size:9px; font-weight:bold; padding:2px;">基本炎エネ</div>
          </div>
          <div style="display:flex; gap:6px; margin-top:4px;">
            <button style="background:#22c55e; color:#fff; font-size:10px; font-weight:bold; border:none; border-radius:4px; padding:3px 8px;">手札に戻す</button>
            <button style="background:#3b82f6; color:#fff; font-size:10px; font-weight:bold; border:none; border-radius:4px; padding:3px 8px;">山に戻す</button>
          </div>
        </div>
        <div id="tr-cursor" class="demo-cursor" style="top:110px; left:40%;">👆</div>
      </div>
    `;
    const cursor = stage.querySelector("#tr-cursor");

    updateStepUI(el, 0, "トラッシュ枠をクリックして一覧を開き、対象のカードにチェックを入れます");
    await new Promise(r => setTimeout(r, 1200));

    updateStepUI(el, 1, "下部のアクションバーから『手札に戻す』や『場のポケモンにつける』を押すだけで即回収！");
    cursor.style.top = "140px";
    cursor.style.left = "32%";
    await new Promise(r => setTimeout(r, 1500));
  },

  // ⑨ スマホでの操作
  "sp-touch": async (el) => {
    const stage = el.querySelector(".demo-stage");
    stage.innerHTML = `
      <div style="position:relative; width:100%; height:100%; padding:14px; display:flex; flex-direction:column; justify-content:space-between; align-items:center;">
        <div style="width:80%; height:60px; background:#1e293b; border:1.5px solid #64748b; border-radius:6px; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:11px;">
          スマホ画面（縦向き・片手操作）
        </div>
        <div id="sp-card" style="width:55px; height:75px; background:#ffffff; color:#0f172a; border:2px solid #3b82f6; border-radius:6px; font-size:10px; font-weight:bold; padding:4px;">
          ネストボール
        </div>
        <div id="sp-sheet" style="display:none; position:absolute; bottom:0; left:0; right:0; background:#ffffff; color:#0f172a; border-radius:14px 14px 0 0; padding:12px; box-shadow:0 -4px 20px rgba(0,0,0,0.5);">
          <div style="font-size:11px; font-weight:bold; color:#1d4ed8; margin-bottom:6px;">📱 操作メニュー（450ms長押し）</div>
          <div style="display:flex; gap:6px;">
            <button style="background:#22c55e; color:#fff; font-size:10px; padding:4px 8px; border:none; border-radius:4px;">使用する</button>
            <button style="background:#3b82f6; color:#fff; font-size:10px; padding:4px 8px; border:none; border-radius:4px;">山に戻す</button>
          </div>
        </div>
        <div id="sp-cursor" class="demo-cursor" style="bottom:40px; left:52%;">👆</div>
      </div>
    `;
    const cursor = stage.querySelector("#sp-cursor");
    const card = stage.querySelector("#sp-card");
    const sheet = stage.querySelector("#sp-sheet");

    updateStepUI(el, 0, "手札のカードを450ms長押し（またはタップ）すると、ブルッと振動して操作メニューが開きます");
    await new Promise(r => setTimeout(r, 1200));

    card.style.transform = "scale(1.15)";
    card.style.boxShadow = "0 0 15px #3b82f6";
    await new Promise(r => setTimeout(r, 500));
    sheet.style.display = "block";
    cursor.style.bottom = "20px";

    updateStepUI(el, 1, "画面下にせり上がるメニューから、タップひとつで『使用』や『山札戻し』が行えます");
    await new Promise(r => setTimeout(r, 1600));
  }
};
