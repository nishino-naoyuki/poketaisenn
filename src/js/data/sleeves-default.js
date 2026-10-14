/* 【データ】プリセットスリーブ（カード裏面）定義 */

// =============================================================================
// スリーブ定義（デフォルト7種類 ＋ ユーザー自作登録対応）
// =============================================================================
const DEFAULT_SLEEVES = [
  {
    id: "sleeve_01",
    name: "公式クラシック",
    type: "image",
    url: "img/card-back.png",
    border: "#d4af37"
  },
  {
    id: "sleeve_02",
    name: "モンスターボール",
    type: "gradient",
    bg: "linear-gradient(180deg, #ef4444 0%, #b91c1c 48%, #1e293b 48%, #1e293b 52%, #ffffff 52%, #f1f5f9 100%)",
    border: "#94a3b8"
  },
  {
    id: "sleeve_03",
    name: "ハイパーボール",
    type: "gradient",
    bg: "radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 75%), linear-gradient(135deg, #facc15 0%, #ca8a04 100%)",
    border: "#eab308"
  },
  {
    id: "sleeve_04",
    name: "マスターボール",
    type: "gradient",
    bg: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 65%, #db2777 100%)",
    border: "#c084fc"
  },
  {
    id: "sleeve_05",
    name: "ピカチュウ・イエロー",
    type: "gradient",
    bg: "linear-gradient(135deg, #fef08a 0%, #facc15 50%, #eab308 100%)",
    border: "#ca8a04"
  },
  {
    id: "sleeve_06",
    name: "漆黒のシャドウ",
    type: "gradient",
    bg: "radial-gradient(circle at 50% 50%, #334155 0%, #090d16 100%)",
    border: "#475569"
  },
  {
    id: "sleeve_07",
    name: "チャンピオン・ゴールド",
    type: "gradient",
    bg: "linear-gradient(135deg, #fde047 0%, #d97706 50%, #78350f 100%)",
    border: "#f59e0b"
  }
];
