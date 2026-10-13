/**
 * ポケカ オンライン対戦ツール デモ JavaScript
 * - ルール判定を行わない手動操作型シミュレーター
 * - デモ版: 1人プレイで全UI/アクションを検証可能
 */

// =============================================================================
// サンプルデッキデータ (60枚)
// =============================================================================
const SAMPLE_DECK = [
  // ポケモン (14枚)
  { name: "ヒトカゲ", type: "pokemon", color: "fire", hp: 70, category: "たね" },
  { name: "ヒトカゲ", type: "pokemon", color: "fire", hp: 70, category: "たね" },
  { name: "ヒトカゲ", type: "pokemon", color: "fire", hp: 70, category: "たね" },
  { name: "リザード", type: "pokemon", color: "fire", hp: 90, category: "1進化" },
  { name: "リザード", type: "pokemon", color: "fire", hp: 90, category: "1進化" },
  { name: "リザードンex", type: "pokemon", color: "fire", hp: 330, category: "2進化" },
  { name: "リザードンex", type: "pokemon", color: "fire", hp: 330, category: "2進化" },
  { name: "ピィ", type: "pokemon", color: "pokemon", hp: 30, category: "たね" },
  { name: "ポッポ", type: "pokemon", color: "pokemon", hp: 60, category: "たね" },
  { name: "ポッポ", type: "pokemon", color: "pokemon", hp: 60, category: "たね" },
  { name: "ピジョットex", type: "pokemon", color: "pokemon", hp: 280, category: "2進化" },
  { name: "ピジョットex", type: "pokemon", color: "pokemon", hp: 280, category: "2進化" },
  { name: "ロトムV", type: "pokemon", color: "pokemon", hp: 190, category: "たね" },
  { name: "かがやくリザードン", type: "pokemon", color: "fire", hp: 160, category: "たね" },

  // グッズ・ポケモンのどうぐ (22枚)
  { name: "バトルVIPパス", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "バトルVIPパス", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "バトルVIPパス", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "バトルVIPパス", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ハイパーボール", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ハイパーボール", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ハイパーボール", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ハイパーボール", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ネストボール", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ネストボール", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ふしぎなアメ", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ふしぎなアメ", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ふしぎなアメ", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "すごいつりざお", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "すごいつりざお", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ともだちてちょう", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ロストスイーパー", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "まけん気ハチマキ", type: "trainer", color: "trainer", sub: "ポケモンのどうぐ" },
  { name: "森の封印石", type: "trainer", color: "trainer", sub: "ポケモンのどうぐ" },
  { name: "ポケギア3.0", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ポケギア3.0", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "大地の器", type: "trainer", color: "trainer", sub: "グッズ" },

  // サポート (11枚)
  { name: "ナンジャモ", type: "trainer", color: "trainer", sub: "サポート" },
  { name: "ナンジャモ", type: "trainer", color: "trainer", sub: "サポート" },
  { name: "ナンジャモ", type: "trainer", color: "trainer", sub: "サポート" },
  { name: "ボスの指令", type: "trainer", color: "trainer", sub: "サポート" },
  { name: "ボスの指令", type: "trainer", color: "trainer", sub: "サポート" },
  { name: "ボスの指令", type: "trainer", color: "trainer", sub: "サポート" },
  { name: "ペパー", type: "trainer", color: "trainer", sub: "サポート" },
  { name: "ペパー", type: "trainer", color: "trainer", sub: "サポート" },
  { name: "ペパー", type: "trainer", color: "trainer", sub: "サポート" },
  { name: "博士の研究", type: "trainer", color: "trainer", sub: "サポート" },
  { name: "ジニア", type: "trainer", color: "trainer", sub: "サポート" },

  // スタジアム (3枚)
  { name: "ボウルタウン", type: "stadium", color: "trainer", sub: "スタジアム" },
  { name: "ボウルタウン", type: "stadium", color: "trainer", sub: "スタジアム" },
  { name: "崩れたスタジアム", type: "stadium", color: "trainer", sub: "スタジアム" },

  // エネルギー (10枚)
  { name: "基本炎エネルギー", type: "energy", color: "fire", sub: "エネルギー" },
  { name: "基本炎エネルギー", type: "energy", color: "fire", sub: "エネルギー" },
  { name: "基本炎エネルギー", type: "energy", color: "fire", sub: "エネルギー" },
  { name: "基本炎エネルギー", type: "energy", color: "fire", sub: "エネルギー" },
  { name: "基本炎エネルギー", type: "energy", color: "fire", sub: "エネルギー" },
  { name: "基本炎エネルギー", type: "energy", color: "fire", sub: "エネルギー" },
  { name: "基本炎エネルギー", type: "energy", color: "fire", sub: "エネルギー" },
  { name: "基本炎エネルギー", type: "energy", color: "fire", sub: "エネルギー" },
  { name: "ジェットエネルギー", type: "energy", color: "pokemon", sub: "特殊エネルギー" },
  { name: "ジェットエネルギー", type: "energy", color: "pokemon", sub: "特殊エネルギー" }
];

// 相手用・一人回し用のデッキデータ B (フシギバナexデッキ 60枚)
const SAMPLE_DECK_B = [
  // ポケモン (14枚)
  { name: "フシギダネ", type: "pokemon", color: "grass", hp: 70, category: "たね" },
  { name: "フシギダネ", type: "pokemon", color: "grass", hp: 70, category: "たね" },
  { name: "フシギダネ", type: "pokemon", color: "grass", hp: 70, category: "たね" },
  { name: "フシギソウ", type: "pokemon", color: "grass", hp: 100, category: "1進化" },
  { name: "フシギソウ", type: "pokemon", color: "grass", hp: 100, category: "1進化" },
  { name: "フシギバナex", type: "pokemon", color: "grass", hp: 340, category: "2進化" },
  { name: "フシギバナex", type: "pokemon", color: "grass", hp: 340, category: "2進化" },
  { name: "かがやくゲッコウガ", type: "pokemon", color: "water", hp: 130, category: "たね" },
  { name: "マナフィ", type: "pokemon", color: "water", hp: 70, category: "たね" },
  { name: "ビッパ", type: "pokemon", color: "pokemon", hp: 70, category: "たね" },
  { name: "ビッパ", type: "pokemon", color: "pokemon", hp: 70, category: "たね" },
  { name: "ビーダル", type: "pokemon", color: "pokemon", hp: 120, category: "1進化" },
  { name: "ビーダル", type: "pokemon", color: "pokemon", hp: 120, category: "1進化" },
  { name: "ロトムV", type: "pokemon", color: "pokemon", hp: 190, category: "たね" },

  // グッズ・ポケモンのどうぐ (22枚)
  { name: "ネストボール", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ネストボール", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ネストボール", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ネストボール", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ハイパーボール", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ハイパーボール", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ハイパーボール", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ハイパーボール", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ふしぎなアメ", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ふしぎなアメ", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ふしぎなアメ", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "大地の器", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "大地の器", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "すごいつりざお", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "すごいつりざお", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ポケモンいれかえ", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ポケモンいれかえ", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "勇気のおまもり", type: "trainer", color: "trainer", sub: "ポケモンのどうぐ" },
  { name: "勇気のおまもり", type: "trainer", color: "trainer", sub: "ポケモンのどうぐ" },
  { name: "森の封印石", type: "trainer", color: "trainer", sub: "ポケモンのどうぐ" },
  { name: "カウンターキャッチャー", type: "trainer", color: "trainer", sub: "グッズ" },
  { name: "ともだちてちょう", type: "trainer", color: "trainer", sub: "グッズ" },

  // サポート (11枚)
  { name: "博士の研究", type: "trainer", color: "trainer", sub: "サポート" },
  { name: "博士の研究", type: "trainer", color: "trainer", sub: "サポート" },
  { name: "博士の研究", type: "trainer", color: "trainer", sub: "サポート" },
  { name: "ナンジャモ", type: "trainer", color: "trainer", sub: "サポート" },
  { name: "ナンジャモ", type: "trainer", color: "trainer", sub: "サポート" },
  { name: "ナンジャモ", type: "trainer", color: "trainer", sub: "サポート" },
  { name: "ボスの指令", type: "trainer", color: "trainer", sub: "サポート" },
  { name: "ボスの指令", type: "trainer", color: "trainer", sub: "サポート" },
  { name: "ペパー", type: "trainer", color: "trainer", sub: "サポート" },
  { name: "ペパー", type: "trainer", color: "trainer", sub: "サポート" },
  { name: "フトゥー博士のシナリオ", type: "trainer", color: "trainer", sub: "サポート" },

  // スタジアム (3枚)
  { name: "ボウルタウン", type: "stadium", color: "trainer", sub: "スタジアム" },
  { name: "ボウルタウン", type: "stadium", color: "trainer", sub: "スタジアム" },
  { name: "エイチ湖", type: "stadium", color: "trainer", sub: "スタジアム" },

  // エネルギー (10枚)
  { name: "基本草エネルギー", type: "energy", color: "grass", sub: "エネルギー" },
  { name: "基本草エネルギー", type: "energy", color: "grass", sub: "エネルギー" },
  { name: "基本草エネルギー", type: "energy", color: "grass", sub: "エネルギー" },
  { name: "基本草エネルギー", type: "energy", color: "grass", sub: "エネルギー" },
  { name: "基本草エネルギー", type: "energy", color: "grass", sub: "エネルギー" },
  { name: "基本草エネルギー", type: "energy", color: "grass", sub: "エネルギー" },
  { name: "基本草エネルギー", type: "energy", color: "grass", sub: "エネルギー" },
  { name: "基本草エネルギー", type: "energy", color: "grass", sub: "エネルギー" },
  { name: "基本水エネルギー", type: "energy", color: "water", sub: "エネルギー" },
  { name: "基本水エネルギー", type: "energy", color: "water", sub: "エネルギー" }
];

const OPPONENT_DECK = SAMPLE_DECK_B;

// 全カード逆引きレジストリ（ダブルクリック拡大用）
const cardRegistry = new Map();

function registerCard(card) {
  if (!card) return null;
  if (!card.uid) {
    card.uid = "c_" + Math.random().toString(36).substring(2, 9);
  }
  cardRegistry.set(card.uid, card);
  return card;
}

// エネルギー情報（色・アイコン・ラベル）取得
function getEnergyInfo(card) {
  if (!card) return { type: "colorless", bg: "linear-gradient(135deg, #e2e8f0, #94a3b8)", border: "#cbd5e1", icon: "⭐", label: "無" };
  const name = card.name || "";
  if (name.includes("炎") || card.color === "fire") {
    return { type: "fire", bg: "linear-gradient(135deg, #ef4444, #b91c1c)", border: "#f87171", icon: "🔥", label: "炎" };
  }
  if (name.includes("水") || card.color === "water") {
    return { type: "water", bg: "linear-gradient(135deg, #3b82f6, #1d4ed8)", border: "#93c5fd", icon: "💧", label: "水" };
  }
  if (name.includes("草") || card.color === "grass") {
    return { type: "grass", bg: "linear-gradient(135deg, #22c55e, #15803d)", border: "#86efac", icon: "🌿", label: "草" };
  }
  if (name.includes("雷") || card.color === "lightning") {
    return { type: "lightning", bg: "linear-gradient(135deg, #eab308, #a16207)", border: "#fde047", icon: "⚡", label: "雷" };
  }
  if (name.includes("超") || card.color === "psychic") {
    return { type: "psychic", bg: "linear-gradient(135deg, #a855f7, #6b21a8)", border: "#d8b4fe", icon: "🔮", label: "超" };
  }
  if (name.includes("闘") || card.color === "fighting") {
    return { type: "fighting", bg: "linear-gradient(135deg, #ea580c, #9a3412)", border: "#fdba74", icon: "🥊", label: "闘" };
  }
  if (name.includes("悪") || card.color === "darkness") {
    return { type: "darkness", bg: "linear-gradient(135deg, #475569, #0f172a)", border: "#94a3b8", icon: "🌙", label: "悪" };
  }
  if (name.includes("鋼") || card.color === "metal") {
    return { type: "metal", bg: "linear-gradient(135deg, #94a3b8, #475569)", border: "#e2e8f0", icon: "⚙️", label: "鋼" };
  }
  return { type: "special", bg: "linear-gradient(135deg, #cbd5e1, #64748b)", border: "#f1f5f9", icon: "⭐", label: "特" };
}

// 場のポケモンデータ生成
function createFieldPokemon(card, damage = 0, energies = [], tool = null) {
  if (!card) return null;
  registerCard(card);
  energies.forEach(e => registerCard(e));
  if (tool) registerCard(tool);
  return {
    card: card,
    damage: damage,
    energies: [...energies],
    tool: tool
  };
}

// =============================================================================
// プレイマット定義（デフォルト10種類 ＋ ユーザー自作登録対応）
// =============================================================================
const DEFAULT_PLAYMATS = [
  {
    id: "mat_01",
    name: "クラシック・ネイビー",
    type: "gradient",
    bg: "radial-gradient(circle at 50% 50%, #1e3a8a 0%, #0f172a 100%)",
    accent: "#3b82f6"
  },
  {
    id: "mat_02",
    name: "クリムゾン・レッド",
    type: "gradient",
    bg: "radial-gradient(circle at 50% 50%, #991b1b 0%, #450a0a 100%)",
    accent: "#ef4444"
  },
  {
    id: "mat_03",
    name: "エメラルド・フォレスト",
    type: "gradient",
    bg: "radial-gradient(circle at 50% 50%, #166534 0%, #052e16 100%)",
    accent: "#22c55e"
  },
  {
    id: "mat_04",
    name: "ライトニング・ボルト",
    type: "gradient",
    bg: "radial-gradient(circle at 50% 50%, #854d0e 0%, #1a120b 100%)",
    accent: "#eab308"
  },
  {
    id: "mat_05",
    name: "サイキック・シャドウ",
    type: "gradient",
    bg: "radial-gradient(circle at 50% 50%, #6b21a8 0%, #2e1065 100%)",
    accent: "#a855f7"
  },
  {
    id: "mat_06",
    name: "ダークネス・アビス",
    type: "gradient",
    bg: "radial-gradient(circle at 50% 50%, #334155 0%, #090d16 100%)",
    accent: "#64748b"
  },
  {
    id: "mat_07",
    name: "チャンピオン・ゴールド",
    type: "gradient",
    bg: "radial-gradient(circle at 50% 50%, #b45309 0%, #451a03 100%)",
    accent: "#f59e0b"
  },
  {
    id: "mat_08",
    name: "アクア・ラグーン",
    type: "gradient",
    bg: "radial-gradient(circle at 50% 50%, #0891b2 0%, #083344 100%)",
    accent: "#06b6d4"
  },
  {
    id: "mat_09",
    name: "ロスト・ディメンション",
    type: "gradient",
    bg: "radial-gradient(circle at 50% 50%, #9d174d 0%, #1e1028 100%)",
    accent: "#ec4899"
  },
  {
    id: "mat_10",
    name: "プラチナム・スチール",
    type: "gradient",
    bg: "radial-gradient(circle at 50% 50%, #475569 0%, #1e293b 100%)",
    accent: "#94a3b8"
  }
];

// =============================================================================
// アプリケーション状態 (State)
// =============================================================================
let state = {
  // プレイヤー情報
  myName: "プレイヤーA",
  oppName: "プレイヤーB（BOT）",
  roomNo: "482913",
  turn: 1,

  // 自分のカードゾーン
  myDeck: [],
  myHand: [],
  myPrizes: [],
  myTrash: [],
  myLost: [],
  myActive: null,       // { card, damage, energies, tool }
  myBench: [null, null, null, null, null],

  // テンポラリエリア
  tempCards: [],

  // 使用カードエリア
  playCard: null,

  // 共有ゾーン
  stadium: null,

  // 相手のカードゾーン (デモ用ダミー)
  oppDeckCount: 47,
  oppHandCount: 5,
  oppPrizes: 6,
  oppTrash: [
    { name: "博士の研究", type: "trainer", color: "trainer", uid: "opp_t0" },
    { name: "ハイパーボール", type: "trainer", color: "trainer", uid: "opp_t1" },
    { name: "基本草エネルギー", type: "energy", color: "grass", uid: "opp_t2" }
  ],
  oppLostCount: 0,
  oppActive: createFieldPokemon(OPPONENT_DECK[2], 60, [
    { name: "基本草エネルギー", type: "energy", color: "grass", uid: "opp_e0" },
    { name: "基本草エネルギー", type: "energy", color: "grass", uid: "opp_e1" }
  ], { name: "森の封印石", type: "trainer", color: "trainer", sub: "ポケモンのどうぐ", uid: "opp_tool0" }),
  oppBench: [
    createFieldPokemon(OPPONENT_DECK[0], 0, [{ name: "基本草エネルギー", type: "energy", color: "grass", uid: "opp_be0" }]),
    createFieldPokemon(OPPONENT_DECK[1], 0),
    null, null, null
  ],

  // UI選択・ドラッグ状態
  selectedHandIndices: new Set(),
  get selectedHandIndex() {
    if (!this.selectedHandIndices || this.selectedHandIndices.size === 0) return -1;
    return this.selectedHandIndices.values().next().value;
  },
  set selectedHandIndex(val) {
    if (!this.selectedHandIndices) this.selectedHandIndices = new Set();
    this.selectedHandIndices.clear();
    if (val >= 0) this.selectedHandIndices.add(val);
  },
  draggedHandIndex: -1,
  draggedEnergy: null, // { location, energyIndex }
  actionTargetMode: null, // "bench" | "active" など配置先選択待ち
  myMatId: "mat_01",
  oppMatId: "mat_02",
  isSoloMode: false,
  oppDeck: [],          // 一人回し用の完全な相手デッキ
  oppHand: [],          // 一人回し用の完全な相手手札
  oppPrizesList: [],    // 一人回し用の完全な相手サイドカード
  oppLost: [],          // 一人回し用の完全な相手ロストカード
  soloDeckA: SAMPLE_DECK,
  soloDeckB: SAMPLE_DECK_B,
  logs: []
};

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
  renderDeckPreview(SAMPLE_DECK);
  renderDeckPreview(SAMPLE_DECK, "deck-preview-a");
  renderDeckPreview(SAMPLE_DECK_B, "deck-preview-b");
  document.getElementById("btn-start").disabled = false;

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
    if (!e.target.closest("#ctx") && !e.target.closest(".card")) {
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
  },

  createRoom: () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    state.roomNo = code;
    document.getElementById("room-no").textContent = code;
    document.getElementById("room-box").classList.remove("hidden");
    document.getElementById("conn-status").textContent = "相手の参加を待っています...";
    showToast(`ルーム ${code} を作成しました`);
  },

  joinRoom: () => {
    const val = document.getElementById("in-room").value.trim();
    if (!val) return alert("ルーム番号を入力してください");
    state.roomNo = val;
    document.getElementById("conn-status").textContent = `ルーム ${val} に接続中... (デモ)`;
    showToast(`ルーム ${val} に入室しました`);
  },

  copyRoom: () => {
    navigator.clipboard.writeText(state.roomNo).then(() => {
      showToast("ルーム番号をコピーしました");
    });
  },

  loadDeck: () => {
    renderDeckPreview(SAMPLE_DECK);
    showToast("サンプルデッキ（60枚）を読み込みました");
    document.getElementById("btn-start").disabled = false;
  },

  startBattle: () => {
    const name = document.getElementById("in-name").value.trim() || "プレイヤーA";
    state.myName = name;
    startBattleSetup();
  },

  exit: () => {
    if (confirm("対戦を終了してロビーに戻りますか？")) {
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
  tempToBottom: () => moveTempToBottom(),

  // 手札アクション
  handToDeck: () => moveSelectedHandToDeck(),
  handToBottom: () => moveSelectedHandToBottom(),
  handTrash: () => trashSelectedHand(),
  handLost: () => moveSelectedHandToLost(),
  handBench: () => placeSelectedHandToBench(),
  handToPlayArea: () => moveSelectedHandToPlayArea(),

  // 使用カードエリア アクション
  playToTrash: () => movePlayCardToTrash(),
  playToHand: () => movePlayCardToHand(),
  playToStadium: () => movePlayCardToStadium(),
  playToLost: () => movePlayCardToLost(),

  // モード切替 & 一人回しアクション
  switchLobbyMode: (mode) => switchLobbyMode(mode),
  loadSoloDeckA: () => loadSoloDeckA(),
  loadSoloDeckB: () => loadSoloDeckB(),
  startSoloBattle: () => startSoloBattleSetup(),

  // その他
  endTurn: () => endTurn(),
  coin: () => tossCoin(),
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

function closeMenu() {
  document.body.classList.remove("menu-open");
}

// =============================================================================
// 対戦セットアップ
// =============================================================================
function startBattleSetup() {
  document.getElementById("lobby").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  // デッキ初期化（60枚シャッフル）
  state.myDeck = shuffleArray([...SAMPLE_DECK].map((c, i) => ({ ...c, uid: "c_" + i })));
  state.myHand = [];
  state.myPrizes = [];
  state.myTrash = [];
  state.myLost = [];
  state.tempCards = [];
  state.playCard = null;
  state.selectedHandIndex = -1;
  state.turn = 1;
  state.logs = [];

  // 初期セットアップ: 手札7枚ドロー
  for (let i = 0; i < 7; i++) {
    state.myHand.push(state.myDeck.shift());
  }

  // サイド6枚セット
  for (let i = 0; i < 6; i++) {
    state.myPrizes.push(state.myDeck.shift());
  }

  // デモ用: 初期のバトル場とベンチをセット
  // たねポケモンを探してバトル場に置く（デモ用初期エネ＆どうぐ装備）
  const basicIdx = state.myHand.findIndex(c => c.category === "たね");
  const initActiveCard = basicIdx >= 0
    ? state.myHand.splice(basicIdx, 1)[0]
    : { name: "ヒトカゲ", type: "pokemon", color: "fire", hp: 70, category: "たね", uid: "init_hitokage" };

  state.myActive = createFieldPokemon(initActiveCard, 0, [
    { name: "基本炎エネルギー", type: "energy", color: "fire", uid: "init_my_e0" }
  ], { name: "まけん気ハチマキ", type: "trainer", color: "trainer", sub: "ポケモンのどうぐ", uid: "init_my_tool0" });

  state.myBench = [null, null, null, null, null];

  state.isSoloMode = false;
  addLog(`対戦を開始しました（先攻/後攻決定・初期手札7枚ドロー・サイド6枚セット）`, {
    action: "MATCH_START",
    fromZone: "deck",
    toZone: "hand/prize/active",
    details: "初期手札7枚・サイド6枚・バトル場セット"
  });
  showToast("初期セットアップ完了！対戦を開始します");

  renderAll();
}

// 一人回しモードのセットアップ（2デッキ同時展開）
function startSoloBattleSetup() {
  state.isSoloMode = true;
  state.myName = "デッキ1 (プレイヤーA)";
  state.oppName = "デッキ2 (プレイヤーB)";
  state.roomNo = "SOLO-PRACTICE";

  document.getElementById("lobby").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  // デッキA（先攻）シャッフル＆初期化
  const deckSourceA = state.soloDeckA || SAMPLE_DECK;
  state.myDeck = shuffleArray([...deckSourceA].map((c, i) => ({ ...c, uid: "a_" + i })));
  state.myHand = [];
  state.myPrizes = [];
  state.myTrash = [];
  state.myLost = [];

  // デッキB（後攻）シャッフル＆初期化
  const deckSourceB = state.soloDeckB || SAMPLE_DECK_B;
  state.oppDeck = shuffleArray([...deckSourceB].map((c, i) => ({ ...c, uid: "b_" + i })));
  state.oppHand = [];
  state.oppPrizesList = [];
  state.oppTrash = [];
  state.oppLost = [];

  state.tempCards = [];
  state.playCard = null;
  state.stadium = null;
  state.selectedHandIndices.clear();
  state.turn = 1;
  state.logs = [];

  // デッキA: 手札7枚ドロー、サイド6枚
  for (let i = 0; i < 7; i++) state.myHand.push(state.myDeck.shift());
  for (let i = 0; i < 6; i++) state.myPrizes.push(state.myDeck.shift());

  // デッキB: 手札7枚ドロー、サイド6枚
  for (let i = 0; i < 7; i++) state.oppHand.push(state.oppDeck.shift());
  for (let i = 0; i < 6; i++) state.oppPrizesList.push(state.oppDeck.shift());
  state.oppDeckCount = state.oppDeck.length;
  state.oppHandCount = state.oppHand.length;
  state.oppPrizes = state.oppPrizesList.length;

  // デッキA たねポケモンをバトル場に配置
  const basicIdxA = state.myHand.findIndex(c => c.category === "たね");
  const initCardA = basicIdxA >= 0
    ? state.myHand.splice(basicIdxA, 1)[0]
    : { name: "ヒトカゲ", type: "pokemon", color: "fire", hp: 70, category: "たね", uid: "solo_a_active" };
  state.myActive = createFieldPokemon(initCardA, 0, [], null);
  state.myBench = [null, null, null, null, null];

  // デッキB たねポケモンを相手バトル場に配置
  const basicIdxB = state.oppHand.findIndex(c => c.category === "たね");
  const initCardB = basicIdxB >= 0
    ? state.oppHand.splice(basicIdxB, 1)[0]
    : { name: "フシギダネ", type: "pokemon", color: "grass", hp: 70, category: "たね", uid: "solo_b_active" };
  state.oppActive = createFieldPokemon(initCardB, 0, [], null);
  state.oppBench = [null, null, null, null, null];

  addLog(`【一人回し開始】デッキ1（${initCardA.name}）vs デッキ2（${initCardB.name}）の対戦を開始しました！`, {
    action: "SOLO_START",
    details: "一人回し開始: 2デッキ初期手札7枚・サイド6枚・バトル場セット"
  });
  showToast("一人回し開始！ ターン終了ボタンで上下の手番が交代します");

  renderAll();
}

// =============================================================================
// 描画関数群 (Render)
// =============================================================================
function renderAll() {
  document.getElementById("g-room").textContent = state.roomNo;
  document.getElementById("g-my-name").textContent = state.myName;
  document.getElementById("g-opp-name").textContent = state.oppName;
  document.getElementById("g-turn").textContent = state.turn;

  renderOpponent();
  renderMyField();
  renderHand();
  renderTemp();
  renderPlayArea();
  renderStadium();
  renderPlaymats();
  updateSheetUI();
}

function renderOpponent() {
  // 相手手札
  const oppHandEl = document.getElementById("opp-hand-cards");
  oppHandEl.innerHTML = "";
  for (let i = 0; i < state.oppHandCount; i++) {
    const b = document.createElement("div");
    b.className = "back";
    oppHandEl.appendChild(b);
  }
  document.getElementById("opp-hand-count").textContent = state.oppHandCount;

  // 相手山札・トラッシュ
  document.getElementById("opp-deck").innerHTML = `
    <div class="back"></div>
    <span class="count-badge">${state.oppDeckCount}</span>
  `;
  const oppTrashEl = document.getElementById("opp-trash");
  if (state.oppTrash.length > 0) {
    const top = state.oppTrash[state.oppTrash.length - 1];
    registerCard(top);
    oppTrashEl.innerHTML = `
      <div class="card ${top.color}" ondblclick="event.stopPropagation(); window.openCardZoomByUid('${top.uid}')">
        <div class="card-top"><span class="name">${top.name}</span></div>
      </div>
      <span class="count-badge">${state.oppTrash.length}</span>
    `;
    oppTrashEl.onclick = () => showCardListModal("相手のトラッシュ", state.oppTrash);
  } else {
    oppTrashEl.innerHTML = `<div class="slot">トラッシュ</div><span class="count-badge">0</span>`;
  }

  // 相手ロスト・サイド
  document.getElementById("opp-lost").innerHTML = `ロスト <b>${state.oppLostCount}</b>`;
  const oppPrizesEl = document.getElementById("opp-prizes");
  oppPrizesEl.innerHTML = "";
  for (let i = 0; i < state.oppPrizes; i++) {
    const b = document.createElement("div");
    b.className = "back";
    oppPrizesEl.appendChild(b);
  }

  // 相手バトル場（ダブルクリックで拡大）
  const oppActiveEl = document.getElementById("opp-active");
  if (state.oppActive) {
    oppActiveEl.innerHTML = renderPokemonCardHtml(state.oppActive, "opp-active");
  } else {
    oppActiveEl.innerHTML = `<div class="slot">相手バトル場</div>`;
  }

  // 相手ベンチ（ダブルクリックで拡大）
  const oppBenchEl = document.getElementById("opp-bench");
  oppBenchEl.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const b = state.oppBench[i];
    if (b) {
      oppBenchEl.innerHTML += renderPokemonCardHtml(b, `opp-bench_${i}`, "bench-spot");
    } else {
      oppBenchEl.innerHTML += `<div class="slot"></div>`;
    }
  }
}

function renderMyField() {
  // 自分ロスト
  const myLostEl = document.getElementById("my-lost");
  myLostEl.innerHTML = `ロスト <b>${state.myLost.length}</b>`;
  myLostEl.onclick = () => showCardListModal("ロストゾーン", state.myLost);
  myLostEl.ondragover = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; myLostEl.classList.add("drag-over"); };
  myLostEl.ondragleave = (e) => { if (!myLostEl.contains(e.relatedTarget)) myLostEl.classList.remove("drag-over"); };
  myLostEl.ondrop = (e) => {
    e.preventDefault();
    myLostEl.classList.remove("drag-over");
    handleDropToLost(e);
  };

  // 自分サイド
  const myPrizesEl = document.getElementById("my-prizes");
  myPrizesEl.innerHTML = "";
  state.myPrizes.forEach((p, idx) => {
    const el = document.createElement("div");
    el.className = "back clickable";
    el.title = "クリックでサイドを1枚手札に加える";
    el.onclick = () => takePrize(idx);
    myPrizesEl.appendChild(el);
  });

  // 自分山札
  const myDeckEl = document.getElementById("my-deck");
  myDeckEl.innerHTML = `
    <div class="back clickable" title="山札をクリックで1枚引く" onclick="actions.draw()"></div>
    <span class="count-badge">${state.myDeck.length}</span>
  `;

  // 自分トラッシュ（一番上のカードはダブルクリックで拡大）
  const myTrashEl = document.getElementById("my-trash");
  if (state.myTrash.length > 0) {
    const top = state.myTrash[state.myTrash.length - 1];
    registerCard(top);
    myTrashEl.innerHTML = `
      <div class="card ${top.color}" ondblclick="event.stopPropagation(); window.openCardZoomByUid('${top.uid}')">
        <div class="card-top"><span class="name">${top.name}</span></div>
      </div>
      <span class="count-badge">${state.myTrash.length}</span>
    `;
    myTrashEl.onclick = () => showCardListModal("トラッシュ", state.myTrash);
  } else {
    myTrashEl.innerHTML = `<div class="slot">トラッシュ</div><span class="count-badge">0</span>`;
    myTrashEl.onclick = null;
  }
  myTrashEl.ondragover = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; myTrashEl.classList.add("drag-over"); };
  myTrashEl.ondragleave = (e) => { if (!myTrashEl.contains(e.relatedTarget)) myTrashEl.classList.remove("drag-over"); };
  myTrashEl.ondrop = (e) => {
    e.preventDefault();
    myTrashEl.classList.remove("drag-over");
    handleDropToTrash(e);
  };

  // 自分バトル場（クリックでメニュー、ダブルクリックで拡大）
  const myActiveEl = document.getElementById("my-active");
  if (state.myActive) {
    myActiveEl.innerHTML = renderPokemonCardHtml(state.myActive, "active");
    const cardEl = myActiveEl.querySelector(".card");
    if (cardEl) {
      cardEl.onclick = (e) => showPokemonMenu(e, "active", 0);
    }
  } else {
    myActiveEl.innerHTML = `<div class="slot ${state.actionTargetMode === 'active' ? 'targetable' : ''}">バトル場に出す<br><small style="font-size:9px; opacity:0.8;">(ドラッグまたはタップ)</small></div>`;
    myActiveEl.onclick = () => {
      if (state.selectedHandIndex >= 0 && state.selectedHandIndex < state.myHand.length) {
        placeHandCardToActive(state.selectedHandIndex);
      } else {
        showToast("手札のカードを選択してからここをタップするか、直接ドラッグしてください");
      }
    };
    myActiveEl.ondragover = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; myActiveEl.classList.add("drag-over"); };
    myActiveEl.ondragleave = (e) => { if (!myActiveEl.contains(e.relatedTarget)) myActiveEl.classList.remove("drag-over"); };
    myActiveEl.ondrop = (e) => {
      e.preventDefault();
      myActiveEl.classList.remove("drag-over");
      const handIdx = getDroppedHandIndex(e);
      if (handIdx !== null) placeHandCardToActive(handIdx);
    };
  }

  // 自分ベンチ（クリックでメニュー、ダブルクリックで拡大）
  const myBenchEl = document.getElementById("my-bench");
  myBenchEl.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const b = state.myBench[i];
    if (b) {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = renderPokemonCardHtml(b, `bench_${i}`, "bench-spot");
      const cardEl = wrapper.firstElementChild;
      cardEl.dataset.benchIndex = i.toString();
      cardEl.onclick = (e) => showPokemonMenu(e, "bench", i);
      myBenchEl.appendChild(cardEl);
    } else {
      const slot = document.createElement("div");
      slot.className = `slot ${state.actionTargetMode === 'bench' ? 'targetable' : ''}`;
      slot.dataset.benchIndex = i.toString();
      slot.innerHTML = `ベンチ ${i + 1}<br><small style="font-size:8px; opacity:0.8;">(ドラッグ配置)</small>`;
      slot.onclick = () => {
        if (state.selectedHandIndex >= 0 && state.selectedHandIndex < state.myHand.length) {
          placeHandCardToBenchIndex(state.selectedHandIndex, i);
        } else {
          showToast(`手札のカードを選択してからベンチ${i + 1}をタップするか、直接ドラッグしてください`);
        }
      };
      slot.ondragover = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; slot.classList.add("drag-over"); };
      slot.ondragleave = (e) => { if (!slot.contains(e.relatedTarget)) slot.classList.remove("drag-over"); };
      slot.ondrop = (e) => {
        e.preventDefault();
        slot.classList.remove("drag-over");
        const handIdx = getDroppedHandIndex(e);
        if (handIdx !== null) placeHandCardToBenchIndex(handIdx, i);
      };
      myBenchEl.appendChild(slot);
    }
  }
}

