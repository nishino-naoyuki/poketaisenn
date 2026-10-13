/* 【エントリ】初期化・イベント登録・アクション定義 */

// =============================================================================
// 初期化 ＆ ロビー処理
// =============================================================================
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  initLobbyDefaults();
});

function initLobbyDefaults() {
  document.getElementById("in-name").value = "プレイヤーA";
  document.getElementById("in-deck").value = "DEMO-CHARIZARD-2026";
  // デッキ初期プレビュー
  state.myLoadedDeck = SAMPLE_DECK;
  state.soloDeckA = SAMPLE_DECK;
  state.soloDeckB = SAMPLE_DECK_B;
  renderDeckPreview(SAMPLE_DECK, "deck-preview");
  renderDeckPreview(SAMPLE_DECK, "deck-preview-a");
  renderDeckPreview(SAMPLE_DECK_B, "deck-preview-b");
  
  const btnStart = document.getElementById("btn-start");
  if (btnStart) {
    btnStart.disabled = true;
    btnStart.textContent = "相手の接続待ち...";
    btnStart.classList.remove("green");
    btnStart.classList.add("gold");
  }

  // プレイマット初期化＆描画
  initPlaymats();

  if (location.hash.includes("solo")) {
    switchLobbyMode("solo");
    startSoloBattleSetup();
  } else if (location.hash.includes("battle")) {
    startBattleSetup();
    if (location.hash.includes("test-play")) {
      state.selectedHandIndex = 0;
      moveSelectedHandToPlayArea();
    } else if (location.hash.includes("test-zoom")) {
      openCardZoom(state.myActive.card);
    } else if (location.hash.includes("test-deck")) {
      showDeckModal();
    }
  }
}

function setupEventListeners() {
  // data-action 属性によるイベント委任
  document.body.addEventListener("click", (e) => {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    const arg = target.dataset.arg;
    const shouldClose = target.dataset.close;

    if (shouldClose) {
      closeMenu();
    }

    if (typeof actions[action] === "function") {
      actions[action](arg, target);
    }
  });

  // モーダル背景クリックで閉じる
  document.getElementById("modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") closeModal();
  });

  // コンテキストメニュー外クリックで閉じる
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#ctx") && !e.target.closest(".card") && !e.target.closest("#my-prizes")) {
      hideCtx();
    }
  });

  // 手札カードの範囲ドラッグ選択を初期化
  initMarqueeSelection();

  // スマホ・タッチ操作用ドラッグ＆ドロップを初期化
  initTouchDragEngine();

  // CSVインポート用ファイル選択イベント
  const fileInput = document.getElementById("csv-file-input");
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        importMatchCsv(file);
      }
      fileInput.value = "";
    });
  }

  // プレイマット自作画像アップロードイベント
  const matFileInput = document.getElementById("mat-file-input");
  if (matFileInput) {
    matFileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        handleCustomPlaymatUpload(file);
      }
      matFileInput.value = "";
    });
  }

  // リプレイスライダー
  const replaySlider = document.getElementById("replay-slider");
  if (replaySlider) {
    replaySlider.addEventListener("input", (e) => {
      jumpToReplayStep(parseInt(e.target.value, 10));
    });
  }

  // ルーム番号入力欄でEnterキー押下時の参加
  const inRoom = document.getElementById("in-room");
  if (inRoom) {
    inRoom.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        actions.joinRoom();
      }
    });
  }

  // P2Pテストメッセージ入力欄でEnterキー押下時の送信
  const inTestMsg = document.getElementById("in-test-msg");
  if (inTestMsg) {
    inTestMsg.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        actions.sendTestMsg();
      }
    });
  }

  // デッキコード入力欄でEnterキー押下時の自動読込
  [
    { id: "in-deck", fn: () => actions.loadDeck() },
    { id: "in-deck-a", fn: () => actions.loadSoloDeckA() },
    { id: "in-deck-b", fn: () => actions.loadSoloDeckB() }
  ].forEach(item => {
    const el = document.getElementById(item.id);
    if (el) {
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          item.fn();
        }
      });
    }
  });
}

