/* 【データ】サンプルデッキ・カード登録・エネルギー表示情報 */

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
  { name: "ヒトカゲ", type: "pokemon", color: "fire", category: "ポケモン" },
  { name: "ヒトカゲ", type: "pokemon", color: "fire", category: "ポケモン" },
  { name: "ヒトカゲ", type: "pokemon", color: "fire", category: "ポケモン" },
  { name: "リザード", type: "pokemon", color: "fire", category: "ポケモン" },
  { name: "リザード", type: "pokemon", color: "fire", category: "ポケモン" },
  { name: "リザードンex", type: "pokemon", color: "fire", category: "ポケモン" },
  { name: "リザードンex", type: "pokemon", color: "fire", category: "ポケモン" },
  { name: "ピィ", type: "pokemon", color: "pokemon", category: "ポケモン" },
  { name: "ポッポ", type: "pokemon", color: "pokemon", category: "ポケモン" },
  { name: "ポッポ", type: "pokemon", color: "pokemon", category: "ポケモン" },
  { name: "ピジョットex", type: "pokemon", color: "pokemon", category: "ポケモン" },
  { name: "ピジョットex", type: "pokemon", color: "pokemon", category: "ポケモン" },
  { name: "ロトムV", type: "pokemon", color: "pokemon", category: "ポケモン" },
  { name: "かがやくリザードン", type: "pokemon", color: "fire", category: "ポケモン" },

  // トレーナーズ (36枚)
  { name: "バトルVIPパス", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "バトルVIPパス", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "バトルVIPパス", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "バトルVIPパス", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ハイパーボール", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ハイパーボール", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ハイパーボール", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ハイパーボール", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ネストボール", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ネストボール", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ふしぎなアメ", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ふしぎなアメ", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ふしぎなアメ", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "すごいつりざお", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "すごいつりざお", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ともだちてちょう", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ロストスイーパー", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "まけん気ハチマキ", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "森の封印石", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ポケギア3.0", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ポケギア3.0", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "大地の器", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ナンジャモ", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ナンジャモ", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ナンジャモ", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ボスの指令", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ボスの指令", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ボスの指令", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ペパー", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ペパー", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ペパー", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "博士の研究", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ジニア", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ボウルタウン", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ボウルタウン", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "崩れたスタジアム", type: "trainer", color: "trainer", category: "トレーナーズ" },

  // エネルギー (10枚)
  { name: "基本炎エネルギー", type: "energy", color: "fire", category: "エネルギー" },
  { name: "基本炎エネルギー", type: "energy", color: "fire", category: "エネルギー" },
  { name: "基本炎エネルギー", type: "energy", color: "fire", category: "エネルギー" },
  { name: "基本炎エネルギー", type: "energy", color: "fire", category: "エネルギー" },
  { name: "基本炎エネルギー", type: "energy", color: "fire", category: "エネルギー" },
  { name: "基本炎エネルギー", type: "energy", color: "fire", category: "エネルギー" },
  { name: "基本炎エネルギー", type: "energy", color: "fire", category: "エネルギー" },
  { name: "基本炎エネルギー", type: "energy", color: "fire", category: "エネルギー" },
  { name: "ジェットエネルギー", type: "energy", color: "pokemon", category: "エネルギー" },
  { name: "ジェットエネルギー", type: "energy", color: "pokemon", category: "エネルギー" }
];