// =============================================================================
// 手札複数選択 ＆ 範囲選択（ドラッグ＆ドロップ）ヘルパー
// =============================================================================
function getSelectedHandIndices() {
  if (!state.selectedHandIndices || state.selectedHandIndices.size === 0) return [];
  return Array.from(state.selectedHandIndices)
    .filter(i => i >= 0 && i < state.myHand.length)
    .sort((a, b) => b - a); // 降順ソート（splice削除時に安全）
}

function getSelectedHandCards() {
  if (!state.selectedHandIndices || state.selectedHandIndices.size === 0) return [];
  const asc = Array.from(state.selectedHandIndices)
    .filter(i => i >= 0 && i < state.myHand.length)
    .sort((a, b) => a - b);
  return asc.map(i => ({ index: i, card: state.myHand[i] }));
}

const marqueeState = {
  isMouseDown: false,
  isSelecting: false,
  startX: 0,
  startY: 0,
  justFinished: false
};

function initMarqueeSelection() {
  const handArea = document.querySelector(".hand-area");
  const selectionBox = document.getElementById("selection-box");
  if (!handArea || !selectionBox) return;

  const onStart = (e) => {
    // ボタンや操作UI上のクリックは範囲選択を開始しない
    if (e.target.closest("button") || e.target.closest(".hand-btns") || e.target.closest(".sp-menu-btn")) {
      return;
    }
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // カード上のクリックの場合、Shift/Ctrlが押されているか、あるいはカード外の背景なら範囲選択を優先
    const onCard = !!e.target.closest("#hand .card");
    if (onCard && !e.shiftKey && !e.ctrlKey) {
      return;
    }

    marqueeState.isMouseDown = true;
    marqueeState.isSelecting = false;
    marqueeState.startX = clientX;
    marqueeState.startY = clientY;
  };

  const onMove = (e) => {
    if (!marqueeState.isMouseDown) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - marqueeState.startX;
    const dy = clientY - marqueeState.startY;

    if (!marqueeState.isSelecting && Math.hypot(dx, dy) > 8) {
      marqueeState.isSelecting = true;
      selectionBox.classList.remove("hidden");
    }

    if (marqueeState.isSelecting) {
      const x1 = Math.min(marqueeState.startX, clientX);
      const y1 = Math.min(marqueeState.startY, clientY);
      const width = Math.abs(clientX - marqueeState.startX);
      const height = Math.abs(clientY - marqueeState.startY);

      selectionBox.style.left = `${x1}px`;
      selectionBox.style.top = `${y1}px`;
      selectionBox.style.width = `${width}px`;
      selectionBox.style.height = `${height}px`;

      // 範囲内のカードを視覚的にハイライト
      const boxRect = { left: x1, top: y1, right: x1 + width, bottom: y1 + height };
      const cardEls = document.querySelectorAll("#hand .card");
      cardEls.forEach(cardEl => {
        const r = cardEl.getBoundingClientRect();
        const intersects = !(r.right < boxRect.left || r.left > boxRect.right || r.bottom < boxRect.top || r.top > boxRect.bottom);
        if (intersects) {
          cardEl.classList.add("range-hover");
        } else {
          cardEl.classList.remove("range-hover");
        }
      });
    }
  };

  const onEnd = (e) => {
    if (!marqueeState.isMouseDown) return;

    if (marqueeState.isSelecting) {
      const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
      const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
      const x1 = Math.min(marqueeState.startX, clientX);
      const y1 = Math.min(marqueeState.startY, clientY);
      const width = Math.abs(clientX - marqueeState.startX);
      const height = Math.abs(clientY - marqueeState.startY);
      const boxRect = { left: x1, top: y1, right: x1 + width, bottom: y1 + height };

      // Shift/Ctrlキーが押されていない場合は既存の選択をクリア
      if (!e.shiftKey && !e.ctrlKey) {
        state.selectedHandIndices.clear();
      }

      let selectedCount = 0;
      const cardEls = document.querySelectorAll("#hand .card");
      cardEls.forEach(cardEl => {
        cardEl.classList.remove("range-hover");
        const r = cardEl.getBoundingClientRect();
        const intersects = !(r.right < boxRect.left || r.left > boxRect.right || r.bottom < boxRect.top || r.top > boxRect.bottom);
        if (intersects) {
          const idx = parseInt(cardEl.dataset.index, 10);
          if (!isNaN(idx)) {
            state.selectedHandIndices.add(idx);
            selectedCount++;
          }
        }
      });

      selectionBox.classList.add("hidden");
      marqueeState.justFinished = true;
      setTimeout(() => { marqueeState.justFinished = false; }, 150);

      if (selectedCount > 0) {
        showToast(`${selectedCount}枚のカードを範囲選択しました`);
      }
      renderHand();
      updateSheetUI();
    }

    marqueeState.isMouseDown = false;
    marqueeState.isSelecting = false;
  };

  handArea.addEventListener("mousedown", onStart);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onEnd);

  // タッチデバイス対応
  handArea.addEventListener("touchstart", onStart, { passive: true });
  window.addEventListener("touchmove", onMove, { passive: true });
  window.addEventListener("touchend", onEnd);
}