// =============================================================================
// アクション一覧 (data-action ハンドラー)
// =============================================================================
const actions = {
  // ロビー
  lobbyTab: (tab) => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelector(`[data-arg="${tab}"]`).classList.add("active");
    if (tab === "create") {
      document.getElementById("tab-create").classList.remove("hidden");
      document.getElementById("tab-join").classList.add("hidden");
    } else {
      document.getElementById("tab-create").classList.add("hidden");
      document.getElementById("tab-join").classList.remove("hidden");
    }
    const startBtn = document.getElementById("btn-start");
    if (startBtn && !P2P.connected) {
      startBtn.disabled = true;
      startBtn.textContent = "相手の接続待ち...";
      startBtn.classList.remove("green");
      startBtn.classList.add("gold");
    }
  },

  createRoom: () => {
    P2P.createRoom();
  },

  joinRoom: () => {
    const val = document.getElementById("in-room").value.trim();
    if (!val) {
      P2P._setState(P2P.STATES.CONNECTION_FAILED, "ルーム番号を入力してください");
      return;
    }
    P2P.join(val);
  },

  copyRoom: () => {
    if (!state.roomNo) return;
    navigator.clipboard.writeText(state.roomNo).then(() => {
      showToast("ルーム番号をコピーしました");
    });
  },

  sendTestMsg: () => {
    const input = document.getElementById("in-test-msg");
    const val = input ? input.value.trim() : "";
    if (P2P.sendTestMessage(val || "疎通確認テスト (Hello P2P!)")) {
      if (input) input.value = "";
    }
  },

  disconnectP2P: () => {
    P2P.disconnect();
  },

  refreshWebRTCStats: () => {
    P2P.updateWebRTCStatsUI();
  },

  loadDeck: () => {
    loadOnlineDeck();
  },

  startBattle: () => {
    // オンラインモードで相手と未接続の場合は開始を防止
    if (!P2P.connected && !state.isSoloMode) {
      alert("相手とまだ接続されていません。\nルームを作成するか入室して、接続完了（🟢）になってから対戦開始を押してください。\n※一人で練習したい場合は「一人回し」タブをご利用ください。");
      return;
    }

    const name = document.getElementById("in-name").value.trim() || "プレイヤーA";
    state.myName = name;
    startBattleSetup();
    if (P2P.connected) {
      if (typeof resetOpponentCards === "function") {
        resetOpponentCards();
      }
      // 通信対戦: 相手側へ対戦画面への遷移を通知（実デッキ・プレイマット情報を含む）
      const matSync = (typeof getMyPlaymatSyncData === "function")
        ? getMyPlaymatSyncData()
        : { matId: state.myMatId, matDataUrl: null };
      P2P.send({
        t: "start",
        name: state.myName,
        matId: matSync.matId,
        matDataUrl: matSync.matDataUrl,
        deck: state.myLoadedDeck || SAMPLE_DECK
      });
      renderAll();
      P2P.syncNow();
    }
  },

  exit: () => {
    if (confirm("対戦を終了してロビーに戻りますか？")) {
      if (typeof P2P !== "undefined" && P2P.connected) {
        try {
          P2P.send({
            t: "player_exit",
            playerName: state.myName
          });
        } catch (e) {}
        P2P.disconnect();
      }
      state.oppExited = false;
      document.getElementById("game").classList.add("hidden");
      document.getElementById("lobby").classList.remove("hidden");
    }
  },

  // スマホメニュー開閉
  openMenu: () => {
    document.body.classList.add("menu-open");
    updateSheetUI();
  },
  closeMenu: () => closeMenu(),

  // 山札アクション
  draw: () => drawCardToTemp(),
  viewDeck: () => showDeckModal(),
  trashTop: () => trashDeckTop(),
  shuffle: () => shuffleMyDeck(),

  // テンポラリアクション
  tempToHand: () => moveTempToHand(),
  tempToTop: () => moveTempToTop(),
  tempToBottom: () => moveTempToBottom(),
  tempToTrash: () => moveTempToTrash(),

  // 手札アクション
  handToDeck: () => moveSelectedHandToDeck(),
  handToBottom: () => moveSelectedHandToBottom(),
  handTrash: () => trashSelectedHand(),
  handLost: () => moveSelectedHandToLost(),
  handActive: () => placeSelectedHandToActive(),
  handBench: () => placeSelectedHandToBench(),
  handToPlayArea: () => moveSelectedHandToPlayArea(),

  // 使用カードエリア アクション
  playToTrash: () => movePlayCardToTrash(),
  playToHand: () => movePlayCardToHand(),
  playToDeckTop: () => movePlayCardToDeckTop(),
  playToDeckBottom: () => movePlayCardToDeckBottom(),
  playToStadium: () => movePlayCardToStadium(),
  playToLost: () => movePlayCardToLost(),

  // モード切替 & 一人回しアクション
  switchLobbyMode: (mode) => switchLobbyMode(mode),
  loadSoloDeckA: () => loadSoloDeckA(),
  loadSoloDeckB: () => loadSoloDeckB(),
  startSoloBattle: () => startSoloBattleSetup(),
  openDeckPasteModal: (target) => openDeckPasteModal(target || "online"),

  // 対戦準備フェーズ アクション
  setupCoinToss: () => startSetupCoinToss(),
  mulligan: () => executeMulligan(),
  setupReady: () => confirmSetupReady(),

  // その他
  endTurn: () => endTurn(),
  coin: () => tossCoin(),
  declareVictory: () => (typeof declareVictory === "function" ? declareVictory() : null),
  showLog: () => showLogModal(),
  cancelTarget: () => cancelTargetMode(),

  // プレイマット選択アクション
  openMatUpload: () => openMatUpload(),

  // CSVログ出力・試合再現（リプレイ）
  exportCsv: () => exportMatchCsv(),
  triggerCsvImport: () => {
    const input = document.getElementById("csv-file-input");
    if (input) input.click();
  },
  replayFirst: () => replayFirst(),
  replayPrev: () => replayPrev(),
  replayTogglePlay: () => replayTogglePlay(),
  replayNext: () => replayNext(),
  replayLast: () => replayLast(),
  exitReplay: () => exitReplayMode()
};

window.actions = actions;

function closeMenu() {
  document.body.classList.remove("menu-open");
}

// =============================================================================
// 対戦セットアップ
// =============================================================================