// 相手用・一人回し用のデッキデータ B (フシギバナexデッキ 60枚)
const SAMPLE_DECK_B = [
  // ポケモン (14枚)
  { name: "フシギダネ", type: "pokemon", color: "grass", category: "ポケモン" },
  { name: "フシギダネ", type: "pokemon", color: "grass", category: "ポケモン" },
  { name: "フシギダネ", type: "pokemon", color: "grass", category: "ポケモン" },
  { name: "フシギソウ", type: "pokemon", color: "grass", category: "ポケモン" },
  { name: "フシギソウ", type: "pokemon", color: "grass", category: "ポケモン" },
  { name: "フシギバナex", type: "pokemon", color: "grass", category: "ポケモン" },
  { name: "フシギバナex", type: "pokemon", color: "grass", category: "ポケモン" },
  { name: "かがやくゲッコウガ", type: "pokemon", color: "water", category: "ポケモン" },
  { name: "マナフィ", type: "pokemon", color: "water", category: "ポケモン" },
  { name: "ビッパ", type: "pokemon", color: "pokemon", category: "ポケモン" },
  { name: "ビッパ", type: "pokemon", color: "pokemon", category: "ポケモン" },
  { name: "ビーダル", type: "pokemon", color: "pokemon", category: "ポケモン" },
  { name: "ビーダル", type: "pokemon", color: "pokemon", category: "ポケモン" },
  { name: "ロトムV", type: "pokemon", color: "pokemon", category: "ポケモン" },

  // トレーナーズ (36枚)
  { name: "ネストボール", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ネストボール", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ネストボール", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ネストボール", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ハイパーボール", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ハイパーボール", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ハイパーボール", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ハイパーボール", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ふしぎなアメ", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ふしぎなアメ", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ふしぎなアメ", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "大地の器", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "大地の器", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "すごいつりざお", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "すごいつりざお", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ポケモンいれかえ", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ポケモンいれかえ", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "勇気のおまもり", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "勇気のおまもり", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "森の封印石", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "カウンターキャッチャー", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ともだちてちょう", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "博士の研究", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "博士の研究", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "博士の研究", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ナンジャモ", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ナンジャモ", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ナンジャモ", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ボスの指令", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ボスの指令", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ペパー", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ペパー", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "フトゥー博士のシナリオ", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ボウルタウン", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "ボウルタウン", type: "trainer", color: "trainer", category: "トレーナーズ" },
  { name: "エイチ湖", type: "trainer", color: "trainer", category: "トレーナーズ" },

  // エネルギー (10枚)
  { name: "基本草エネルギー", type: "energy", color: "grass", category: "エネルギー" },
  { name: "基本草エネルギー", type: "energy", color: "grass", category: "エネルギー" },
  { name: "基本草エネルギー", type: "energy", color: "grass", category: "エネルギー" },
  { name: "基本草エネルギー", type: "energy", color: "grass", category: "エネルギー" },
  { name: "基本草エネルギー", type: "energy", color: "grass", category: "エネルギー" },
  { name: "基本草エネルギー", type: "energy", color: "grass", category: "エネルギー" },
  { name: "基本草エネルギー", type: "energy", color: "grass", category: "エネルギー" },
  { name: "基本草エネルギー", type: "energy", color: "grass", category: "エネルギー" },
  { name: "基本水エネルギー", type: "energy", color: "water", category: "エネルギー" },
  { name: "基本水エネルギー", type: "energy", color: "water", category: "エネルギー" }
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
function createFieldPokemon(card, damage = 0, energies = [], tool = null, conditions = null) {
  if (!card) return null;
  registerCard(card);
  energies.forEach(e => registerCard(e));
  if (tool) registerCard(tool);
  return {
    card: card,
    damage: damage,
    energies: [...energies],
    tool: tool,
    conditions: {
      poison: !!(conditions && conditions.poison),
      burn: !!(conditions && conditions.burn),
      special: (conditions && conditions.special) || null // null | "paralyzed" | "confused" | "asleep"
    },
    abilityUsed: false
  };
}

function ensurePokemonConditions(pokemon) {
  if (!pokemon) return { poison: false, burn: false, special: null };
  if (!pokemon.conditions || typeof pokemon.conditions !== "object") {
    pokemon.conditions = { poison: false, burn: false, special: null };
  } else {
    pokemon.conditions.poison = !!pokemon.conditions.poison;
    pokemon.conditions.burn = !!pokemon.conditions.burn;
    pokemon.conditions.special = pokemon.conditions.special || null;
  }
  return pokemon.conditions;
}

function hasAnyPokemonCondition(pokemon) {
  if (!pokemon || !pokemon.conditions) return false;
  return !!(pokemon.conditions.poison || pokemon.conditions.burn || pokemon.conditions.special);
}

function getPokemonConditionNames(pokemon) {
  if (!pokemon || !pokemon.conditions) return [];
  const list = [];
  if (pokemon.conditions.poison) list.push("どく");
  if (pokemon.conditions.burn) list.push("やけど");
  if (pokemon.conditions.special === "paralyzed") list.push("まひ");
  else if (pokemon.conditions.special === "confused") list.push("こんらん");
  else if (pokemon.conditions.special === "asleep") list.push("ねむり");
  return list;
}

function clearPokemonConditions(pokemon) {
  if (!pokemon) return false;
  const had = hasAnyPokemonCondition(pokemon);
  pokemon.conditions = { poison: false, burn: false, special: null };
  return had;
}

/** たねポケモンかどうかを判定する共通判定関数 */
function isBasicPokemonCard(card) {
  if (!card) return false;
  const isPoke = (card.type || "").toLowerCase() === "pokemon" || card.category === "ポケモン" || !!card.hp;
  if (!isPoke) return false;
  const cat = (card.category || "").toLowerCase();
  const sub = (card.sub || "").toLowerCase();
  if (cat.includes("進化") || sub.includes("進化")) return false;
  if (card.name && (card.name.includes("VSTAR") || card.name.includes("VMAX"))) return false;
  return true;
}

window.ensurePokemonConditions = ensurePokemonConditions;
window.hasAnyPokemonCondition = hasAnyPokemonCondition;
window.getPokemonConditionNames = getPokemonConditionNames;
window.clearPokemonConditions = clearPokemonConditions;
window.isBasicPokemonCard = isBasicPokemonCard;