function renderHand() {
  const handEl = document.getElementById("hand");
  handEl.innerHTML = "";
  document.getElementById("hand-count").textContent = state.myHand.length;

  const selNameEl = document.getElementById("hand-sel");
  const selectedCards = getSelectedHandCards();
  if (selectedCards.length === 1) {
    selNameEl.textContent = `選択中: ${selectedCards[0].card.name}`;
  } else if (selectedCards.length > 1) {
    const names = selectedCards.map(s => s.card.name).slice(0, 3).join(", ");
    const more = selectedCards.length > 3 ? "..." : "";
    selNameEl.textContent = `選択中: ${selectedCards.length}枚 (${names}${more})`;
  } else {
    selNameEl.textContent = "ドラッグで使用 / 複数選択可能";
  }

  state.myHand.forEach((card, idx) => {
    registerCard(card);
    const isSelected = state.selectedHandIndices.has(idx);
    const el = document.createElement("div");
    el.className = `card ${card.color} ${isSelected ? 'selected' : ''}`;
    el.dataset.index = idx;
    el.draggable = true;
    el.innerHTML = `
      <div class="card-top">
        <span class="name">${card.name}</span>
        ${card.hp ? `<span class="hp">HP${card.hp}</span>` : ''}
      </div>
      <div class="card-btm">
        <span>${card.sub || card.category || ''}</span>
      </div>
    `;

    // クリック・タップで選択（スマホモード時は即座に操作メニューを表示）
    el.onclick = () => {
      if (marqueeState.justFinished) return;
      if (isMobileMode()) {
        selectHandCardAndOpenMenu(idx);
      } else {
        toggleSelectHandCard(idx);
      }
    };

    el.oncontextmenu = (e) => {
      e.preventDefault();
      selectHandCardAndOpenMenu(idx);
    };

    // ダブルクリック拡大表示（手札）
    el.ondblclick = (e) => {
      e.stopPropagation();
      openCardZoom(card);
    };

    // ドラッグ＆ドロップ（使用カードエリアへドラッグ）
    el.ondragstart = (e) => {
      // もし未選択ならこのカードを選択
      if (!state.selectedHandIndices.has(idx)) {
        state.selectedHandIndices.clear();
        state.selectedHandIndices.add(idx);
        renderHand();
      }
      e.dataTransfer.setData("text/plain", idx.toString());
      e.dataTransfer.effectAllowed = "move";
      el.classList.add("dragging");
      state.draggedHandIndex = idx;
    };
    el.ondragend = () => {
      el.classList.remove("dragging");
      state.draggedHandIndex = -1;
    };

    handEl.appendChild(el);
  });
}

function renderPlayArea() {
  const areaEl = document.getElementById("play-area");
  const wrapEl = document.getElementById("play-card-wrap");
  const actionsEl = document.getElementById("play-actions");
  const btnStadium = document.getElementById("btn-play-stadium");

  // ドラッグ＆ドロップ イベント登録（常に受け入れ可能）
  areaEl.ondragover = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    areaEl.classList.add("drag-over");
  };
  areaEl.ondragleave = (e) => {
    if (!areaEl.contains(e.relatedTarget)) {
      areaEl.classList.remove("drag-over");
    }
  };
  areaEl.ondrop = (e) => {
    e.preventDefault();
    areaEl.classList.remove("drag-over");
    let handIdx = state.draggedHandIndex;
    const dataIdx = e.dataTransfer.getData("text/plain");
    if (dataIdx !== "" && !isNaN(parseInt(dataIdx, 10))) {
      handIdx = parseInt(dataIdx, 10);
    }
    if (handIdx >= 0 && handIdx < state.myHand.length) {
      playHandCardByIndex(handIdx);
    }
  };

  if (!state.playCard) {
    // 空の状態：常時表示し、空枠を表示
    areaEl.classList.add("empty");
    actionsEl.classList.add("hidden");
    wrapEl.innerHTML = `
      <div class="slot play-slot" title="手札からドラッグ＆ドロップしてカードを使用">
        使用カード枠<br><small style="font-size:9px; opacity:0.8;">(手札をドラッグ)</small>
      </div>
    `;
    // クリック・タップ操作対応（スマホ等のフォールバック）
    const slotEl = wrapEl.querySelector(".play-slot");
    if (slotEl) {
      slotEl.onclick = () => {
        if (state.selectedHandIndex >= 0 && state.selectedHandIndex < state.myHand.length) {
          playHandCardByIndex(state.selectedHandIndex);
        } else {
          showToast("手札カードをドラッグするか、選択してからここをクリックしてください");
        }
      };
    }
    return;
  }

  // カードがある状態：枠線確定・アクションボタン表示
  areaEl.classList.remove("empty");
  actionsEl.classList.remove("hidden");
  registerCard(state.playCard);
  wrapEl.innerHTML = createCardHtml(state.playCard);
  const cardEl = wrapEl.querySelector(".card");
  if (cardEl) {
    cardEl.draggable = true;
    cardEl.ondragstart = (e) => {
      e.dataTransfer.setData("text/plain", "playCard");
      e.dataTransfer.effectAllowed = "move";
      cardEl.classList.add("dragging");
    };
    cardEl.ondragend = () => {
      cardEl.classList.remove("dragging");
    };
    cardEl.ondblclick = (e) => {
      e.stopPropagation();
      openCardZoom(state.playCard);
    };
  }

  // スタジアムカードの場合のみ「スタジアムへ」ボタンを表示
  if (state.playCard.type === "stadium") {
    btnStadium.classList.remove("hidden");
  } else {
    btnStadium.classList.add("hidden");
  }
}

function renderTemp() {
  const tempEl = document.getElementById("temp");
  const tempCardsEl = document.getElementById("temp-cards");
  if (state.tempCards.length === 0) {
    tempEl.classList.add("hidden");
    return;
  }
  tempEl.classList.remove("hidden");
  tempCardsEl.innerHTML = "";
  state.tempCards.forEach(c => {
    registerCard(c);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="card ${c.color}">
        <div class="card-top"><span class="name">${c.name}</span></div>
        <div class="card-btm"><span>${c.sub || c.category || ''}</span></div>
      </div>
    `;
    const cardEl = wrapper.firstElementChild;
    cardEl.ondblclick = (e) => {
      e.stopPropagation();
      openCardZoom(c);
    };
    tempCardsEl.appendChild(cardEl);
  });
}

function renderStadium() {
  const el = document.getElementById("stadium");

  // ドラッグ＆ドロップ受け入れ設定（手札カードおよび使用カードエリアからのドロップに対応）
  el.ondragover = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    el.classList.add("drag-over");
  };
  el.ondragleave = (e) => {
    if (!el.contains(e.relatedTarget)) {
      el.classList.remove("drag-over");
    }
  };
  el.ondrop = (e) => {
    e.preventDefault();
    el.classList.remove("drag-over");

    // 1. 使用中カードエリアからのドロップ
    const rawData = e.dataTransfer.getData("text/plain");
    if (rawData === "playCard" && state.playCard) {
      const card = state.playCard;
      if (state.stadium) {
        state.myTrash.push(state.stadium);
        addLog(`前のスタジアム「${state.stadium.name}」がトラッシュされました`);
      }
      state.stadium = card;
      state.playCard = null;
      addLog(`スタジアム「${card.name}」を場に出しました`);
      showToast(`スタジアム: ${card.name}`);
      renderAll();
      return;
    }

    // 2. 手札からのドロップ
    let handIdx = state.draggedHandIndex;
    if (rawData !== "" && !isNaN(parseInt(rawData, 10))) {
      handIdx = parseInt(rawData, 10);
    }
    if (handIdx >= 0 && handIdx < state.myHand.length) {
      const card = state.myHand[handIdx];
      if (state.stadium) {
        state.myTrash.push(state.stadium);
        addLog(`前のスタジアム「${state.stadium.name}」がトラッシュされました`);
      }
      state.myHand.splice(handIdx, 1);
      state.selectedHandIndices.clear();
      state.draggedHandIndex = -1;
      state.stadium = card;
      addLog(`手札からスタジアム「${card.name}」を場に出しました`);
      showToast(`スタジアム: ${card.name}`);
      renderAll();
      return;
    }
  };

  if (state.stadium) {
    registerCard(state.stadium);
    el.innerHTML = `
      <div class="card trainer clickable" title="クリックでスタジアムをトラッシュへ">
        <div class="card-top"><span class="name">${state.stadium.name}</span></div>
        <div class="card-btm"><span>スタジアム</span></div>
      </div>
    `;
    const cardEl = el.querySelector(".card");
    if (cardEl) {
      cardEl.ondblclick = (e) => {
        e.stopPropagation();
        openCardZoom(state.stadium);
      };
    }
    el.onclick = () => {
      if (confirm(`スタジアム「${state.stadium.name}」をトラッシュしますか？`)) {
        state.myTrash.push(state.stadium);
        addLog(`スタジアム「${state.stadium.name}」がトラッシュされました`);
        state.stadium = null;
        renderAll();
      }
    };
  } else {
    el.innerHTML = `<div class="slot" title="手札や使用中カードをドラッグ＆ドロップして配置">スタジアム<br><small style="font-size:9px; opacity:0.8;">(ドラッグ配置)</small></div>`;
    el.onclick = null;
  }
}

function getPokemonByLocation(loc) {
  if (loc === "active" || loc === "my-active") return state.myActive;
  if (loc.startsWith("bench_") || loc.startsWith("my-bench_")) {
    const idx = parseInt(loc.replace("bench_", "").replace("my-bench_", ""), 10);
    return state.myBench[idx];
  }
  if (loc === "opp-active") return state.oppActive;
  if (loc.startsWith("opp-bench_")) {
    const idx = parseInt(loc.replace("opp-bench_", ""), 10);
    return state.oppBench[idx];
  }
  return null;
}

function findPokemonByCardUid(uid) {
  if (!uid) return null;
  if (state.myActive && state.myActive.card.uid === uid) return { pokemon: state.myActive, loc: "active" };
  for (let i = 0; i < state.myBench.length; i++) {
    const b = state.myBench[i];
    if (b && b.card.uid === uid) return { pokemon: b, loc: `bench_${i}` };
  }
  if (state.oppActive && state.oppActive.card.uid === uid) return { pokemon: state.oppActive, loc: "opp-active" };
  for (let i = 0; i < state.oppBench.length; i++) {
    const b = state.oppBench[i];
    if (b && b.card.uid === uid) return { pokemon: b, loc: `opp-bench_${i}` };
  }
  return null;
}

function renderPokemonCardHtml(pokemon, location, extraClass = "") {
  if (!pokemon || !pokemon.card) return "";
  registerCard(pokemon.card);
  const card = pokemon.card;
  const damage = pokemon.damage || 0;

  // ポケモンのどうぐ（カード上部に少しはみ出る）
  let toolHtml = "";
  if (pokemon.tool) {
    registerCard(pokemon.tool);
    toolHtml = `
      <div class="pokemon-tool-tab"
           title="ポケモンのどうぐ: ${pokemon.tool.name} (クリックでメニュー / ダブルクリックで拡大)"
           onclick="event.stopPropagation(); showToolMenu(event, '${location}')"
           ondblclick="event.stopPropagation(); window.openCardZoomByUid('${pokemon.tool.uid}')">
        <span class="tool-icon">🎒</span>
        <span class="tool-name">${pokemon.tool.name}</span>
      </div>
    `;
  }

  // ついているエネルギー（下部に小さな丸・色分け・ドラッグ移動・クリックメニュー）
  let energiesHtml = "";
  if (pokemon.energies && pokemon.energies.length > 0) {
    const badges = pokemon.energies.map((energy, eIdx) => {
      registerCard(energy);
      const info = getEnergyInfo(energy);
      return `
        <div class="energy-badge"
             data-location="${location}"
             data-energy-idx="${eIdx}"
             style="background:${info.bg}; border-color:${info.border};"
             title="${energy.name} (ドラッグで移動 / クリックでメニュー)"
             draggable="true"
             ondragstart="window.handleEnergyDragStart(event, '${location}', ${eIdx})"
             ondragend="window.handleEnergyDragEnd(event)"
             onclick="event.stopPropagation(); showEnergyMenu(event, '${location}', ${eIdx})">
          ${info.icon}
        </div>
      `;
    }).join("");
    energiesHtml = `<div class="card-energies">${badges}</div>`;
  }

  return `
    <div class="card ${card.color} ${extraClass}"
         data-location="${location}"
         ondragover="window.handlePokemonDragOver(event)"
         ondragleave="window.handlePokemonDragLeave(event)"
         ondrop="window.handlePokemonDrop(event, '${location}')"
         ondblclick="event.stopPropagation(); hideCtx(); openCardZoomByUid('${card.uid}')">
      ${toolHtml}
      <div class="card-top">
        <span class="name">${card.name}</span>
        ${card.hp ? `<span class="hp">HP${card.hp}</span>` : ''}
      </div>
      <div class="card-btm">
        <span>${card.category || card.sub || ''}</span>
      </div>
      ${damage > 0 ? `<div class="dmg">${damage}</div>` : ''}
      ${energiesHtml}
    </div>
  `;
}

window.handleEnergyDragStart = function(e, location, energyIdx) {
  e.stopPropagation();
  state.draggedEnergy = { location: location, energyIndex: energyIdx };
  state.draggedHandIndex = -1;
  e.dataTransfer.setData("text/plain", `energy:${location}:${energyIdx}`);
  e.dataTransfer.effectAllowed = "move";
  if (e.target) e.target.classList.add("dragging");
};

window.handleEnergyDragEnd = function(e) {
  if (e.target) e.target.classList.remove("dragging");
  state.draggedEnergy = null;
  document.querySelectorAll(".drag-target").forEach(el => el.classList.remove("drag-target"));
};

window.handlePokemonDragOver = function(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  const el = e.currentTarget;
  if (el && !el.classList.contains("drag-target")) {
    el.classList.add("drag-target");
  }
};

window.handlePokemonDragLeave = function(e) {
  if (e.currentTarget && !e.currentTarget.contains(e.relatedTarget)) {
    e.currentTarget.classList.remove("drag-target");
  }
};

window.handlePokemonDrop = function(e, location) {
  if (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    if (e.currentTarget) e.currentTarget.classList.remove("drag-target");
  }

  const dst = getPokemonByLocation(location);
  if (!dst) return;

  // 1. エネルギー移動
  if (state.draggedEnergy) {
    moveEnergyBetweenPokemon(state.draggedEnergy.location, state.draggedEnergy.energyIndex, location);
    state.draggedEnergy = null;
    return;
  }

  // 2. 手札カードからのドロップ
  let handIdx = state.draggedHandIndex;
  if (e && e.dataTransfer) {
    const rawData = e.dataTransfer.getData("text/plain");
    if (rawData && !rawData.startsWith("energy:") && !isNaN(parseInt(rawData, 10))) {
      handIdx = parseInt(rawData, 10);
    }
  }

  if (handIdx >= 0 && handIdx < state.myHand.length) {
    attachHandCardToPokemon(handIdx, location);
  }
};

window.showEnergyMenu = function(e, location, energyIndex) {
  e.stopPropagation();
  hideCtx();
  const pokemon = getPokemonByLocation(location);
  if (!pokemon || !pokemon.energies[energyIndex]) return;
  const energy = pokemon.energies[energyIndex];
  const info = getEnergyInfo(energy);

  const ctx = document.getElementById("ctx");
  ctx.innerHTML = `
    <div style="font-size:12px; font-weight:bold; color:#facc15; padding:4px 8px; display:flex; align-items:center; gap:6px;">
      <span style="font-size:14px;">${info.icon}</span> ${energy.name}
    </div>
    <div style="font-size:10px; color:#94a3b8; padding:0 8px 4px;">対象: ${pokemon.card.name}</div>
    <div class="divider"></div>
    <button onclick="detachEnergy('${location}', ${energyIndex}, 'trash')">🗑️ トラッシュする</button>
    <button onclick="detachEnergy('${location}', ${energyIndex}, 'hand')">🖐️ 手札に戻す</button>
    <button onclick="detachEnergy('${location}', ${energyIndex}, 'deck')">📦 山に戻す</button>
  `;
  ctx.style.left = `${Math.min(e.clientX, window.innerWidth - 180)}px`;
  ctx.style.top = `${Math.min(e.clientY, window.innerHeight - 200)}px`;
  ctx.classList.remove("hidden");
};

window.detachEnergy = function(location, energyIndex, destination) {
  hideCtx();
  const pokemon = getPokemonByLocation(location);
  if (!pokemon || !pokemon.energies[energyIndex]) return;
  const energy = pokemon.energies.splice(energyIndex, 1)[0];

  if (destination === "trash") {
    state.myTrash.push(energy);
    addLog(`「${pokemon.card.name}」から「${energy.name}」をトラッシュしました`);
    showToast(`トラッシュ: ${energy.name}`);
  } else if (destination === "hand") {
    state.myHand.push(energy);
    addLog(`「${pokemon.card.name}」から「${energy.name}」を手札に戻しました`);
    showToast(`手札へ: ${energy.name}`);
  } else if (destination === "deck") {
    state.myDeck.push(energy);
    addLog(`「${pokemon.card.name}」から「${energy.name}」を山札の下に戻しました`);
    showToast(`山札へ: ${energy.name}`);
  }
  renderAll();
};

window.showToolMenu = function(e, location) {
  e.stopPropagation();
  hideCtx();
  const pokemon = getPokemonByLocation(location);
  if (!pokemon || !pokemon.tool) return;
  const tool = pokemon.tool;

  const ctx = document.getElementById("ctx");
  ctx.innerHTML = `
    <div style="font-size:12px; font-weight:bold; color:#38bdf8; padding:4px 8px; display:flex; align-items:center; gap:6px;">
      <span style="font-size:14px;">🎒</span> ${tool.name}
    </div>
    <div style="font-size:10px; color:#94a3b8; padding:0 8px 4px;">対象: ${pokemon.card.name}</div>
    <div class="divider"></div>
    <button onclick="openCardZoomByUid('${tool.uid}')">🔍 どうぐを拡大表示</button>
    <button onclick="detachTool('${location}', 'trash')">🗑️ トラッシュする</button>
    <button onclick="detachTool('${location}', 'hand')">🖐️ 手札に戻す</button>
    <button onclick="detachTool('${location}', 'lost')">🌀 ロストゾーンへ</button>
  `;
  ctx.style.left = `${Math.min(e.clientX, window.innerWidth - 180)}px`;
  ctx.style.top = `${Math.min(e.clientY, window.innerHeight - 220)}px`;
  ctx.classList.remove("hidden");
};

window.detachTool = function(location, destination) {
  hideCtx();
  const pokemon = getPokemonByLocation(location);
  if (!pokemon || !pokemon.tool) return;
  const tool = pokemon.tool;
  pokemon.tool = null;

  if (destination === "trash") {
    state.myTrash.push(tool);
    addLog(`「${pokemon.card.name}」から「${tool.name}」をトラッシュしました`);
    showToast(`トラッシュ: ${tool.name}`);
  } else if (destination === "hand") {
    state.myHand.push(tool);
    addLog(`「${pokemon.card.name}」から「${tool.name}」を手札に戻しました`);
    showToast(`手札へ: ${tool.name}`);
  } else if (destination === "lost") {
    state.myLost.push(tool);
    addLog(`「${pokemon.card.name}」から「${tool.name}」をロストゾーンへ送りました`);
    showToast(`ロストへ: ${tool.name}`);
  }
  renderAll();
};

function createCardHtml(card, damage = 0, extraClass = "") {
  registerCard(card);
  return `
    <div class="card ${card.color} ${extraClass}" ondblclick="event.stopPropagation(); window.openCardZoomByUid('${card.uid || ''}')">
      <div class="card-top">
        <span class="name">${card.name}</span>
        ${card.hp ? `<span class="hp">HP${card.hp}</span>` : ''}
      </div>
      <div class="card-btm">
        <span>${card.category || card.sub || ''}</span>
      </div>
      ${damage > 0 ? `<div class="dmg">${damage}</div>` : ''}
    </div>
  `;
}

// スマホ（縦画面・小画面・タッチデバイス）判定ヘルパー
function isMobileMode() {
  return window.innerWidth <= 768 || 
         window.matchMedia("(orientation: portrait)").matches ||
         ('ontouchstart' in window && window.innerWidth <= 1024);
}

// スマホモード：手札タップ時に選択して即座に操作シートを開く
function selectHandCardAndOpenMenu(idx) {
  if (idx < 0 || idx >= state.myHand.length) return;
  state.selectedHandIndices.clear();
  state.selectedHandIndices.add(idx);
  state.selectedHandIndex = idx;
  renderHand();
  actions.openMenu();
}

function updateSheetUI() {
  const selEl = document.getElementById("sheet-sel");
  const deckEl = document.getElementById("sheet-deck");
  const handBodyEl = document.getElementById("sheet-hand-body");

  const selectedCards = getSelectedHandCards();

  if (selEl) {
    if (selectedCards.length === 1) {
      selEl.textContent = `選択中: ${selectedCards[0].card.name}`;
    } else if (selectedCards.length > 1) {
      selEl.textContent = `選択中: ${selectedCards.length}枚`;
    } else {
      selEl.textContent = "未選択";
    }
  }

  if (deckEl) {
    deckEl.textContent = `残り ${state.myDeck.length} 枚`;
  }

  if (!handBodyEl) return;

  // 1. 単一カード選択中：カードに応じた専用アクションメニュー
  if (selectedCards.length === 1) {
    const { index: handIdx, card } = selectedCards[0];
    const isBasicOrPk = card.category === "たね" || card.category === "1進化" || card.category === "2進化" || card.type === "pokemon";
    const isEnergy = card.type === "energy" || (card.name && card.name.includes("エネルギー"));
    const isTool = card.sub === "ポケモンのどうぐ" || (card.name && (card.name.includes("ハチマキ") || card.name.includes("封印石") || card.name.includes("おまもり")));
    const isStadium = card.category === "スタジアム" || (card.sub && card.sub === "スタジアム");

    // エネルギー付与先ボタン（バトル場 ＆ ベンチ）
    let targetButtons = "";
    if (state.myActive) {
      targetButtons += `<button class="btn gold sub-target" onclick="attachHandCardToPokemon(${handIdx}, 'active'); closeMenu();">⚡ バトル場へ (${state.myActive.card.name})</button>`;
    }
    state.myBench.forEach((b, bIdx) => {
      if (b) {
        targetButtons += `<button class="btn gold sub-target" onclick="attachHandCardToPokemon(${handIdx}, 'bench_${bIdx}'); closeMenu();">⚡ ベンチ${bIdx + 1}へ (${b.card.name})</button>`;
      }
    });

    // どうぐ装備先ボタン
    let toolButtons = "";
    if (state.myActive) {
      toolButtons += `<button class="btn blue sub-target" onclick="attachHandCardToPokemon(${handIdx}, 'active'); closeMenu();">🎒 バトル場へ (${state.myActive.card.name})</button>`;
    }
    state.myBench.forEach((b, bIdx) => {
      if (b) {
        toolButtons += `<button class="btn blue sub-target" onclick="attachHandCardToPokemon(${handIdx}, 'bench_${bIdx}'); closeMenu();">🎒 ベンチ${bIdx + 1}へ (${b.card.name})</button>`;
      }
    });

    handBodyEl.innerHTML = `
      <div class="sheet-card-preview selected-banner ${card.color}">
        <div>
          <span class="sheet-card-name">${card.name}</span>
          <span class="sheet-card-sub">${card.category || card.sub || ''}</span>
        </div>
        ${card.hp ? `<span class="sheet-card-hp">HP${card.hp}</span>` : ''}
      </div>

      <div class="grid">
        <button class="btn green wide" onclick="playHandCardByIndex(${handIdx}); closeMenu();">🃏 使用カードエリアへ (使う)</button>
        ${!state.myActive ? `<button class="btn blue wide" onclick="placeHandCardToActive(${handIdx}); closeMenu();">⚔️ バトル場に出す</button>` : ''}
        ${isBasicOrPk ? `<button class="btn blue wide" onclick="placeHandCardToFirstEmptyBench(${handIdx}); closeMenu();">🪑 ベンチに出す</button>` : ''}
        ${isStadium ? `<button class="btn purple wide" onclick="placeHandCardToStadium(${handIdx}); closeMenu();">🏟️ スタジアムとして場に出す</button>` : ''}
        ${isEnergy && targetButtons ? `<div style="grid-column:span 2; margin-top:4px;"><small style="color:#ffd84a; font-weight:bold;">⚡ エネルギーをつける対象:</small><div class="grid" style="margin-top:4px;">${targetButtons}</div></div>` : ''}
        ${isTool && toolButtons ? `<div style="grid-column:span 2; margin-top:4px;"><small style="color:#60a5fa; font-weight:bold;">🎒 どうぐをつける対象:</small><div class="grid" style="margin-top:4px;">${toolButtons}</div></div>` : ''}
        ${!isEnergy && !isTool && targetButtons ? `<div style="grid-column:span 2; margin-top:4px;"><small style="color:#94a3b8;">カードをポケモンにつける:</small><div class="grid" style="margin-top:4px;">${targetButtons}</div></div>` : ''}
        <button class="btn red" onclick="trashHandCardByIndex(${handIdx}); closeMenu();">🗑️ トラッシュする</button>
        <button class="btn purple" onclick="lostHandCardByIndex(${handIdx}); closeMenu();">🌌 ロストへ送る</button>
        <button class="btn" onclick="moveHandCardToDeckTop(${handIdx}); closeMenu();">🔄 山札の上に戻す</button>
        <button class="btn" onclick="moveHandCardToDeckBottom(${handIdx}); closeMenu();">⬇️ 山札の下に戻す</button>
        <button class="btn wide" onclick="closeMenu(); openCardZoomByUid('${card.uid}');">🔍 カードを拡大表示</button>
        <button class="btn wide" onclick="clearHandSelection(); closeMenu();">✖️ 選択解除して閉じる</button>
      </div>
    `;
  }
  // 2. 複数カード選択中：一括アクションメニュー
  else if (selectedCards.length > 1) {
    const count = selectedCards.length;
    handBodyEl.innerHTML = `
      <div class="sheet-card-preview selected-banner">
        <div>
          <span class="sheet-card-name">複数選択: ${count}枚</span>
          <span class="sheet-card-sub">${selectedCards.map(s => s.card.name).slice(0, 3).join(", ")}${count > 3 ? '...' : ''}</span>
        </div>
      </div>
      <div class="grid">
        <button class="btn blue wide" onclick="placeSelectedHandToBench(); closeMenu();">🪑 選択したポケモンをベンチに出す</button>
        <button class="btn red" onclick="trashSelectedHandCards(); closeMenu();">🗑️ ${count}枚トラッシュ</button>
        <button class="btn purple" onclick="lostSelectedHandCards(); closeMenu();">🌌 ${count}枚ロストへ</button>
        <button class="btn" onclick="moveSelectedHandCardsToDeckTop(); closeMenu();">🔄 ${count}枚山札の上に戻す</button>
        <button class="btn" onclick="moveSelectedHandCardsToDeckBottom(); closeMenu();">⬇️ ${count}枚山札の下に戻す</button>
        <button class="btn wide" onclick="clearHandSelection(); closeMenu();">✖️ 選択解除して閉じる</button>
      </div>
    `;
  }
  // 3. 未選択状態：案内と基本手札操作
  else {
    handBodyEl.innerHTML = `
      <div class="sheet-empty-hint">
        💡 手札のカードをタップすると、カードごとの詳細メニュー（使う・場に出す・エネルギー付与など）が表示されます。
      </div>
      <div class="grid">
        <button class="btn green" data-action="draw" data-close="1">１枚引く</button>
        <button class="btn blue" data-action="viewDeck" data-close="1">山札を見る</button>
      </div>
    `;
  }
}

// =============================================================================
// 手札・場のカード操作ヘルパー
// =============================================================================
function toggleSelectHandCard(idx) {
  if (state.selectedHandIndices.has(idx)) {
    state.selectedHandIndices.delete(idx);
  } else {
    state.selectedHandIndices.add(idx);
  }
  if (state.selectedHandIndices.size === 1) {
    state.selectedHandIndex = Array.from(state.selectedHandIndices)[0];
  } else {
    state.selectedHandIndex = -1;
  }
  renderHand();
  updateSheetUI();
}

function selectHandCard(idx) {
  toggleSelectHandCard(idx);
}

function clearHandSelection() {
  state.selectedHandIndices.clear();
  state.selectedHandIndex = -1;
  renderHand();
  updateSheetUI();
}

function placeHandCardToActive(handIdx) {
  if (handIdx < 0 || handIdx >= state.myHand.length) return;
  const card = state.myHand[handIdx];
  if (!card) return;

  if (state.myActive) {
    attachHandCardToPokemon(handIdx, "active");
    return;
  }

  state.myHand.splice(handIdx, 1);
  state.selectedHandIndices.clear();
  state.selectedHandIndex = -1;
  state.myActive = createFieldPokemon(card, 0, [], null);
  addLog(`「${card.name}」をバトル場に出しました`);
  showToast(`【バトル場へ】${card.name}`);
  renderAll();
}

function placeHandCardToBenchIndex(handIdx, benchIdx) {
  if (handIdx < 0 || handIdx >= state.myHand.length) return;
  if (benchIdx < 0 || benchIdx >= 5) return;
  const card = state.myHand[handIdx];
  if (!card) return;

  if (state.myBench[benchIdx]) {
    attachHandCardToPokemon(handIdx, `bench_${benchIdx}`);
    return;
  }

  state.myHand.splice(handIdx, 1);
  state.selectedHandIndices.clear();
  state.selectedHandIndex = -1;
  state.myBench[benchIdx] = createFieldPokemon(card, 0, [], null);
  addLog(`「${card.name}」をベンチに出しました`);
  showToast(`【ベンチへ】${card.name}`);
  renderAll();
}

function placeHandCardToFirstEmptyBench(handIdx) {
  const emptyIdx = state.myBench.findIndex(b => b === null);
  if (emptyIdx === -1) {
    return alert("ベンチに空きがありません（最大5匹）");
  }
  placeHandCardToBenchIndex(handIdx, emptyIdx);
}

function placeHandCardToStadium(handIdx) {
  if (handIdx < 0 || handIdx >= state.myHand.length) return;
  const card = state.myHand.splice(handIdx, 1)[0];
  state.selectedHandIndices.clear();
  state.selectedHandIndex = -1;

  if (state.stadium) {
    state.myTrash.push(state.stadium);
    addLog(`前のスタジアム「${state.stadium.name}」がトラッシュされました`);
  }
  state.stadium = card;
  addLog(`手札からスタジアム「${card.name}」を場に出しました`);
  showToast(`スタジアム: ${card.name}`);
  renderAll();
}

function attachHandCardToPokemon(handIdx, location) {
  if (handIdx < 0 || handIdx >= state.myHand.length) return;
  const dst = getPokemonByLocation(location);
  if (!dst) return;
  const card = state.myHand[handIdx];
  if (!card) return;

  // エネルギーカード
  if (card.type === "energy" || (card.name && card.name.includes("エネルギー"))) {
    state.myHand.splice(handIdx, 1);
    state.selectedHandIndices.clear();
    state.selectedHandIndex = -1;
    if (!dst.energies) dst.energies = [];
    dst.energies.push(card);
    addLog(`「${dst.card.name}」に「${card.name}」をつけました`);
    showToast(`【エネ付与】${dst.card.name} ← ${card.name}`);
    renderAll();
    return;
  }

  // ポケモンのどうぐ
  if (card.sub === "ポケモンのどうぐ" || (card.name && (card.name.includes("ハチマキ") || card.name.includes("封印石") || card.name.includes("おまもり")))) {
    if (dst.tool) {
      if (!confirm(`「${dst.card.name}」には既に「${dst.tool.name}」がついています。付け替えますか？（前のどうぐはトラッシュされます）`)) {
        return;
      }
      state.myTrash.push(dst.tool);
      addLog(`前のどうぐ「${dst.tool.name}」をトラッシュしました`);
    }
    state.myHand.splice(handIdx, 1);
    state.selectedHandIndices.clear();
    state.selectedHandIndex = -1;
    dst.tool = card;
    addLog(`「${dst.card.name}」にポケモンのどうぐ「${card.name}」をつけました`);
    showToast(`【どうぐ装備】${dst.card.name} ← ${card.name}`);
    renderAll();
    return;
  }

  // 進化
  if (card.category === "1進化" || card.category === "2進化") {
    const prevName = dst.card.name;
    dst.card = card;
    state.myHand.splice(handIdx, 1);
    state.selectedHandIndices.clear();
    state.selectedHandIndex = -1;
    addLog(`「${prevName}」が「${card.name}」に進化しました！`);
    showToast(`【進化】${card.name}！`);
    renderAll();
    return;
  }

  // その他のカード
  if (confirm(`「${card.name}」を「${dst.card.name}」にエネルギーとしてつけますか？`)) {
    state.myHand.splice(handIdx, 1);
    state.selectedHandIndices.clear();
    state.selectedHandIndex = -1;
    if (!dst.energies) dst.energies = [];
    dst.energies.push(card);
    addLog(`「${dst.card.name}」に「${card.name}」をつけました`);
    showToast(`【エネ付与】${dst.card.name} ← ${card.name}`);
    renderAll();
  }
}

function trashHandCardByIndex(handIdx) {
  if (handIdx < 0 || handIdx >= state.myHand.length) return;
  const card = state.myHand.splice(handIdx, 1)[0];
  state.selectedHandIndices.clear();
  state.selectedHandIndex = -1;
  state.myTrash.push(card);
  addLog(`手札から「${card.name}」をトラッシュしました`);
  showToast(`トラッシュ: ${card.name}`);
  renderAll();
}

function lostHandCardByIndex(handIdx) {
  if (handIdx < 0 || handIdx >= state.myHand.length) return;
  const card = state.myHand.splice(handIdx, 1)[0];
  state.selectedHandIndices.clear();
  state.selectedHandIndex = -1;
  state.myLost.push(card);
  addLog(`手札から「${card.name}」をロストゾーンへ送りました`);
  showToast(`ロストへ: ${card.name}`);
  renderAll();
}

function moveHandCardToDeckTop(handIdx) {
  if (handIdx < 0 || handIdx >= state.myHand.length) return;
  const card = state.myHand.splice(handIdx, 1)[0];
  state.selectedHandIndices.clear();
  state.selectedHandIndex = -1;
  state.myDeck.unshift(card);
  addLog(`手札から「${card.name}」を山札の上に戻しました`);
  showToast(`山の上に戻す: ${card.name}`);
  renderAll();
}

function moveHandCardToDeckBottom(handIdx) {
  if (handIdx < 0 || handIdx >= state.myHand.length) return;
  const card = state.myHand.splice(handIdx, 1)[0];
  state.selectedHandIndices.clear();
  state.selectedHandIndex = -1;
  state.myDeck.push(card);
  addLog(`手札から「${card.name}」を山札の下に戻しました`);
  showToast(`山の下に戻す: ${card.name}`);
  renderAll();
}

function trashSelectedHandCards() {
  const indices = getSelectedHandIndices();
  if (indices.length === 0) return;
  const names = [];
  indices.forEach(idx => {
    const c = state.myHand.splice(idx, 1)[0];
    state.myTrash.push(c);
    names.push(c.name);
  });
  state.selectedHandIndices.clear();
  state.selectedHandIndex = -1;
  addLog(`手札から${names.length}枚（${names.join(", ")}）をトラッシュしました`);
  showToast(`トラッシュ: ${names.length}枚`);
  renderAll();
}

function lostSelectedHandCards() {
  const indices = getSelectedHandIndices();
  if (indices.length === 0) return;
  const names = [];
  indices.forEach(idx => {
    const c = state.myHand.splice(idx, 1)[0];
    state.myLost.push(c);
    names.push(c.name);
  });
  state.selectedHandIndices.clear();
  state.selectedHandIndex = -1;
  addLog(`手札から${names.length}枚（${names.join(", ")}）をロストゾーンへ送りました`);
  showToast(`ロストへ: ${names.length}枚`);
  renderAll();
}

function moveSelectedHandCardsToDeckTop() {
  const indices = getSelectedHandIndices();
  if (indices.length === 0) return;
  const cards = [];
  indices.forEach(idx => {
    cards.push(state.myHand.splice(idx, 1)[0]);
  });
  cards.reverse().forEach(c => state.myDeck.unshift(c));
  state.selectedHandIndices.clear();
  state.selectedHandIndex = -1;
  addLog(`手札から${cards.length}枚を山札の上に戻しました`);
  showToast(`山の上に戻す: ${cards.length}枚`);
  renderAll();
}

function moveSelectedHandCardsToDeckBottom() {
  const indices = getSelectedHandIndices();
  if (indices.length === 0) return;
  const cards = [];
  indices.forEach(idx => {
    cards.push(state.myHand.splice(idx, 1)[0]);
  });
  cards.forEach(c => state.myDeck.push(c));
  state.selectedHandIndices.clear();
  state.selectedHandIndex = -1;
  addLog(`手札から${cards.length}枚を山札の下に戻しました`);
  showToast(`山の下に戻す: ${cards.length}枚`);
  renderAll();
}

function moveEnergyBetweenPokemon(srcLoc, energyIdx, dstLoc) {
  const src = getPokemonByLocation(srcLoc);
  const dst = getPokemonByLocation(dstLoc);
  if (!src || !dst || src === dst) return;
  if (!src.energies || energyIdx < 0 || energyIdx >= src.energies.length) return;
  const energy = src.energies.splice(energyIdx, 1)[0];
  if (energy) {
    if (!dst.energies) dst.energies = [];
    dst.energies.push(energy);
    addLog(`エネルギー「${energy.name}」を「${src.card.name}」から「${dst.card.name}」へ付け替えました`);
    showToast(`【エネ移動】${dst.card.name} ← ${energy.name}`);
    renderAll();
  }
}

function detachEnergyToTrash(loc, energyIdx) {
  const pk = getPokemonByLocation(loc);
  if (!pk || !pk.energies || energyIdx < 0 || energyIdx >= pk.energies.length) return;
  const energy = pk.energies.splice(energyIdx, 1)[0];
  if (energy) {
    state.myTrash.push(energy);
    addLog(`「${pk.card.name}」からエネルギー「${energy.name}」をトラッシュしました`);
    showToast(`エネトラッシュ: ${energy.name}`);
    renderAll();
  }
}

function getDroppedHandIndex(e) {
  let handIdx = state.draggedHandIndex;
  if (e && e.dataTransfer) {
    const raw = e.dataTransfer.getData("text/plain");
    if (raw !== "" && !raw.startsWith("energy:") && raw !== "playCard" && !isNaN(parseInt(raw, 10))) {
      handIdx = parseInt(raw, 10);
    }
  }
  if (handIdx >= 0 && handIdx < state.myHand.length) {
    return handIdx;
  }
  return null;
}

function handleDropToTrash(e) {
  if (state.draggedEnergy) {
    detachEnergyToTrash(state.draggedEnergy.location, state.draggedEnergy.energyIndex);
    state.draggedEnergy = null;
    return;
  }
  if (e && e.dataTransfer && e.dataTransfer.getData("text/plain") === "playCard") {
    movePlayCardToTrash();
    return;
  }
  const handIdx = getDroppedHandIndex(e);
  if (handIdx !== null) {
    trashHandCardByIndex(handIdx);
  }
}

function handleDropToLost(e) {
  if (e && e.dataTransfer && e.dataTransfer.getData("text/plain") === "playCard") {
    movePlayCardToLost();
    return;
  }
  const handIdx = getDroppedHandIndex(e);
  if (handIdx !== null) {
    lostHandCardByIndex(handIdx);
  }
}

// =============================================================================
// タッチ操作用 ドラッグ＆ドロップ エンジン (スマホ対応)
// =============================================================================
const touchDrag = {
  active: false,
  isDragging: false,
  type: null,
  data: null,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  avatarEl: null,
  currentHoverEl: null,
  sourceEl: null
};

function initTouchDragEngine() {
  const gameEl = document.getElementById("game");
  if (!gameEl) return;

  gameEl.addEventListener("touchstart", (e) => {
    if (e.target.closest("button") || e.target.closest(".sp-sheet") || e.target.closest(".modal") || e.target.closest(".ctx-menu")) {
      return;
    }

    const energyBadge = e.target.closest(".energy-badge");
    if (energyBadge && energyBadge.dataset.location && energyBadge.dataset.energyIdx !== undefined) {
      const loc = energyBadge.dataset.location;
      const eIdx = parseInt(energyBadge.dataset.energyIdx, 10);
      initTouchDragStart(e, "energy", { location: loc, energyIndex: eIdx }, energyBadge);
      return;
    }

    const handCard = e.target.closest("#hand .card");
    if (handCard && handCard.dataset.index !== undefined) {
      const idx = parseInt(handCard.dataset.index, 10);
      if (!isNaN(idx)) {
        initTouchDragStart(e, "hand", { handIdx: idx }, handCard);
        return;
      }
    }

    const playCard = e.target.closest("#play-card-wrap .card");
    if (playCard && state.playCard) {
      initTouchDragStart(e, "playCard", {}, playCard);
      return;
    }

    const stadiumCard = e.target.closest("#stadium .card");
    if (stadiumCard && state.stadium) {
      initTouchDragStart(e, "stadium", {}, stadiumCard);
      return;
    }
  }, { passive: false });

  window.addEventListener("touchmove", handleTouchMove, { passive: false });
  window.addEventListener("touchend", handleTouchEnd, { passive: false });
  window.addEventListener("touchcancel", handleTouchCancel);
}

function initTouchDragStart(e, type, data, sourceEl) {
  if (!e.touches || e.touches.length === 0) return;
  const touch = e.touches[0];
  touchDrag.active = true;
  touchDrag.isDragging = false;
  touchDrag.type = type;
  touchDrag.data = data;
  touchDrag.sourceEl = sourceEl;
  touchDrag.startX = touch.clientX;
  touchDrag.startY = touch.clientY;
  touchDrag.currentX = touch.clientX;
  touchDrag.currentY = touch.clientY;
  touchDrag.currentHoverEl = null;
}

function handleTouchMove(e) {
  if (!touchDrag.active || !e.touches || e.touches.length === 0) return;
  const touch = e.touches[0];
  touchDrag.currentX = touch.clientX;
  touchDrag.currentY = touch.clientY;
  const dx = touch.clientX - touchDrag.startX;
  const dy = touch.clientY - touchDrag.startY;

  if (!touchDrag.isDragging) {
    if (Math.hypot(dx, dy) >= 8) {
      touchDrag.isDragging = true;
      createTouchAvatar();
      if (touchDrag.type === "hand" && touchDrag.data) {
        state.draggedHandIndex = touchDrag.data.handIdx;
      } else if (touchDrag.type === "energy" && touchDrag.data) {
        state.draggedEnergy = touchDrag.data;
      }
    } else {
      return;
    }
  }

  if (e.cancelable) {
    e.preventDefault();
  }

  if (touchDrag.avatarEl) {
    touchDrag.avatarEl.style.left = `${touch.clientX}px`;
    touchDrag.avatarEl.style.top = `${touch.clientY}px`;
  }

  updateTouchHover(touch.clientX, touch.clientY);
}

function handleTouchEnd(e) {
  if (!touchDrag.active) return;

  const wasDragging = touchDrag.isDragging;
  const finalX = touchDrag.currentX;
  const finalY = touchDrag.currentY;
  const dragType = touchDrag.type;
  const dragData = touchDrag.data;

  cleanupTouchDrag();

  if (wasDragging) {
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();

    const hitEl = document.elementFromPoint(finalX, finalY);
    const dropTarget = resolveDropTarget(hitEl, dragType, dragData);
    if (dropTarget) {
      executeDropAction(dropTarget, dragType, dragData);
    }
  }

  touchDrag.active = false;
  touchDrag.isDragging = false;
  touchDrag.type = null;
  touchDrag.data = null;
  touchDrag.sourceEl = null;
  state.draggedHandIndex = -1;
  state.draggedEnergy = null;
}

function handleTouchCancel() {
  cleanupTouchDrag();
  touchDrag.active = false;
  touchDrag.isDragging = false;
  touchDrag.type = null;
  touchDrag.data = null;
  state.draggedHandIndex = -1;
  state.draggedEnergy = null;
}

function createTouchAvatar() {
  if (touchDrag.avatarEl) touchDrag.avatarEl.remove();
  const avatar = document.createElement("div");
  avatar.className = "touch-drag-avatar";

  if (touchDrag.type === "hand" && touchDrag.data) {
    const card = state.myHand[touchDrag.data.handIdx];
    if (card) {
      avatar.innerHTML = `
        <div class="card ${card.color}" style="width:72px; height:98px; pointer-events:none; margin:0;">
          <div class="card-top"><span class="name" style="font-size:10px;">${card.name}</span></div>
          <div class="card-btm"><span style="font-size:9px;">${card.sub || card.category || ''}</span></div>
        </div>
      `;
    }
  } else if (touchDrag.type === "energy" && touchDrag.data) {
    const pk = getPokemonByLocation(touchDrag.data.location);
    const energy = pk && pk.energies ? pk.energies[touchDrag.data.energyIndex] : null;
    const info = energy ? getEnergyInfo(energy) : { bg: "#eab308", border: "#fde047", icon: "⚡" };
    avatar.innerHTML = `
      <div class="energy-badge" style="width:34px; height:34px; font-size:18px; background:${info.bg}; border-color:${info.border};">
        ${info.icon}
      </div>
    `;
  } else if (touchDrag.type === "playCard" && state.playCard) {
    avatar.innerHTML = `
      <div class="card ${state.playCard.color}" style="width:72px; height:98px; pointer-events:none; margin:0;">
        <div class="card-top"><span class="name" style="font-size:10px;">${state.playCard.name}</span></div>
      </div>
    `;
  } else if (touchDrag.type === "stadium" && state.stadium) {
    avatar.innerHTML = `
      <div class="card trainer" style="width:72px; height:98px; pointer-events:none; margin:0;">
        <div class="card-top"><span class="name" style="font-size:10px;">${state.stadium.name}</span></div>
      </div>
    `;
  }

  avatar.style.left = `${touchDrag.startX}px`;
  avatar.style.top = `${touchDrag.startY}px`;
  document.body.appendChild(avatar);
  touchDrag.avatarEl = avatar;
}

function resolveDropTarget(hitEl, dragType, dragData) {
  if (!hitEl) return null;

  if (dragType === "hand") {
    if (hitEl.closest("#play-area")) return { type: "play-area" };
    if (hitEl.closest("#stadium") || hitEl.closest(".stadium-spot")) return { type: "stadium" };

    const activeSpot = hitEl.closest("#my-active");
    if (activeSpot) {
      if (state.myActive) return { type: "pokemon", location: "active" };
      return { type: "empty-active" };
    }

    const benchContainer = hitEl.closest("#my-bench");
    if (benchContainer) {
      const benchItem = hitEl.closest("[data-bench-index]");
      if (benchItem && benchItem.dataset.benchIndex !== undefined) {
        const bIdx = parseInt(benchItem.dataset.benchIndex, 10);
        if (state.myBench[bIdx]) {
          return { type: "pokemon", location: `bench_${bIdx}` };
        } else {
          return { type: "empty-bench", benchIndex: bIdx };
        }
      }
      const firstEmpty = state.myBench.findIndex(b => b === null);
      if (firstEmpty !== -1) return { type: "empty-bench", benchIndex: firstEmpty };
    }

    if (hitEl.closest("#my-trash")) return { type: "trash" };
    if (hitEl.closest("#my-lost")) return { type: "lost" };
    if (hitEl.closest("#my-deck")) return { type: "deck" };
  }

  if (dragType === "energy") {
    const activeSpot = hitEl.closest("#my-active");
    if (activeSpot && state.myActive) return { type: "pokemon-energy", location: "active" };

    const benchItem = hitEl.closest("#my-bench [data-bench-index]");
    if (benchItem && benchItem.dataset.benchIndex !== undefined) {
      const bIdx = parseInt(benchItem.dataset.benchIndex, 10);
      if (state.myBench[bIdx]) return { type: "pokemon-energy", location: `bench_${bIdx}` };
    }

    if (hitEl.closest("#my-trash")) return { type: "trash-energy" };
  }

  if (dragType === "playCard") {
    if (hitEl.closest("#my-trash")) return { type: "play-trash" };
    if (hitEl.closest(".hand-area") || hitEl.closest("#hand")) return { type: "play-hand" };
    if (hitEl.closest("#stadium") || hitEl.closest(".stadium-spot")) return { type: "play-stadium" };
    if (hitEl.closest("#my-lost")) return { type: "play-lost" };
  }

  if (dragType === "stadium") {
    if (hitEl.closest("#my-trash")) return { type: "stadium-trash" };
  }

  return null;
}

function updateTouchHover(x, y) {
  if (touchDrag.avatarEl) touchDrag.avatarEl.style.display = "none";
  const hitEl = document.elementFromPoint(x, y);
  if (touchDrag.avatarEl) touchDrag.avatarEl.style.display = "block";

  const dropTarget = resolveDropTarget(hitEl, touchDrag.type, touchDrag.data);
  let targetEl = null;

  if (dropTarget) {
    if (dropTarget.type === "play-area") targetEl = document.getElementById("play-area");
    else if (dropTarget.type === "stadium") targetEl = document.getElementById("stadium");
    else if (dropTarget.type === "empty-active" || dropTarget.location === "active") targetEl = document.getElementById("my-active");
    else if (dropTarget.type === "empty-bench") {
      targetEl = document.querySelector(`#my-bench [data-bench-index="${dropTarget.benchIndex}"]`) || document.getElementById("my-bench");
    } else if (dropTarget.location && dropTarget.location.startsWith("bench_")) {
      const bIdx = dropTarget.location.replace("bench_", "");
      targetEl = document.querySelector(`#my-bench [data-bench-index="${bIdx}"]`) || document.getElementById("my-bench");
    } else if (dropTarget.type === "trash" || dropTarget.type === "trash-energy" || dropTarget.type === "play-trash" || dropTarget.type === "stadium-trash") {
      targetEl = document.getElementById("my-trash");
    } else if (dropTarget.type === "lost" || dropTarget.type === "play-lost") {
      targetEl = document.getElementById("my-lost");
    } else if (dropTarget.type === "deck") {
      targetEl = document.getElementById("my-deck");
    } else if (dropTarget.type === "play-hand") {
      targetEl = document.getElementById("hand");
    }
  }

  if (targetEl !== touchDrag.currentHoverEl) {
    if (touchDrag.currentHoverEl) {
      touchDrag.currentHoverEl.classList.remove("touch-drop-hover", "drag-target", "drag-over");
    }
    if (targetEl) {
      targetEl.classList.add("touch-drop-hover");
    }
    touchDrag.currentHoverEl = targetEl;
  }
}

function executeDropAction(dropTarget, dragType, dragData) {
  if (dragType === "hand") {
    const handIdx = dragData.handIdx;
    if (handIdx < 0 || handIdx >= state.myHand.length) return;

    if (dropTarget.type === "play-area") {
      playHandCardByIndex(handIdx);
    } else if (dropTarget.type === "stadium") {
      placeHandCardToStadium(handIdx);
    } else if (dropTarget.type === "empty-active") {
      placeHandCardToActive(handIdx);
    } else if (dropTarget.type === "empty-bench") {
      placeHandCardToBenchIndex(handIdx, dropTarget.benchIndex);
    } else if (dropTarget.type === "pokemon") {
      attachHandCardToPokemon(handIdx, dropTarget.location);
    } else if (dropTarget.type === "trash") {
      trashHandCardByIndex(handIdx);
    } else if (dropTarget.type === "lost") {
      lostHandCardByIndex(handIdx);
    } else if (dropTarget.type === "deck") {
      moveHandCardToDeckBottom(handIdx);
    }
  } else if (dragType === "energy") {
    const srcLoc = dragData.location;
    const eIdx = dragData.energyIndex;
    if (dropTarget.type === "pokemon-energy") {
      moveEnergyBetweenPokemon(srcLoc, eIdx, dropTarget.location);
    } else if (dropTarget.type === "trash-energy") {
      detachEnergyToTrash(srcLoc, eIdx);
    }
  } else if (dragType === "playCard") {
    if (dropTarget.type === "play-trash") movePlayCardToTrash();
    else if (dropTarget.type === "play-hand") movePlayCardToHand();
    else if (dropTarget.type === "play-stadium") movePlayCardToStadium();
    else if (dropTarget.type === "play-lost") movePlayCardToLost();
  } else if (dragType === "stadium") {
    if (dropTarget.type === "stadium-trash") {
      if (state.stadium) {
        state.myTrash.push(state.stadium);
        addLog(`スタジアム「${state.stadium.name}」がトラッシュされました`);
        state.stadium = null;
        renderAll();
      }
    }
  }
}

function cleanupTouchDrag() {
  if (touchDrag.avatarEl) {
    touchDrag.avatarEl.remove();
    touchDrag.avatarEl = null;
  }
  if (touchDrag.currentHoverEl) {
    touchDrag.currentHoverEl.classList.remove("touch-drop-hover", "drag-target", "drag-over");
    touchDrag.currentHoverEl = null;
  }
  document.querySelectorAll(".touch-drop-hover, .drag-target, .drag-over").forEach(el => {
    el.classList.remove("touch-drop-hover", "drag-target", "drag-over");
  });
}

// グローバル参照エクスポート（インライン onclick 等から呼び出し可能にする）
window.isMobileMode = isMobileMode;
window.selectHandCardAndOpenMenu = selectHandCardAndOpenMenu;
window.placeHandCardToActive = placeHandCardToActive;
window.placeHandCardToBenchIndex = placeHandCardToBenchIndex;
window.placeHandCardToFirstEmptyBench = placeHandCardToFirstEmptyBench;
window.placeHandCardToStadium = placeHandCardToStadium;
window.attachHandCardToPokemon = attachHandCardToPokemon;
window.trashHandCardByIndex = trashHandCardByIndex;
window.lostHandCardByIndex = lostHandCardByIndex;
window.moveHandCardToDeckTop = moveHandCardToDeckTop;
window.moveHandCardToDeckBottom = moveHandCardToDeckBottom;
window.trashSelectedHandCards = trashSelectedHandCards;
window.lostSelectedHandCards = lostSelectedHandCards;
window.moveSelectedHandCardsToDeckTop = moveSelectedHandCardsToDeckTop;
window.moveSelectedHandCardsToDeckBottom = moveSelectedHandCardsToDeckBottom;
window.clearHandSelection = clearHandSelection;
window.moveEnergyBetweenPokemon = moveEnergyBetweenPokemon;
window.detachEnergyToTrash = detachEnergyToTrash;
window.openMenu = () => actions.openMenu();
window.closeMenu = () => closeMenu();

function drawCardToTemp() {
  if (state.myDeck.length === 0) {
    return alert("山札がありません！");
  }
  const card = state.myDeck.shift();
  state.tempCards.push(card);
  addLog(`山札からカードを1枚引きました（テンポラリエリアへ）`);
  showToast(`「${card.name}」を引きました`);
  renderAll();
}

function moveTempToHand() {
  if (state.tempCards.length === 0) return;
  const cards = state.tempCards.splice(0);
  cards.forEach(c => state.myHand.push(c));
  addLog(`テンポラリから手札に加えました（${cards.map(c=>c.name).join(", ")}）`);
  showToast("手札に加えました");
  renderAll();
}

function moveTempToBottom() {
  if (state.tempCards.length === 0) return;
  const cards = state.tempCards.splice(0);
  cards.forEach(c => state.myDeck.push(c)); // ボトムへ追加
  addLog(`テンポラリからカードを山札の下へ戻しました`);
  showToast("山札の下へ戻しました");
  renderAll();
}

function trashDeckTop() {
  if (state.myDeck.length === 0) return alert("山札がありません");
  const card = state.myDeck.shift();
  state.myTrash.push(card);
  addLog(`山札の上から1枚トラッシュしました: ${card.name}`);
  showToast(`山札からトラッシュ: ${card.name}`);
  renderAll();
}

function shuffleMyDeck() {
  state.myDeck = shuffleArray(state.myDeck);
  addLog(`山札をシャッフルしました`);
  showToast("山札をシャッフルしました");
  renderAll();
}

function takePrize(idx) {
  if (idx < 0 || idx >= state.myPrizes.length) return;
  const card = state.myPrizes.splice(idx, 1)[0];
  state.myHand.push(card);
  addLog(`サイドを1枚取り、手札に加えました: ${card.name}`);
  showToast(`サイド取得: ${card.name}`);
  if (state.myPrizes.length === 0) {
    alert("🎉 おめでとうございます！サイドをすべて取りきりました！");
  }
  renderAll();
}

// 手札操作（複数選択対応）
function getSelectedCard() {
  const selectedCards = getSelectedHandCards();
  if (selectedCards.length === 0) {
    alert("手札のカードをタップ/クリックして選択してください");
    return null;
  }
  return selectedCards[0].card;
}

function moveSelectedHandToDeck() {
  const indices = getSelectedHandIndices();
  if (indices.length === 0) {
    return alert("手札のカードをタップ/クリックして選択してください");
  }
  const movedCards = [];
  indices.forEach(idx => {
    const card = state.myHand.splice(idx, 1)[0];
    movedCards.push(card);
    state.myDeck.push(card);
  });
  state.myDeck = shuffleArray(state.myDeck);
  state.selectedHandIndices.clear();
  const names = movedCards.map(c => c.name).join(", ");
  addLog(`手札から${movedCards.length}枚（${names}）を山札に戻してシャッフルしました`);
  showToast(`山札に戻しました (${movedCards.length}枚)`);
  renderAll();
}

function moveSelectedHandToBottom() {
  const indices = getSelectedHandIndices();
  if (indices.length === 0) {
    return alert("手札のカードをタップ/クリックして選択してください");
  }
  const movedCards = [];
  indices.forEach(idx => {
    const card = state.myHand.splice(idx, 1)[0];
    movedCards.push(card);
    state.myDeck.push(card);
  });
  state.selectedHandIndices.clear();
  const names = movedCards.map(c => c.name).join(", ");
  addLog(`手札から${movedCards.length}枚（${names}）を山札の下に戻しました`);
  showToast(`山札の下へ戻しました (${movedCards.length}枚)`);
  renderAll();
}

function trashSelectedHand() {
  const indices = getSelectedHandIndices();
  if (indices.length === 0) {
    return alert("手札のカードをタップ/クリックして選択してください");
  }
  const movedCards = [];
  indices.forEach(idx => {
    const card = state.myHand.splice(idx, 1)[0];
    movedCards.push(card);
    state.myTrash.push(card);
  });
  state.selectedHandIndices.clear();
  const names = movedCards.map(c => c.name).join(", ");
  addLog(`手札から${movedCards.length}枚（${names}）をトラッシュしました`);
  showToast(`トラッシュ: ${names}`);
  renderAll();
}

function moveSelectedHandToLost() {
  const indices = getSelectedHandIndices();
  if (indices.length === 0) {
    return alert("手札のカードをタップ/クリックして選択してください");
  }
  const movedCards = [];
  indices.forEach(idx => {
    const card = state.myHand.splice(idx, 1)[0];
    movedCards.push(card);
    state.myLost.push(card);
  });
  state.selectedHandIndices.clear();
  const names = movedCards.map(c => c.name).join(", ");
  addLog(`手札から${movedCards.length}枚（${names}）をロストゾーンへ送りました`);
  showToast(`ロストへ送る: ${names}`);
  renderAll();
}

function placeSelectedHandToBench() {
  const indices = getSelectedHandIndices();
  if (indices.length === 0) {
    return alert("手札のカードをタップ/クリックして選択してください");
  }

  // 空きベンチ枠を探す
  const emptySlots = [];
  state.myBench.forEach((b, i) => {
    if (b === null) emptySlots.push(i);
  });

  if (emptySlots.length === 0) {
    return alert("ベンチに空きがありません（最大5匹）");
  }

  // 選択順（元の手札順、昇順）で配置
  const ascIndices = Array.from(state.selectedHandIndices)
    .filter(i => i >= 0 && i < state.myHand.length)
    .sort((a, b) => a - b);

  const toPlaceCount = Math.min(ascIndices.length, emptySlots.length);
  const targetIndices = ascIndices.slice(0, toPlaceCount);
  const placedNames = [];

  targetIndices.forEach((handIdx, i) => {
    const benchSlot = emptySlots[i];
    const card = state.myHand[handIdx];
    state.myBench[benchSlot] = createFieldPokemon(card, 0, [], null);
    placedNames.push(card.name);
  });

  // 削除は降順で行う
  targetIndices.sort((a, b) => b - a).forEach(idx => {
    state.myHand.splice(idx, 1);
  });

  state.selectedHandIndices.clear();
  addLog(`ベンチに${placedNames.length}匹（${placedNames.join(", ")}）を出しました`);
  showToast(`ベンチへ: ${placedNames.join(", ")}`);
  renderAll();
}

function playHandCardByIndex(idx) {
  if (idx < 0 || idx >= state.myHand.length) return;

  if (state.playCard) {
    return alert("使用カードエリアにカードがあります。先に前のカードを処理してください。");
  }

  const card = state.myHand.splice(idx, 1)[0];
  state.playCard = card;
  state.selectedHandIndices.clear();

  // 相手・全体への通知
  const msg = `${state.myName} が「${card.name}」を使用しました`;
  addLog(msg);
  showToast(`【使用】${card.name}`);

  renderAll();
}

function moveSelectedHandToPlayArea() {
  const indices = getSelectedHandIndices();
  if (indices.length === 0) return;
  // 複数選択されている場合は先頭の1枚を使用カードエリアへ
  playHandCardByIndex(indices[indices.length - 1]); // 昇順の先頭
}

function movePlayCardToTrash() {
  if (!state.playCard) return;
  const card = state.playCard;
  state.myTrash.push(card);
  state.playCard = null;
  addLog(`使用した「${card.name}」をトラッシュへ送りました`);
  showToast(`トラッシュ: ${card.name}`);
  renderAll();
}

function movePlayCardToHand() {
  if (!state.playCard) return;
  const card = state.playCard;
  state.myHand.push(card);
  state.playCard = null;
  addLog(`「${card.name}」を使用エリアから手札に戻しました`);
  showToast(`手札へ戻す: ${card.name}`);
  renderAll();
}

function movePlayCardToStadium() {
  if (!state.playCard) return;
  const card = state.playCard;
  if (state.stadium) {
    state.myTrash.push(state.stadium);
    addLog(`スタジアム「${state.stadium.name}」がトラッシュされました`);
  }
  state.stadium = card;
  state.playCard = null;
  addLog(`スタジアム「${card.name}」を場に出しました`);
  showToast(`スタジアム: ${card.name}`);
  renderAll();
}

function movePlayCardToLost() {
  if (!state.playCard) return;
  const card = state.playCard;
  state.myLost.push(card);
  state.playCard = null;
  addLog(`「${card.name}」をロストゾーンへ送りました`);
  showToast(`ロストへ: ${card.name}`);
  renderAll();
}

// カード拡大機能 (ダブルクリック - 表向きのすべてのカードが対象)
function openCardZoom(card) {
  if (!card) return;
  hideCtx();
  const modal = document.getElementById("card-zoom-modal");
  const content = document.getElementById("zoom-card-content");

  // このカードが場のポケモンか判定して、付加情報（どうぐ・エネルギー）を表示
  const fieldInfo = findPokemonByCardUid(card.uid);
  const pokemon = fieldInfo ? fieldInfo.pokemon : null;

  let attachmentHtml = "";
  if (pokemon) {
    const hasTool = !!pokemon.tool;
    const hasEnergies = pokemon.energies && pokemon.energies.length > 0;

    attachmentHtml = `
      <div class="zoom-attachments">
        <!-- ポケモンのどうぐ -->
        <div class="zoom-section">
          <div class="zoom-section-title">🎒 ポケモンのどうぐ</div>
          ${hasTool ? `
            <div class="zoom-tool-row">
              <span class="zoom-tool-name">🎒 ${pokemon.tool.name}</span>
              <button class="btn blue" style="font-size:10px; padding:2px 8px;" onclick="openCardZoomByUid('${pokemon.tool.uid}')">どうぐを拡大</button>
            </div>
          ` : `
            <div class="zoom-empty">（ポケモンのどうぐはついていません）</div>
          `}
        </div>

        <!-- ついているエネルギー -->
        <div class="zoom-section">
          <div class="zoom-section-title">⚡ ついているエネルギー (${pokemon.energies ? pokemon.energies.length : 0} 個)</div>
          ${hasEnergies ? `
            <div class="zoom-energy-list">
              ${pokemon.energies.map((energy, eIdx) => {
                const info = getEnergyInfo(energy);
                return `
                  <div class="zoom-energy-item" style="background:${info.bg}; border-color:${info.border};">
                    <span>${info.icon}</span>
                    <span>${energy.name}</span>
                  </div>
                `;
              }).join("")}
            </div>
          ` : `
            <div class="zoom-empty">（エネルギーはついていません）</div>
          `}
        </div>
      </div>
    `;
  }

  content.innerHTML = `
    <div class="card ${card.color || 'trainer'}">
      <div class="card-top">
        <span class="name" style="font-size:18px;">${card.name}</span>
        ${card.hp ? `<span class="hp" style="font-size:16px;">HP${card.hp}</span>` : ''}
      </div>
      <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; opacity:0.6; font-size:48px; gap:8px;">
        <span>🎴</span>
        <span style="font-size:14px; color:#cbd5e1; font-weight:normal;">[拡大表示中]</span>
      </div>
      <div class="card-btm" style="font-size:13px;">
        <span>${card.category || card.sub || 'カード'}</span>
        <span>${card.type || ''}</span>
      </div>
    </div>
    ${attachmentHtml}
  `;
  modal.classList.remove("hidden");
}

window.openCardZoomByUid = function(uid) {
  const card = cardRegistry.get(uid) || findCardByUid(uid);
  if (card) {
    openCardZoom(card);
  }
};

window.closeCardZoom = function() {
  document.getElementById("card-zoom-modal").classList.add("hidden");
};

function findCardByUid(uid) {
  if (!uid) return null;
  if (state.playCard && state.playCard.uid === uid) return state.playCard;
  if (state.myActive && state.myActive.card.uid === uid) return state.myActive.card;
  if (state.myActive && state.myActive.tool && state.myActive.tool.uid === uid) return state.myActive.tool;
  if (state.myActive && state.myActive.energies) {
    const e = state.myActive.energies.find(x => x.uid === uid);
    if (e) return e;
  }
  for (const b of state.myBench) {
    if (b) {
      if (b.card.uid === uid) return b.card;
      if (b.tool && b.tool.uid === uid) return b.tool;
      if (b.energies) {
        const e = b.energies.find(x => x.uid === uid);
        if (e) return e;
      }
    }
  }
  if (state.oppActive && state.oppActive.card.uid === uid) return state.oppActive.card;
  if (state.oppActive && state.oppActive.tool && state.oppActive.tool.uid === uid) return state.oppActive.tool;
  if (state.oppActive && state.oppActive.energies) {
    const e = state.oppActive.energies.find(x => x.uid === uid);
    if (e) return e;
  }
  for (const b of state.oppBench) {
    if (b) {
      if (b.card.uid === uid) return b.card;
      if (b.tool && b.tool.uid === uid) return b.tool;
      if (b.energies) {
        const e = b.energies.find(x => x.uid === uid);
        if (e) return e;
      }
    }
  }
  const handFound = state.myHand.find(c => c.uid === uid);
  if (handFound) return handFound;
  const tempFound = state.tempCards.find(c => c.uid === uid);
  if (tempFound) return tempFound;
  const trashFound = state.myTrash.find(c => c.uid === uid);
  if (trashFound) return trashFound;
  if (state.stadium && state.stadium.uid === uid) return state.stadium;
  return null;
}

// 場のポケモンコンテキストメニュー
function showPokemonMenu(e, location, index) {
  e.stopPropagation();
  const ctx = document.getElementById("ctx");
  const target = location === "active" ? state.myActive : state.myBench[index];
  if (!target) return;

  const locId = location === "active" ? "active" : `bench_${index}`;
  let extraBtns = "";

  // 手札選択中のカードがある場合、このポケモンにつける選択肢
  if (state.selectedHandIndex >= 0 && state.myHand[state.selectedHandIndex]) {
    const handCard = state.myHand[state.selectedHandIndex];
    extraBtns += `<button style="color:#60a5fa; font-weight:bold;" onclick="attachSelectedHandCard('${location}', ${index})">➕ 手札「${handCard.name}」をつける</button>`;
  }

  // どうぐが付いている場合、破棄する選択肢
  if (target.tool) {
    extraBtns += `<button onclick="detachTool('${locId}', 'trash')">🎒 どうぐ「${target.tool.name}」を破棄</button>`;
  }

  // エネルギーが付いている場合、全破棄する選択肢
  if (target.energies && target.energies.length > 0) {
    extraBtns += `<button onclick="detachAllEnergy('${locId}')">⚡ エネ全トラッシュ (${target.energies.length}枚)</button>`;
  }

  ctx.innerHTML = `
    <div style="font-size:11px; color:#94a3b8; padding:2px 8px;">${target.card.name} (ダメカン: ${target.damage})</div>
    <div class="divider"></div>
    <button onclick="modifyDamage('${location}', ${index}, 10)">ダメカン +10</button>
    <button onclick="modifyDamage('${location}', ${index}, -10)">ダメカン -10</button>
    <button onclick="modifyDamage('${location}', ${index}, 50)">ダメカン +50</button>
    <button onclick="modifyDamage('${location}', ${index}, -999)">ダメカン リセット</button>
    <div class="divider"></div>
    ${extraBtns}
    ${location === "bench" ? `<button onclick="swapActiveBench(${index})">バトル場と交代</button>` : ''}
    <button onclick="removePokemonToTrash('${location}', ${index})">トラッシュへ送る</button>
    <button onclick="removePokemonToHand('${location}', ${index})">手札に戻す</button>
  `;

  ctx.style.left = `${Math.min(e.clientX, window.innerWidth - 180)}px`;
  ctx.style.top = `${Math.min(e.clientY, window.innerHeight - 280)}px`;
  ctx.classList.remove("hidden");
}

function attachSelectedHandCard(location, index) {
  hideCtx();
  if (state.selectedHandIndex < 0 || state.selectedHandIndex >= state.myHand.length) return;
  const targetLoc = location === "active" ? "active" : `bench_${index}`;
  window.handlePokemonDrop({
    preventDefault: () => {},
    stopPropagation: () => {},
    dataTransfer: { getData: () => state.selectedHandIndex.toString() },
    currentTarget: null
  }, targetLoc);
}

function detachAllEnergy(location) {
  hideCtx();
  const pokemon = getPokemonByLocation(location);
  if (!pokemon || !pokemon.energies || pokemon.energies.length === 0) return;
  const count = pokemon.energies.length;
  while (pokemon.energies.length > 0) {
    state.myTrash.push(pokemon.energies.pop());
  }
  addLog(`「${pokemon.card.name}」のエネルギー${count}枚をすべてトラッシュしました`);
  showToast(`エネルギー全トラッシュ: ${count}枚`);
  renderAll();
}

function hideCtx() {
  document.getElementById("ctx").classList.add("hidden");
}

function modifyDamage(location, index, delta) {
  hideCtx();
  const target = location === "active" ? state.myActive : state.myBench[index];
  if (!target) return;
  if (delta === -999) {
    target.damage = 0;
  } else {
    target.damage = Math.max(0, target.damage + delta);
  }
  addLog(`${target.card.name} のダメカンを ${target.damage} に変更しました`);
  renderMyField();
}

function swapActiveBench(benchIndex) {
  hideCtx();
  const benchTarget = state.myBench[benchIndex];
  if (!benchTarget) return;

  const prevActive = state.myActive;
  state.myActive = benchTarget;
  state.myBench[benchIndex] = prevActive;

  addLog(`バトル場とベンチを交代しました（新バトル場: ${state.myActive.card.name}）`);
  showToast(`交代: ${state.myActive.card.name}`);
  renderMyField();
}

function removePokemonToTrash(location, index) {
  hideCtx();
  const target = location === "active" ? state.myActive : state.myBench[index];
  if (!target) return;

  state.myTrash.push(target.card);
  if (target.tool) state.myTrash.push(target.tool);
  if (target.energies) target.energies.forEach(e => state.myTrash.push(e));

  if (location === "active") state.myActive = null;
  else state.myBench[index] = null;

  addLog(`「${target.card.name}」（および付随カード）をトラッシュへ送りました`);
  showToast(`「${target.card.name}」をトラッシュへ送りました`);
  renderMyField();
}

function removePokemonToHand(location, index) {
  hideCtx();
  const target = location === "active" ? state.myActive : state.myBench[index];
  if (!target) return;

  state.myHand.push(target.card);
  if (target.tool) state.myTrash.push(target.tool);
  if (target.energies) target.energies.forEach(e => state.myTrash.push(e));

  if (location === "active") state.myActive = null;
  else state.myBench[index] = null;

  addLog(`「${target.card.name}」を手札に戻しました（どうぐ・エネルギーは破棄）`);
  showToast(`「${target.card.name}」を手札に戻しました`);
  renderAll();
}

// ターン進行 ＆ コイントス
function endTurn() {
  state.turn++;
  addLog(`ターンを終了しました（現在: ターン ${state.turn}）`, {
    action: "END_TURN",
    details: `ターン ${state.turn} へ進行`
  });

  if (state.isSoloMode) {
    swapSoloTurn();
  } else {
    showToast(`ターン ${state.turn} 開始！`);
    renderAll();
  }
}

function swapSoloTurn() {
  // 一人回し用: ターン終了ごとに上下（自分側と相手側）を完全に反転・交代
  // 1. 名前・プレイマットを入れ替え
  const tmpName = state.myName;
  state.myName = state.oppName;
  state.oppName = tmpName;

  const tmpMat = state.myMatId;
  state.myMatId = state.oppMatId;
  state.oppMatId = tmpMat;

  // 2. 山札・手札・サイド・トラッシュ・ロストを入れ替え
  const tmpDeck = state.myDeck;
  state.myDeck = state.oppDeck;
  state.oppDeck = tmpDeck;
  state.oppDeckCount = state.oppDeck.length;

  const tmpHand = state.myHand;
  state.myHand = state.oppHand;
  state.oppHand = tmpHand;
  state.oppHandCount = state.oppHand.length;

  const tmpPrizes = state.myPrizes;
  state.myPrizes = state.oppPrizesList;
  state.oppPrizesList = tmpPrizes;
  state.oppPrizes = state.oppPrizesList.length;

  const tmpTrash = state.myTrash;
  state.myTrash = state.oppTrash;
  state.oppTrash = tmpTrash;

  const tmpLost = state.myLost;
  state.myLost = state.oppLost;
  state.oppLost = tmpLost;
  state.oppLostCount = state.oppLost.length;

  // 3. バトル場・ベンチを入れ替え
  const tmpActive = state.myActive;
  state.myActive = state.oppActive;
  state.oppActive = tmpActive;

  const tmpBench = state.myBench;
  state.myBench = state.oppBench;
  state.oppBench = tmpBench;

  // 4. 使用カード・選択状態をリセット
  state.playCard = null;
  state.tempCards = [];
  state.selectedHandIndices.clear();
  state.draggedHandIndex = -1;
  state.draggedEnergy = null;
  state.actionTargetMode = null;

  addLog(`【一人回し】手番が交代しました（現在の手番: ${state.myName}）`, {
    action: "SOLO_SWAP",
    player: state.myName,
    details: `手番交代: ${state.myName}`
  });
  showToast(`手番交代！ 現在: 【${state.myName}】の手番`);
  renderAll();
}

function tossCoin() {
  const isHeads = Math.random() < 0.5;
  const result = isHeads ? "表（オモテ）◎" : "裏（ウラ）✕";
  addLog(`コイントス結果: 【${result}】`);
  alert(`コイントス結果: 【 ${result} 】`);
}

// =============================================================================
// モーダル表示群
// =============================================================================
let deckModalSelected = new Set();

function showDeckModal() {
  deckModalSelected.clear();
  renderDeckModalContent();
}

function renderDeckModalContent() {
  const title = `山札を見る (残り ${state.myDeck.length} 枚)`;
  let bodyHtml = `<div class="card-grid">`;
  state.myDeck.forEach((c, idx) => {
    registerCard(c);
    const isSel = deckModalSelected.has(idx);
    bodyHtml += `
      <div class="card ${c.color} ${isSel ? 'selected' : ''}" 
           onclick="toggleDeckModalCard(event, ${idx})"
           ondblclick="event.stopPropagation(); window.openCardZoomByUid('${c.uid}')" 
           title="クリックで選択 / ダブルクリックで拡大">
        <div class="card-top"><span class="name">${c.name}</span></div>
        <div class="card-btm"><span>${c.sub || c.category || ''}</span></div>
        <div style="margin-top:4px; display:flex; gap:2px;" onclick="event.stopPropagation()">
          <button class="btn green" style="padding:2px 3px; font-size:9px; flex:1;" onclick="pickFromDeck(${idx}, 'hand')">手札に加える</button>
          <button class="btn red" style="padding:2px 3px; font-size:9px; flex:1;" onclick="pickFromDeck(${idx}, 'trash')">トラッシュ</button>
        </div>
      </div>
    `;
  });
  bodyHtml += `</div>`;

  const selCount = deckModalSelected.size;
  const footHtml = `
    ${selCount > 0 ? `
      <span style="font-size:11px; color:#ffd84a; align-self:center; margin-right:4px;">${selCount}枚選択中:</span>
      <button class="btn green" onclick="pickSelectedFromDeck('hand')">選択を手札に加える</button>
      <button class="btn red" onclick="pickSelectedFromDeck('trash')">選択をトラッシュ</button>
    ` : ''}
    <button class="btn purple" onclick="shuffleMyDeck(); closeModal();">シャッフルして閉じる</button>
    <button class="btn" onclick="closeModal()">閉じる</button>
  `;

  showModal(title, bodyHtml, footHtml);
}

window.toggleDeckModalCard = function(e, idx) {
  if (e.target.closest("button")) return;
  if (deckModalSelected.has(idx)) {
    deckModalSelected.delete(idx);
  } else {
    deckModalSelected.add(idx);
  }
  renderDeckModalContent();
};

window.pickFromDeck = function(idx, destination) {
  const card = state.myDeck.splice(idx, 1)[0];
  if (destination === "hand") {
    state.myHand.push(card);
    addLog(`山札から「${card.name}」を手札に加えました`);
    showToast(`手札へ: ${card.name}`);
  } else {
    state.myTrash.push(card);
    addLog(`山札から「${card.name}」をトラッシュしました`);
    showToast(`トラッシュ: ${card.name}`);
  }
  closeModal();
  renderAll();
};

window.pickSelectedFromDeck = function(destination) {
  if (deckModalSelected.size === 0) {
    return alert("カードをクリックして選択してください");
  }
  const indices = Array.from(deckModalSelected).sort((a, b) => b - a);
  const moved = [];
  indices.forEach(idx => {
    const c = state.myDeck.splice(idx, 1)[0];
    moved.push(c);
    if (destination === "hand") {
      state.myHand.push(c);
    } else {
      state.myTrash.push(c);
    }
  });
  deckModalSelected.clear();
  const names = moved.map(c => c.name).join(", ");
  if (destination === "hand") {
    addLog(`山札から${moved.length}枚（${names}）を手札に加えました`);
    showToast(`手札に加える: ${moved.length}枚`);
  } else {
    addLog(`山札から${moved.length}枚（${names}）をトラッシュしました`);
    showToast(`トラッシュ: ${moved.length}枚`);
  }
  closeModal();
  renderAll();
};

function showCardListModal(titleText, cardList) {
  let bodyHtml = `<div class="card-grid">`;
  cardList.forEach((c, idx) => {
    registerCard(c);
    bodyHtml += `
      <div class="card ${c.color}" ondblclick="event.stopPropagation(); window.openCardZoomByUid('${c.uid}')" title="ダブルクリックで拡大">
        <div class="card-top"><span class="name">${c.name}</span></div>
        <div class="card-btm"><span>${c.sub || c.category || ''}</span></div>
        <div style="margin-top:4px;">
          <button class="btn green" style="padding:2px 4px; font-size:9px; width:100%;" onclick="pickFromList('${titleText}', ${idx})">手札に加える</button>
        </div>
      </div>
    `;
  });
  bodyHtml += `</div>`;

  showModal(`${titleText} (${cardList.length} 枚)`, bodyHtml, `<button class="btn" onclick="closeModal()">閉じる</button>`);
}

window.pickFromList = function(listType, idx) {
  let list = listType.includes("ロスト") ? state.myLost : state.myTrash;
  if (idx < 0 || idx >= list.length) return;
  const card = list.splice(idx, 1)[0];
  state.myHand.push(card);
  addLog(`${listType} から「${card.name}」を手札に戻しました`);
  showToast(`手札へ: ${card.name}`);
  closeModal();
  renderAll();
};

// =============================================================================
// 対戦ログ & CSV出力・試合再現 (Match History & Replay)
// =============================================================================
let matchHistory = [];
let replayState = {
  isActive: false,
  records: [],
  currentIndex: -1,
  timerId: null,
  speedMs: 1200
};

function createSnapshot() {
  return {
    turn: state.turn,
    myName: state.myName,
    oppName: state.oppName,
    roomNo: state.roomNo,
    myDeck: JSON.parse(JSON.stringify(state.myDeck)),
    myHand: JSON.parse(JSON.stringify(state.myHand)),
    myPrizes: JSON.parse(JSON.stringify(state.myPrizes)),
    myTrash: JSON.parse(JSON.stringify(state.myTrash)),
    myLost: JSON.parse(JSON.stringify(state.myLost)),
    myActive: JSON.parse(JSON.stringify(state.myActive)),
    myBench: JSON.parse(JSON.stringify(state.myBench)),
    tempCards: JSON.parse(JSON.stringify(state.tempCards)),
    playCard: JSON.parse(JSON.stringify(state.playCard)),
    stadium: JSON.parse(JSON.stringify(state.stadium)),
    oppDeckCount: state.oppDeckCount,
    oppHandCount: state.oppHandCount,
    oppPrizes: state.oppPrizes,
    oppTrash: JSON.parse(JSON.stringify(state.oppTrash)),
    oppLostCount: state.oppLostCount,
    oppActive: JSON.parse(JSON.stringify(state.oppActive)),
    oppBench: JSON.parse(JSON.stringify(state.oppBench)),
    myMatId: state.myMatId,
    oppMatId: state.oppMatId
  };
}

function restoreSnapshot(snap) {
  if (!snap) return;
  state.turn = snap.turn ?? state.turn;
  state.myName = snap.myName || state.myName;
  state.oppName = snap.oppName || state.oppName;
  state.roomNo = snap.roomNo || state.roomNo;
  state.myMatId = snap.myMatId || state.myMatId || "mat_01";
  state.oppMatId = snap.oppMatId || state.oppMatId || "mat_02";
  state.myDeck = JSON.parse(JSON.stringify(snap.myDeck || []));
  state.myHand = JSON.parse(JSON.stringify(snap.myHand || []));
  state.myPrizes = JSON.parse(JSON.stringify(snap.myPrizes || []));
  state.myTrash = JSON.parse(JSON.stringify(snap.myTrash || []));
  state.myLost = JSON.parse(JSON.stringify(snap.myLost || []));
  state.myActive = snap.myActive ? JSON.parse(JSON.stringify(snap.myActive)) : null;
  state.myBench = (snap.myBench || []).map(b => b ? JSON.parse(JSON.stringify(b)) : null);
  state.tempCards = JSON.parse(JSON.stringify(snap.tempCards || []));
  state.playCard = snap.playCard ? JSON.parse(JSON.stringify(snap.playCard)) : null;
  state.stadium = snap.stadium ? JSON.parse(JSON.stringify(snap.stadium)) : null;
  state.oppDeckCount = snap.oppDeckCount ?? 0;
  state.oppHandCount = snap.oppHandCount ?? 0;
  state.oppPrizes = snap.oppPrizes ?? 0;
  state.oppTrash = JSON.parse(JSON.stringify(snap.oppTrash || []));
  state.oppLostCount = snap.oppLostCount ?? 0;
  state.oppActive = snap.oppActive ? JSON.parse(JSON.stringify(snap.oppActive)) : null;
  state.oppBench = (snap.oppBench || []).map(b => b ? JSON.parse(JSON.stringify(b)) : null);
  state.selectedHandIndices.clear();
  state.draggedHandIndex = -1;
  state.draggedEnergy = null;
  state.actionTargetMode = null;
}

function recordMatchStep(meta = {}) {
  const step = matchHistory.length + 1;
  const snap = createSnapshot();
  const record = {
    step: step,
    turn: state.turn,
    timestamp: new Date().toISOString(),
    player: meta.player || state.myName,
    action: meta.action || "ACTION",
    cardName: meta.cardName || "",
    fromZone: meta.fromZone || "",
    toZone: meta.toZone || "",
    details: meta.details || "",
    logMessage: meta.logMessage || "",
    snapshot: JSON.stringify(snap)
  };
  matchHistory.push(record);
}

function addLog(text, meta = {}) {
  const time = new Date().toLocaleTimeString();
  state.logs.push(`[${time}] ${text}`);
  if (!replayState.isActive) {
    recordMatchStep({
      ...meta,
      logMessage: text
    });
  }
}

function escapeCsvCell(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

function exportMatchCsv() {
  if (!matchHistory || matchHistory.length === 0) {
    // 履歴が空の場合は現在のスナップショットで初期レコード作成
    recordMatchStep({ action: "CURRENT_STATE", logMessage: "対戦の現在状態" });
  }

  const headers = [
    "Step", "Turn", "Timestamp", "Player", "Action",
    "CardName", "FromZone", "ToZone", "Details", "LogMessage", "Snapshot"
  ];

  const rows = [headers.join(",")];
  matchHistory.forEach(r => {
    const row = [
      escapeCsvCell(r.step),
      escapeCsvCell(r.turn),
      escapeCsvCell(r.timestamp),
      escapeCsvCell(r.player),
      escapeCsvCell(r.action),
      escapeCsvCell(r.cardName),
      escapeCsvCell(r.fromZone),
      escapeCsvCell(r.toZone),
      escapeCsvCell(r.details),
      escapeCsvCell(r.logMessage),
      escapeCsvCell(r.snapshot)
    ];
    rows.push(row.join(","));
  });

  const csvContent = "\uFEFF" + rows.join("\r\n"); // UTF-8 BOM
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const nowStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  a.href = url;
  a.download = `pokeca_match_${state.roomNo}_${nowStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("CSVファイルを出力しました");
}

function parseCsv(text) {
  // RFC 4180 対応の CSV パーサー（改行やクォートエスケープを含むセルに対応）
  const cleanText = text.replace(/^\uFEFF/, "");
  const rows = [];
  let currentRow = [];
  let currentCell = "";
  let inQuotes = false;
  let i = 0;

  while (i < cleanText.length) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentCell += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentCell += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentCell);
        currentCell = "";
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = "";
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = "";
        i++;
        continue;
      } else {
        currentCell += char;
        i++;
        continue;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows;
}

function importMatchCsv(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target.result;
      const rows = parseCsv(text);
      if (rows.length < 2) {
        alert("有効な対戦ログCSVではありません（データ行がありません）");
        return;
      }

      const headers = rows[0].map(h => h.trim());
      const snapshotIdx = headers.indexOf("Snapshot");
      const actionIdx = headers.indexOf("Action");
      const logIdx = headers.indexOf("LogMessage");
      const turnIdx = headers.indexOf("Turn");
      const stepIdx = headers.indexOf("Step");

      if (snapshotIdx === -1) {
        alert("CSVに対戦状態（Snapshot）列が含まれていません。正しい対戦ログCSVを指定してください。");
        return;
      }

      const records = [];
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length <= snapshotIdx) continue;
        const snapRaw = row[snapshotIdx];
        if (!snapRaw) continue;
        try {
          const snapObj = JSON.parse(snapRaw);
          records.push({
            step: parseInt(row[stepIdx]) || r,
            turn: parseInt(row[turnIdx]) || snapObj.turn || 1,
            action: actionIdx >= 0 ? row[actionIdx] : "",
            logMessage: logIdx >= 0 ? row[logIdx] : "",
            snapshot: snapObj
          });
        } catch (err) {
          console.warn("Snapshot parse failed at row", r, err);
        }
      }

      if (records.length === 0) {
        alert("有効な対戦ステップを読み込めませんでした。");
        return;
      }

      startReplayMode(records);
    } catch (err) {
      console.error(err);
      alert("CSVファイルの読み込みに失敗しました: " + err.message);
    }
  };
  reader.readAsText(file, "UTF-8");
}

function startReplayMode(records) {
  replayState.isActive = true;
  replayState.records = records;
  replayState.currentIndex = 0;
  if (replayState.timerId) {
    clearInterval(replayState.timerId);
    replayState.timerId = null;
  }

  // 画面遷移
  document.getElementById("lobby").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
  const replayBar = document.getElementById("replay-bar");
  if (replayBar) replayBar.classList.remove("hidden");

  // スライダー初期化
  const slider = document.getElementById("replay-slider");
  if (slider) {
    slider.min = "0";
    slider.max = String(records.length - 1);
    slider.value = "0";
  }

  jumpToReplayStep(0);
  closeModal();
  showToast(`試合ログを読込完了（全 ${records.length} ステップ）。再現を開始します。`);
}

function jumpToReplayStep(idx) {
  if (!replayState.records || idx < 0 || idx >= replayState.records.length) return;
  replayState.currentIndex = idx;
  const rec = replayState.records[idx];

  // 状態復元
  restoreSnapshot(rec.snapshot);
  renderAll();

  // リプレイUI更新
  const slider = document.getElementById("replay-slider");
  if (slider) slider.value = String(idx);

  const stepInfo = document.getElementById("replay-step-info") || document.getElementById("replay-step-text");
  if (stepInfo) stepInfo.textContent = `${idx + 1} / ${replayState.records.length}`;

  const msgText = document.getElementById("replay-msg") || document.getElementById("replay-msg-text");
  if (msgText) msgText.textContent = `[ターン${rec.turn}] ${rec.logMessage || rec.action || "手順実行"}`;
}

function replayNext() {
  if (replayState.currentIndex < replayState.records.length - 1) {
    jumpToReplayStep(replayState.currentIndex + 1);
  } else {
    if (replayState.timerId) {
      replayTogglePlay();
    }
    showToast("試合再現の最終ステップに到達しました");
  }
}

function replayPrev() {
  if (replayState.currentIndex > 0) {
    jumpToReplayStep(replayState.currentIndex - 1);
  }
}

function replayFirst() {
  jumpToReplayStep(0);
}

function replayLast() {
  jumpToReplayStep(replayState.records.length - 1);
}

function replayTogglePlay() {
  const playBtn = document.getElementById("btn-replay-play") || document.getElementById("replay-btn-play");
  if (replayState.timerId) {
    clearInterval(replayState.timerId);
    replayState.timerId = null;
    if (playBtn) playBtn.textContent = "▶ 再生";
    showToast("自動再生を一時停止しました");
  } else {
    if (replayState.currentIndex >= replayState.records.length - 1) {
      jumpToReplayStep(0);
    }
    if (playBtn) playBtn.textContent = "⏸ 一時停止";
    showToast("自動再生中...");
    replayState.timerId = setInterval(() => {
      if (replayState.currentIndex < replayState.records.length - 1) {
        replayNext();
      } else {
        replayTogglePlay();
      }
    }, replayState.speedMs);
  }
}

function exitReplayMode() {
  if (replayState.timerId) {
    clearInterval(replayState.timerId);
    replayState.timerId = null;
  }
  replayState.isActive = false;
  replayState.records = [];
  const replayBar = document.getElementById("replay-bar");
  if (replayBar) replayBar.classList.add("hidden");

  showToast("試合再現モードを終了しました");
}

function showLogModal() {
  const bodyHtml = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:8px;">
      <span style="font-size:12px; color:#94a3b8;">現在の試合の進行履歴（全 ${state.logs.length} 件）</span>
      <div style="display:flex; gap:6px;">
        <button class="btn btn-primary" style="padding:4px 10px; font-size:11px;" data-action="exportCsv">📥 CSVファイルに出力</button>
        <button class="btn btn-secondary" style="padding:4px 10px; font-size:11px;" data-action="triggerCsvImport">📂 CSV読込で再現</button>
      </div>
    </div>
    <div style="background:#0b0f19; padding:10px; border-radius:6px; font-size:12px; line-height:1.8; max-height:360px; overflow-y:auto; border:1px solid #1e293b;">
      ${state.logs.map(l => `<div>• ${l}</div>`).reverse().join("") || "ログはありません"}
    </div>
  `;
  showModal("対戦ログ / 試合出力・再現", bodyHtml, `<button class="btn" onclick="closeModal()">閉じる</button>`);
}

function showModal(title, body, foot) {
  document.getElementById("modal-title").innerHTML = title;
  document.getElementById("modal-body").innerHTML = body;
  document.getElementById("modal-foot").innerHTML = foot;
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2000);
}

// デッキプレビュー描画 (ロビー画面用)
function renderDeckPreview(deck, elementId = "deck-preview") {
  const el = document.getElementById(elementId);
  if (!el) return;
  const pokemonCount = deck.filter(c => c.type === "pokemon").length;
  const trainerCount = deck.filter(c => c.type === "trainer" || c.type === "stadium").length;
  const energyCount = deck.filter(c => c.type === "energy").length;
  el.innerHTML = `
    <span>計 <b>${deck.length}</b> 枚</span>
    <span>ポケモン: ${pokemonCount}</span>
    <span>トレーナーズ: ${trainerCount}</span>
    <span>エネルギー: ${energyCount}</span>
  `;
}

function switchLobbyMode(mode) {
  const btnOnline = document.getElementById("btn-mode-online");
  const btnSolo = document.getElementById("btn-mode-solo");
  const panelOnline = document.getElementById("mode-panel-online");
  const panelSolo = document.getElementById("mode-panel-solo");

  if (mode === "solo") {
    btnOnline.classList.remove("active");
    btnSolo.classList.add("active");
    panelOnline.classList.add("hidden");
    panelSolo.classList.remove("hidden");
    // 一人回し用プレビュー更新
    renderDeckPreview(state.soloDeckA || SAMPLE_DECK, "deck-preview-a");
    renderDeckPreview(state.soloDeckB || SAMPLE_DECK_B, "deck-preview-b");
    renderPlaymatSelector();
  } else {
    btnOnline.classList.add("active");
    btnSolo.classList.remove("active");
    panelOnline.classList.remove("hidden");
    panelSolo.classList.add("hidden");
    renderPlaymatSelector();
  }
}

function loadSoloDeckA() {
  state.soloDeckA = SAMPLE_DECK;
  renderDeckPreview(state.soloDeckA, "deck-preview-a");
  showToast("デッキ1（先攻 / リザードンex 60枚）を読み込みました");
}

function loadSoloDeckB() {
  state.soloDeckB = SAMPLE_DECK_B;
  renderDeckPreview(state.soloDeckB, "deck-preview-b");
  showToast("デッキ2（後攻 / フシギバナex 60枚）を読み込みました");
}

// Fisher-Yates シャッフル
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// =============================================================================
// プレイマット管理＆描画 (Playmat Manager)
// =============================================================================
const STORAGE_KEY_PLAYMATS = "pokeca_custom_playmats_v1";
let activeMatTab = "my"; // "my" | "opp"

function loadCustomPlaymats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLAYMATS);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.warn("Failed to load custom playmats from localStorage", e);
    return [];
  }
}

function saveCustomPlaymat(matObj) {
  try {
    const list = loadCustomPlaymats();
    list.unshift(matObj);
    localStorage.setItem(STORAGE_KEY_PLAYMATS, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error("Failed to save playmat to localStorage", e);
    alert("画像の保存に失敗しました。画像サイズが大きすぎる可能性があります（数MB以内の画像を推奨します）。");
    return false;
  }
}

function deleteCustomPlaymat(matId) {
  if (!confirm("この登録プレイマットを削除しますか？")) return;
  try {
    const list = loadCustomPlaymats().filter(m => m.id !== matId);
    localStorage.setItem(STORAGE_KEY_PLAYMATS, JSON.stringify(list));
    if (state.myMatId === matId) state.myMatId = "mat_01";
    if (state.oppMatId === matId) state.oppMatId = "mat_02";
    initPlaymats();
    renderPlaymats();
    showToast("登録プレイマットを削除しました");
  } catch (e) {
    console.error(e);
  }
}

function getAllPlaymats() {
  const customs = loadCustomPlaymats();
  return [...customs, ...DEFAULT_PLAYMATS];
}

function getPlaymatById(id) {
  const all = getAllPlaymats();
  return all.find(m => m.id === id) || DEFAULT_PLAYMATS[0];
}

function initPlaymats() {
  renderPlaymatSelector();
}

function renderPlaymatSelector() {
  const containers = [
    document.getElementById("playmat-preview-row"),
    document.getElementById("playmat-preview-row-solo")
  ].filter(Boolean);

  if (containers.length === 0) return;

  const allMats = getAllPlaymats();
  const selectedId = state.myMatId;

  const html = allMats.map(mat => {
    const isSelected = mat.id === selectedId;
    const isCustom = mat.isCustom === true;
    const bgStyle = mat.dataUrl ? `background-image: url('${mat.dataUrl}'); background-size: cover;` : `background: ${mat.bg};`;

    return `
      <div class="playmat-card ${isSelected ? 'selected' : ''} ${isCustom ? 'custom' : ''}"
           onclick="selectPlaymat('${mat.id}')"
           title="${mat.name}">
        ${isCustom ? `<button class="playmat-del-btn" onclick="event.stopPropagation(); deleteCustomPlaymat('${mat.id}')" title="削除">×</button>` : ''}
        <div class="playmat-card-thumb" style="${bgStyle}">
          ${isCustom ? `<span class="playmat-badge-tag">自作</span>` : ''}
        </div>
        <div class="playmat-card-title">${mat.name}</div>
      </div>
    `;
  }).join("");

  containers.forEach(c => { c.innerHTML = html; });
}

window.selectPlaymat = function(matId) {
  state.myMatId = matId;
  renderPlaymatSelector();
  renderPlaymats();
  const mat = getPlaymatById(matId);
  showToast(`プレイマット: 「${mat.name}」を選択しました`);
};

window.deleteCustomPlaymat = deleteCustomPlaymat;

function openMatUpload() {
  const input = document.getElementById("mat-file-input");
  if (input) input.click();
}

function handleCustomPlaymatUpload(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("画像ファイル（PNG, JPEG, WebP等）を選択してください。");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const matName = prompt("登録するプレイマットの名前を入力してください:", file.name.replace(/\.[^/.]+$/, "").slice(0, 16)) || "自作マット";
    const newMat = {
      id: "custom_" + Date.now(),
      name: matName.trim() || "自作マット",
      isCustom: true,
      dataUrl: dataUrl
    };

    if (saveCustomPlaymat(newMat)) {
      state.myMatId = newMat.id;
      initPlaymats();
      renderPlaymats();
      showToast(`自作プレイマット「${newMat.name}」を登録し、選択しました！`);
    }
  };
  reader.readAsDataURL(file);
}

function renderPlaymats() {
  const myMatEl = document.getElementById("board-mat-me");
  const oppMatEl = document.getElementById("board-mat-opp");
  if (!myMatEl || !oppMatEl) return;

  const myMat = getPlaymatById(state.myMatId);
  const oppMat = getPlaymatById(state.oppMatId);

  // 自分のマット適用 (画面下半分)
  if (myMat.dataUrl) {
    myMatEl.style.backgroundImage = `url("${myMat.dataUrl}")`;
    myMatEl.style.backgroundSize = "cover";
    myMatEl.style.backgroundPosition = "center";
    myMatEl.style.backgroundColor = "#1e293b";
  } else {
    myMatEl.style.backgroundImage = "";
    myMatEl.style.background = myMat.bg;
  }

  // 相手側のマット適用 (画面上半分・対面相手が選択)
  if (oppMat.dataUrl) {
    oppMatEl.style.backgroundImage = `url("${oppMat.dataUrl}")`;
    oppMatEl.style.backgroundSize = "cover";
    oppMatEl.style.backgroundPosition = "center";
    oppMatEl.style.backgroundColor = "#1e293b";
  } else {
    oppMatEl.style.backgroundImage = "";
    oppMatEl.style.background = oppMat.bg;
  }
}

