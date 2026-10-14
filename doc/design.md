# ポケモンカード オンライン対戦ツール 詳細設計書

本書は、Webブラウザ上で動作するポケモンカードゲーム（ポケカ）のオンラインシミュレーターに関する詳細設計書（システムアーキテクチャ、データモデル、モジュール構成、UI/UX制御ロジック、通信仕様）です。

---

## 1. システム概要

### 1.1 システムの目的
本システムは、実際の紙のカードゲームと同様の自由度を持ち、複雑なルール自動判定を排してプレイヤーが直感的にカードを操作できる**手動操作型Web対戦シミュレーター**です。
P2P通信によるオンライン2人対戦に加え、1台の端末で2デッキを切り替えながら練習・研究できる「一人回し機能」、試合の全ステップを完全再現できる「CSV棋譜出力/リプレイ機能」、好みのプレイマットで対戦できる「背景プレイマット選択/自作登録機能」、およびスマホ画面でも快適に扱える「タッチドラッグ＆ドロップ」「手札選択時ボトムシート」を備えます。

### 1.2 システム構成方針
1. **完全クライアント完結型（サーバーレス）**:
   - HTML5, CSS3, Vanilla JavaScript (ES6+) のみで構築。
   - バックエンドサーバーやデータベースを持たず、静的ホスティング（GitHub Pages, S3, 各種Webサーバー）で即時稼働。
2. **P2P直接通信（WebRTC / PeerJS）**:
   - ルーム作成・入室によるシグナリングのみを行い、対戦データはプレイヤー間で暗号化直接送受信。
3. **ローカル永続化（localStorage）**:
   - 自作プレイマット画像などのユーザー個別データはブラウザの `localStorage` に保存。

---

## 2. システムアーキテクチャ設計

### 2.1 全体構造図

```mermaid
graph TD
    subgraph Client [ブラウザ クライアント]
        UI[UI View Layer (HTML/CSS)]
        State[State Manager (state オブジェクト)]
        
        subgraph Subsystems [サブシステム]
            TouchDnD[タッチD&Dエンジン (touchDrag)]
            Marquee[矩形範囲選択エンジン (marqueeState)]
            SoloEngine[一人回しエンジン (swapSoloTurn)]
            ReplayEngine[CSV棋譜・試合再現エンジン (Replay)]
            MatManager[プレイマット管理 (localStorage)]
            P2PNetwork[P2P通信マネージャー (PeerJS)]
        end
        
        UI --> State
        TouchDnD --> State
        Marquee --> State
        SoloEngine --> State
        ReplayEngine --> State
        MatManager --> State
        P2PNetwork --> State
        State --> UI
    end

    PeerBroker((PeerJS Signaling Server))
    OpponentClient[対戦相手ブラウザ]

    P2PNetwork <-->|シグナリング| PeerBroker
    P2PNetwork <===>|WebRTC DataChannel (P2P)| OpponentClient
```

### 2.2 ディレクトリ構成とモジュール責務

本プロジェクトは、単一ファイル構成のプロトタイプ（`demo/`）から、機能別モジュール構成（`src/`）へ移行しています。ブラウザでローカルファイル（`file://`）を直接開いた場合でも CORS エラーが発生せず即座に動作するよう、ES Modules (`import`/`export`) ではなく**順序付けされた `<script>` タグによるグローバル連携**を採用しています。

#### 1. モジュール構成 (`src/`)

```
src/
├── index.html                  # エントリーポイント（PeerJS CDN + 各種スクリプト読込）
├── README.md                   # src 実行ガイド & モジュール一覧
├── css/
│   └── style.css               # スタイル定義（盤面レイアウト、すりガラス調UI、レスポンシブ）
└── js/
    ├── data/
    │   ├── cards.js            # サンプルデッキ(リザードンex/フシギバナex)、カード定義、エネルギー色定義
    │   ├── deck-parser.js      # デッキコード解析・公式コード取得・テキスト貼付読込・プリセット管理
    │   └── playmats-default.js # プリセットプレイマット10種（グラデーション定義）
    ├── game/
    │   ├── setup.js            # 対戦・一人回しセットアップ（手札・サイド・バトル場初期化）
    │   ├── hand-actions.js     # 手札・場のカード操作（プレイ、エネ装着、進化、トラッシュ、ロスト、山札戻し）
    │   ├── actions.js          # 山札ドロー、使用カード、ダメカン変更、ターン進行、一人回しスワップ(swapSoloTurn)
    │   └── replay.js           # CSV棋譜エクスポート/インポート、完全試合再現・再生コントローラー
    ├── ui/
    │   ├── render.js           # 盤面・手札・エネルギー・スマホ用ボトムシートの動的DOMレンダリング
    │   ├── marquee.js          # 手札の矩形範囲選択（マウスドラッグによる複数選択）
    │   ├── touch-dnd.js        # タッチ操作ドラッグ＆ドロップエンジン（アバター追従・ドロップ先解決）
    │   ├── modals.js           # 山札確認・トラッシュ確認・サイド確認モーダル、ログ、トースト通知
    │   ├── lobby.js            # ロビー画面制御（通常対戦/一人回しタブ切替、デッキプレビュー、貼付モーダル）
    │   └── playmat.js          # プレイマット選択UI、自作マット画像登録/削除（localStorage連携）
    ├── net/
    │   └── p2p.js              # PeerJS(WebRTC)によるP2P直接通信、状態同期、情報隠蔽、スタジアム同期
    ├── util.js                 # 共通ユーティリティ（Fisher-Yatesシャッフル、UID生成等）
    ├── state.js                # アプリケーション全体の共有状態 `state` オブジェクト定義
    └── main.js                 # 初期化、HTMLからの `actions.*` 委譲ハンドラー定義、イベントリスナー登録
```

#### 2. スクリプト読み込み順序と依存関係

| 読込順 | モジュールパス | 主な公開シンボル・責務 | 依存モジュール |
| :---: | :--- | :--- | :--- |
| 1 | `peerjs.min.js` (CDN) | `window.Peer` | なし（外部CDNライブラリ） |
| 2 | `js/data/cards.js` | `SAMPLE_DECK`, `SAMPLE_DECK_B`, `ENERGY_CONFIG` | なし |
| 3 | `js/data/deck-parser.js` | `PRESET_DECKS`, `resolveDeckInput()`, `parseDeckListText()` | cards.js |
| 4 | `js/util.js` | `shuffleArray()` 等 | なし |
| 5 | `js/data/playmats-default.js` | `DEFAULT_PLAYMATS` | なし |
| 6 | `js/state.js` | `state` (グローバル状態オブジェクト) | cards.js, util.js |
| 7 | `js/game/setup.js` | `startBattleSetup()`, `startSoloBattleSetup()` | state.js, cards.js, util.js |
| 8 | `js/ui/render.js` | `renderAll()`, `updateSheetUI()` | state.js, p2p.js (`syncSoon`) |
| 9 | `js/ui/marquee.js` | `initMarqueeSelection()` | state.js, render.js |
| 10 | `js/ui/touch-dnd.js` | `initTouchDragStart()`, `resolveDropTarget()` | state.js, render.js, hand-actions.js |
| 11 | `js/game/hand-actions.js` | 手札配置・エネ装着・どうぐ装備ロジック | state.js, render.js |
| 12 | `js/game/actions.js` | `endTurn()`, `swapSoloTurn()`, `modifyDamage()` | state.js, render.js |
| 13 | `js/ui/modals.js` | `showDeckModal()`, `showToast()`, `addLog()` | state.js, render.js |
| 14 | `js/game/replay.js` | `exportMatchCsv()`, `loadMatchCsv()`, `applyReplayStep()` | state.js, render.js |
| 15 | `js/ui/lobby.js` | `initLobby()`, `renderDeckPreview()`, `openDeckPasteModal()` | state.js, setup.js, deck-parser.js |
| 16 | `js/ui/playmat.js` | `initPlaymats()`, `selectPlaymat()`, `handleCustomPlaymatUpload()` | state.js, playmats-default.js |
| 17 | `js/net/p2p.js` | `P2P` (P2P通信マネージャー) | state.js, render.js |
| 18 | `js/main.js` | アプリケーション初期化, `actions` グローバルエクスポート | 全モジュール |

#### 3. 旧構成・ドキュメント

| ファイルパス | 責務・備考 |
| :--- | :--- |
| `demo/index.html` | プロトタイプ用シングルページ（参照用として維持） |
| `demo/css/style.css` | プロトタイプ用スタイルシート |
| `demo/js/app.js` | プロトタイプ用統合スクリプト |
| `doc/specifications.md` | 機能仕様書・画面仕様書（キャプチャ画像付き） |
| `doc/design.md` | 本書（アーキテクチャ・データ構造・P2P通信仕様・詳細設計） |

---

## 3. データモデル & 状態管理設計

### 3.1 グローバル状態オブジェクト (`state`)
アプリケーションの全ライフサイクルは `src/js/state.js` で定義された単一の `state` オブジェクトで一元管理されます。

```typescript
interface AppState {
  // プレイヤー基本情報
  myName: string;                // 自プレイヤー名（初期値: "プレイヤーA"）
  oppName: string;               // 相手プレイヤー名（初期値: "プレイヤーB（BOT）"）
  roomNo: string;                // ルーム番号（6桁数字、または "SOLO-PRACTICE"）
  turn: number;                  // 現在のターン数（1〜）
  turnStep: number;              // ターン進行ステップ（1: 先攻1ターン目, 2: 後攻1ターン目, 3: 先攻2ターン目...）

  // 対戦準備フェーズ状態
  isSetupPhase: boolean;         // 対戦準備中フラグ
  setupStep: "coin" | "order" | "place" | "ready" | "done"; // 準備フェーズ詳細ステップ
  coinResult: "heads" | "tails" | null; // コイントス結果（表/裏）
  coinChooser: "host" | "guest" | null; // 先攻/後攻の選択権保持者
  firstPlayer: "host" | "guest" | null; // 先攻決定者
  mySetupReady: boolean;         // 自分の対戦準備完了フラグ
  oppSetupReady: boolean;        // 相手の対戦準備完了フラグ
  mulliganCount: number;         // 自分のマリガン実行回数
  oppMulliganCount: number;      // 相手のマリガン実行回数
  myMulliganStep: string | null; // 自マリガン状態同期
  oppMulliganDeclared: boolean;  // 相手マリガン宣言フラグ
  pendingOppMulliganQueue: Card[][]; // 相手マリガン手札確認キュー

  // 自分側カードゾーン
  myDeck: Card[];                // 山札（カード配列、先頭が山の上）
  myHand: Card[];                // 手札（カード配列）
  myActive: FieldPokemon | null; // バトル場ポケモン
  myBench: (FieldPokemon | null)[]; // ベンチポケモン（最大8枠、通常5枠）
  myBenchLimit: number;          // ベンチ枠数上限（5 または 8）
  myPrizes: Card[];              // サイド（未取得のカード配列）
  myTrash: Card[];               // トラッシュ（カード配列）
  myLost: Card[];                // ロストゾーン（カード配列）

  // テンポラリエリア ＆ 使用カード
  tempCards: Card[];             // テンポラリエリアのカード配列
  playCard: Card | null;         // 現在使用中カード（使用カードエリア）
  oppPlayCard: Card | null;      // 相手が使用カードエリアに置いているカード
  historyStack: any[];           // 直近の盤面スナップショット履歴（1手順巻き戻し用、最大15手順）

  // 共有ゾーン
  stadium: Card | null;          // 場に出ているスタジアムカード
  stadiumTs: number;             // スタジアム最終変更UNIXミリ秒（P2P同期時のLast-Write-Wins競合解決用）

  // 相手側カードゾーン (P2P受信時 または 一人回し時に更新)
  oppDeckCount: number;          // 相手山札残数
  oppHandCount: number;          // 相手手札枚数
  oppPrizes: number;             // 相手サイド残数（0〜6）
  oppTrash: Card[];              // 相手トラッシュ
  oppLostCount: number;          // 相手ロストゾーン枚数
  oppActive: FieldPokemon | null;// 相手バトル場ポケモン
  oppBench: (FieldPokemon | null)[]; // 相手ベンチポケモン（最大8枠）
  oppBenchLimit: number;         // 相手ベンチ枠数上限（5 または 8）
  oppExited: boolean;            // 相手退室検知フラグ

  // UI選択・ドラッグ状態
  selectedHandIndices: Set<number>; // 複数選択された手札インデックス群
  selectedHandIndex: number;     // getter/setter（単一選択アクセスとの後方互換）
  draggedHandIndex: number;      // 現在ドラッグ中の手札インデックス（-1: なし）
  draggedEnergy: { location: string; energyIndex: number } | null; // ドラッグ中エネルギー情報
  actionTargetMode: string | null;// アクション選択待ちモード ("active" | "bench")

  // プレイマット
  myMatId: string;               // 自分のプレイマットID（"mat_01"〜"mat_10" または "custom_..."）
  oppMatId: string;              // 相手のプレイマットID
  oppMatDataUrl: string | null;  // 相手の自作マット画像DataURL

  // 一人回し（ソロプレイ）状態
  isSoloMode: boolean;           // 一人回し中フラグ
  oppDeck: Card[];               // 一人回し用の完全な相手山札
  oppHand: Card[];               // 一人回し用の完全な相手手札
  oppPrizesList: Card[];         // 一人回し用の完全な相手サイド
  oppLost: Card[];               // 一人回し用の完全な相手ロスト
  soloDeckA: Card[];             // デッキAの登録カード配列（先攻）
  soloDeckB: Card[];             // デッキBの登録カード配列（後攻）

  // 試合ログ
  logs: string[];                // 画面ログ文字列配列（タイムスタンプ付き）
}
```

### 3.2 カードおよび場のポケモンデータ構造

#### 1. カードオブジェクト (`Card`)
```typescript
interface Card {
  uid: string;                   // ユニークID（例: "c_12", "init_hitokage", "opp:c_12"）
  name: string;                  // カード名（例: "リザードンex"）
  type: "pokemon" | "trainer" | "energy"; // 大種別
  category?: string;             // 種別詳細（"たね", "1進化", "2進化", "グッズ", "サポート", "スタジアム"）
  sub?: string;                  // サブ種別（"ポケモンのどうぐ", "特殊エネルギー" 等）
  color: string;                 // UIカラー分類（"fire", "water", "grass", "trainer", "energy" 等）
  hp?: number;                   // ポケモンの最大HP
  imageUrl?: string;             // カード画像URL（任意）
}
```

#### 2. 特殊状態オブジェクト (`PokemonConditions`)
```typescript
interface PokemonConditions {
  poison: boolean;               // どく（毎ポケモンチェック +10）
  burn: boolean;                 // やけど（毎ポケモンチェック +20）
  special: "paralyzed" | "confused" | "asleep" | null; // まひ/こんらん/ねむり（排他）
}
```

#### 3. 場のポケモンオブジェクト (`FieldPokemon`)
```typescript
interface FieldPokemon {
  card: Card;                    // ポケモン本体カード（進化後は最新カード）
  damage: number;                // 蓄積ダメカン（ダメージ値: 10刻み、100刻み増減対応）
  energies: Card[];              // ついているエネルギーカード配列
  tool: Card | null;             // 装備しているポケモンのどうぐカード
  conditions: PokemonConditions; // 特殊状態（どく・やけど・まひ・こんらん・ねむり）
  abilityUsed: boolean;          // このターンの特性使用済みフラグ（ターン終了時リセット）
}
```

### 3.3 プレイマットデータモデル

プリセット（`DEFAULT_PLAYMATS` 10種）と、ユーザーがブラウザ上で画像をアップロードした自作マット（`localStorage`）を統合して扱います。

```typescript
// プリセットプレイマット
interface PresetPlaymat {
  id: string;                    // "mat_01" 〜 "mat_10"
  name: string;                  // 表示名（"クラシック・ネイビー", "クリムゾン・レッド" 等）
  type: "gradient";              // 種別
  bg: string;                    // CSS radial-gradient 定義式
  accent: string;                // アクセントカラーHEX（#3b82f6 等）
}

// ユーザー自作プレイマット
interface CustomPlaymat {
  id: string;                    // "custom_" + Date.now() (一意のタイムスタンプID)
  name: string;                  // ユーザー入力のマット名
  isCustom: true;                // 自作登録フラグ
  dataUrl: string;               // Base64 DataURL (画像ファイルデータ)
}

type Playmat = PresetPlaymat | CustomPlaymat;
```
- **保存キー**: `localStorage.getItem("pokeca_custom_playmats_v1")`
- **保存形式**: JSON文字列化された `CustomPlaymat[]` 配列。
- **削除機能**: UI上で `×` ボタンを押すことで `deleteCustomPlaymat(matId)` により個別削除可能。

---

## 4. UI ＆ 画面レイアウト設計

### 4.1 画面状態遷移

```mermaid
stateDiagram-v2
    [*] --> Lobby: ページ読込

    state Lobby {
        [*] --> ModeOnline: 初期表示
        ModeOnline --> ModeSolo: タブ切替 [一人回し]
        ModeSolo --> ModeOnline: タブ切替 [オンライン対戦]
    }

    Lobby --> SetupPhase: 対戦開始 / 一人回し開始
    Lobby --> ReplayScreen: CSV読み込み

    state BattleScreen {
        SetupPhase --> NormalPlay: 双方準備完了 ＆ オープン
        NormalPlay --> MenuOpened: 手札タップ(スマホ) / [操作]ボタン
        MenuOpened --> NormalPlay: [閉じる] / 背景タップ / アクション実行
        NormalPlay --> ZoomModal: カードダブルクリック
        ZoomModal --> NormalPlay: [閉じる] / モーダル外タップ
    }

    state ReplayScreen {
        Paused --> Playing: [再生]
        Playing --> Paused: [一時停止]
        Paused --> Paused: スライダーシーク / [前へ] / [次へ]
    }

    BattleScreen --> Lobby: [対戦終了]
    ReplayScreen --> BattleScreen: [再現終了]
```

### 4.2 プレイマット2分割レンダリング仕様
対戦画面背景（`#game .board-mat-container`）は、2枚の長方形画像を画面上下に配置します。

```
+-------------------------------------------------------+
|  【画面上半分】                                        |
|  相手プレイヤーのプレイマット (ID: oppMatId)            |
|  CSS: transform: rotate(180deg); （対面向きに反転表示） |
+-------------------------------------------------------+
|  【画面下半分】                                        |
|  自分プレイヤーのプレイマット (ID: myMatId)             |
|  CSS: 手前向き通常表示                                  |
+-------------------------------------------------------+
```

---

## 5. インタラクション ＆ イベント処理設計

### 5.1 ハイブリッド ドラッグ＆ドロップ アーキテクチャ

PCの**HTML5 Drag & Drop API**と、スマホ・タブレットの**Touch Events API**を透過的に処理する統合ドラッグエンジンを実装しています。

```mermaid
sequenceDiagram
    autonumber
    actor User as ユーザー
    participant Target as ドラッグ対象 (手札/エネ/場)
    participant Engine as タッチD&Dエンジン (touchDrag)
    participant Resolver as ドロップ先解決器 (resolveDropTarget)
    participant Field as ドロップ先エリア (バトル場/ベンチ/トラッシュ)

    User->>Target: タッチ開始 (touchstart)
    Target->>Engine: initTouchDragStart(e, type, data, target)
    
    alt 移動距離 < 8px で指を離した場合 (タップ)
        User->>Target: タッチ終了 (touchend)
        Engine-->>Target: ドラッグ不成立 → clickイベント発火
        Note over Target: スマホ: 手札選択ボトムメニュー自動展開
    else 移動距離 >= 8px の場合 (ドラッグ)
        User->>Engine: 指を移動 (touchmove)
        Engine->>Engine: e.preventDefault() (スクロール抑止)
        Engine->>Engine: 浮遊アバター作成・追従表示
        Engine->>Resolver: document.elementFromPoint(x, y)
        Resolver-->>Field: ホバー検出 → .touch-drop-hover (黄色点線点灯)
        User->>Field: 指を離す (touchend)
        Engine->>Resolver: 最終座標のドロップ先特定
        Resolver->>Field: executeDropAction(target, type, data)
        Field-->>Field: カード配置 / エネ付与 / トラッシュ実行
        Engine->>Engine: アバター消去・ホバー解除
    end
```

### 5.2 ドロップ解決ロジック (`resolveDropTarget`)

| ドラッグ種別 (`type`) | 検出ドロップ先 | 判定条件 (`hitEl.closest(...)`) | 実行処理 (`executeDropAction`) |
| :--- | :--- | :--- | :--- |
| **手札カード** (`hand`) | 使用カードエリア | `#play-area` | `playHandCardByIndex(handIdx)` |
| | 空きバトル場 | `#my-active` (ポケモンなし) | `placeHandCardToActive(handIdx)` |
| | バトル場ポケモン | `#my-active` (ポケモンあり) | `attachHandCardToPokemon(handIdx, "active")` |
| | 空きベンチ枠 | `#my-bench [data-bench-index]` (空き) | `placeHandCardToBenchIndex(handIdx, bIdx)` |
| | ベンチポケモン | `#my-bench [data-bench-index]` (あり) | `attachHandCardToPokemon(handIdx, "bench_" + bIdx)` |
| | スタジアム | `#stadium` | `placeHandCardToStadium(handIdx)` |
| | トラッシュ | `#my-trash` | `trashHandCardByIndex(handIdx)` |
| | ロストゾーン | `#my-lost` | `lostHandCardByIndex(handIdx)` |
| | 山札 | `#my-deck` | `moveHandCardToDeckBottom(handIdx)` |
| **エネルギーバッジ** (`energy`) | 別のポケモン | `#my-active` または `#my-bench [data-bench-index]` | `moveEnergyBetweenPokemon(srcLoc, energyIdx, dstLoc)` |
| | トラッシュ | `#my-trash` | `detachEnergyToTrash(srcLoc, energyIdx)` |
| **使用中カード** (`playCard`) | トラッシュ / 手札 / スタジアム / ロスト | `#my-trash`, `#hand`, `#stadium`, `#my-lost` | 各移動関数を実行 |

### 5.3 スマホ専用 手札選択ボトムメニュー (`sp-sheet`)

#### 動作シーケンス
1. スマホ環境判定:
   ```javascript
   function isMobileMode() {
     return window.innerWidth <= 768 || 
            window.matchMedia("(orientation: portrait)").matches ||
            ('ontouchstart' in window && window.innerWidth <= 1024);
   }
   ```
2. 手札カードタップ時:
   `isMobileMode() === true` の場合、即座に `selectHandCardAndOpenMenu(idx)` をコール。
3. `updateSheetUI()` による動的UI生成:
   - **単一カード選択時**:
     - カード名称・種別バッジ・HPのプレビューカードを表示。
     - カード種別に応じた専用ボタン（使用、バトル場、ベンチ、エネ付与対象ボタン一覧、どうぐ装備対象ボタン一覧、スタジアム、トラッシュ、ロスト、山札上/下、拡大）。
   - **複数カード選択時**:
     - `選択中: N枚` バナーを表示。
     - まとめトラッシュ、まとめロスト、まとめ山札上/下、選択ポケモンをベンチへの一括操作ボタンを表示。
   - **未選択時**:
     - ガイドテキストおよび山札ドロー、山札確認ボタンを表示。

---

## 6. 一人回しエンジン設計 (Solo Practice Engine)

### 6.1 デュアルデッキ初期化ロジック
ロビーで登録された2つのデッキ（デッキA: 先攻、デッキB: 後攻）から、双方60枚の独立したカードインスタンスを生成して初期化します。

```javascript
function startSoloBattleSetup() {
  state.isSoloMode = true;
  state.soloCurrentDeckSide = "A"; // デッキA（先攻）から開始
  // 先攻（デッキA）セットアップ
  state.myDeck = shuffleArray([...soloDeckA]);
  state.myHand = state.myDeck.splice(0, 7);
  state.myPrizes = state.myDeck.splice(0, 6);
  // 後攻（デッキB）セットアップ
  state.oppDeck = shuffleArray([...soloDeckB]);
  state.oppHand = state.oppDeck.splice(0, 7);
  state.oppPrizesList = state.oppDeck.splice(0, 6);
  state.oppPrizesCount = 6;
  ...
}
```

### 6.2 ターン終了時 上下自動ローテーション (`swapSoloTurn`)
ターン終了ボタン（`[ターン終了]`）が押下された際、現在の自分側の盤面と相手側の盤面を完全にスワップします。

```mermaid
flowchart TD
    Start[ターン終了ボタン押下] --> CheckSolo{一人回しモードか?}
    CheckSolo -- No --> NormalTurnEnd[通常ターン終了処理]
    CheckSolo -- Yes --> SwapState[盤面スワップ実行]
    
    subgraph SwapExecution [swapSoloTurn 処理内容]
        SwapCards[手札・山札・サイド・トラッシュ・ロストを交換]
        SwapPokemon[バトル場・ベンチの全ポケモンと付加情報を交換]
        SwapMeta[プレイヤー名・選択プレイマットを交換]
        ToggleSide[soloCurrentDeckSide を A ⇔ B 反転]
        IncrTurn[ターン数をインクリメント]
    end
    
    SwapState --> SwapCards --> SwapPokemon --> SwapMeta --> ToggleSide --> IncrTurn
    IncrTurn --> Render[renderAll で再描画 & ログ出力]
    Render --> End[交代完了: 常に下側を手番プレイヤーとして操作可能]
```

---

## 7. CSV棋譜出力 ＆ 完全試合再現設計

### 7.1 CSVデータ仕様
対戦中のあらゆる操作（ドロー、カード使用、エネ装着、ダメカン変更、ターン交代等）が発生するたびに、完全な盤面スナップショットをJSON化してBase64エンコードし、CSVの1行として記録します（`src/js/game/replay.js`）。
出力時は `\uFEFF`（UTF-8 BOM）を付与し、Microsoft Excelや各種スプレッドシートソフトで文字化けなく直接開ける設計です。

#### CSVフォーマット定義（全11カラム）
```csv
Step,Turn,Timestamp,Player,Action,CardName,FromZone,ToZone,Details,LogMessage,Snapshot
```

| カラム名 | 型 | 説明 | 例 |
| :--- | :--- | :--- | :--- |
| `Step` | 整数 | 1から始まる連番の手数 | `1`, `2`, `3` |
| `Turn` | 整数 | 現在のターン数 | `1` |
| `Timestamp` | 文字列 | ISO 8601 形式のタイムスタンプ | `2026-10-09T15:30:00.000Z` |
| `Player` | 文字列 | 行動したプレイヤー名 | `プレイヤーA` |
| `Action` | 文字列 | 行動種別識別子 | `MATCH_START`, `DRAW`, `PLAY`, `ATTACH_ENERGY`, `END_TURN`, `SOLO_SWAP` |
| `CardName` | 文字列 | 対象カード名（空文字可） | `リザードンex` |
| `FromZone` | 文字列 | 移動元ゾーン識別子 | `hand`, `deck`, `active`, `bench`, `playArea` |
| `ToZone` | 文字列 | 移動先ゾーン識別子 | `active`, `bench`, `trash`, `lost`, `hand` |
| `Details` | 文字列 | 補足詳細情報 | `手札からバトル場へ配置` |
| `LogMessage` | 文字列 | 画面ログに表示された日本語メッセージ | `「リザードンex」をバトル場に出しました` |
| `Snapshot` | 文字列 | 盤面全状態のJSONをBase64化した文字列 | `eyJteUhhbmQiOls...` |

### 7.2 リプレイ復元ロジック
CSVファイルをインポートすると、全行のレコードがパースされて `matchHistory` 配列に格納され、リプレイバー（再生・一時停止・ステップシーク）により任意のステップの状態を復元・同期描画します。

```javascript
function applyReplayStep(stepIndex) {
  const record = matchHistory[stepIndex];
  if (!record || !record.snapshot) return;
  restoreSnapshot(record.snapshot); // 手札・場・エネ・ダメカン・プレイマット全状態を復元
  renderAll();                      // 盤面を同期描画
  updateReplayUI(stepIndex);        // シークバー・現在ステップ数表示を更新
}
```

---

## 8. P2P通信・ネットワークアーキテクチャ設計

`src/js/net/p2p.js` では、PeerJS（WebRTC DataChannel）を利用したサーバーレス直接通信を実装しています。

### 8.1 接続確立フロー (WebRTC / PeerJS)

```mermaid
sequenceDiagram
    autonumber
    actor Host as ホスト (プレイヤーA)
    participant Broker as PeerJS シグナリングサーバー (無料CDN)
    actor Guest as ゲスト (プレイヤーB)

    Host->>Broker: new Peer("pokeca-sim-" + 6桁コード)
    Broker-->>Host: open イベント (待機開始)
    Host-->>Host: 画面に「相手の参加を待っています...」表示
    
    Guest->>Broker: new Peer() (一時ID生成)
    Broker-->>Guest: open イベント
    Guest->>Broker: peer.connect("pokeca-sim-" + 6桁コード)
    Broker->>Host: connection イベント (シグナリング完了)
    
    Note over Host,Guest: 以降は PeerJS サーバーを経由せず直接 P2P (DataChannel) 通信
    Guest->>Host: { t: "hello", name: "プレイヤーB", matId: "mat_02" }
    Host-->>Host: state.oppName, state.oppMatId を更新
    Host->>Guest: { t: "hello", name: "プレイヤーA", matId: "mat_01" }
    Guest-->>Guest: state.oppName, state.oppMatId を更新
    Host->>Guest: publicSnapshot() (自盤面公開情報)
    Guest->>Host: publicSnapshot() (自盤面公開情報)
```

### 8.2 メッセージプロトコル仕様

DataChannelを通じて送信されるJSONメッセージは `t` プロパティ（Type）で識別されます。

#### 1. 接続挨拶メッセージ (`t: "hello"`)
接続確立直後に送信し、互いの表示名と選択プレイマットを同期します。
```json
{
  "t": "hello",
  "name": "プレイヤーA",
  "matId": "mat_01"
}
```

#### 2. 公開盤面同期スナップショット (`t: "state"`)
盤面変化時（`renderAll()` 呼び出し時）に `syncSoon()`（60msデバウンス）を介して送信されます。
```json
{
  "t": "state",
  "name": "プレイヤーA",
  "matId": "mat_01",
  "handCount": 5,
  "deckCount": 42,
  "prizes": 6,
  "trash": [ { "name": "博士の研究", "uid": "c_1", "type": "trainer", "color": "trainer" } ],
  "lostCount": 0,
  "active": { "card": { "name": "リザードンex" }, "damage": 20, "energies": [...], "tool": null },
  "bench": [ { ... }, null, null, null, null ],
  "stadium": { "name": "ボウルタウン", "uid": "c_stadium_1" },
  "stadiumTs": 1728456789123,
  "turn": 3
}
```

### 8.3 情報隠蔽・不正防止モデル
対戦相手の不正覗き見を防止するため、**手札カード・山札カード・サイドカードの中身は相手に送信しません**。
- 送信されるのは `handCount`（手札枚数）、`deckCount`（山札枚数）、`prizes`（サイド枚数）のみです。
- 受信側は裏面画像または数字バッジとしてのみ相手の手札・山札・サイドを表示します。
- バトル場・ベンチ・トラッシュ・スタジアムなど「場に公開されたカード情報」のみ実データが共有されます。

### 8.4 スタジアム共有ゾーンの競合解決 (Last Write Wins)
スタジアムは両プレイヤー共通の1枠しかない共有ゾーンです。
- スタジアムが場に出された時、変更元のクライアントが `stadiumTs = Date.now()`（ミリ秒タイムスタンプ）を記録します。
- スナップショット受信時、`received.stadiumTs > local.stadiumTs` の場合のみ相手のスタジアムで上書きします。これにより通信遅延による古いスタジアム情報での意図しない上書きを防止します。

### 8.5 相手カードUIDの衝突防止 (`opp:` プレフィックス)
相手から受信したカードデータ（バトル場、ベンチ、トラッシュ、スタジアム）は、ローカルのカードUIDと衝突しないよう、UIDの先頭に `opp:` プレフィックスを自動付与して格納します（例: `opp:c_12`）。

---

## 9. 状態異常・ベンチ拡張・演出設計 (v7.0)

### 9.1 特殊状態（状態異常）管理とエフェクト
1. **状態異常の種別と競合ルール**:
   - `どく` (Poison): 毎ポケモンチェックに+10ダメージ。紫色のアニメーション気泡エフェクト（`.condition-poison-bubbles`）。
   - `やけど` (Burn): 毎ポケモンチェックに+20ダメージ。オレンジ・赤の燃焼炎パーティクルエフェクト（`.condition-burn-flames`）。
   - `まひ` / `こんらん` / `ねむり`: 3状態は公式ルールに基づき**排他制御**（いずれか1つのみ）。
     - まひ: 黄色の稲妻・スパークエフェクト（`.condition-paralyzed-sparks`）。
     - こんらん: 頭上のぐるぐる星・混乱エフェクト（`.condition-confused-stars`）。
     - ねむり: 浮遊する「Zzz」スリープエフェクト（`.condition-asleep-zzz`）。
   - どく・やけどは同時に重複して付加可能。
2. **自動解除トリガー**:
   - ベンチへの後退・入れ替え時（`swapBenchActive` 等）。
   - ポケモン進化時（`evolveActiveWithSelectedHand`, `evolveBenchWithSelectedHand`）。
3. **コンテキストメニューUI**:
   - ポケモンカードクリック時のメニューを2列化。
   - 「特殊状態」および「ダメカン操作」はサブメニューモーダルへ整理。
   - かかっている特殊状態のボタンは「○○を治す」トグル表記に動的変更。

### 9.2 ベンチ枠数拡張 (5枠 ⇔ 8枠)
- 通常上限は5枠。特性（テラスタルオーブ等）やスタジアム（ゼロの大空洞等）に応じて「ベンチ枠を8にする」ボタンを表示。
- 8枠モード時は「ベンチ枠を5にする」ボタンを表示。
- 5枠へ戻す際、ベンチに6匹以上のポケモンが存在する場合は「ポケモントラッシュ選択モーダル」を自動展開し、超過分をトラッシュするまで確定させない安全設計。

### 9.3 ターン表示・演出強化
- プレイヤー名の左側にターン中を示す「赤丸インジケーター」を表示。
- プレイヤー名の右側に「先攻」「後攻」バッジを明示。
- ターン表記は「先攻Xターン目」「後攻Xターン目」の正式表記。
- ターン開始・ターン交代時に「○○のターン（ターン数）」が右から流れて中央で静止、左へ流れるスライドバナー演出（2秒）。
- ターン最初の強制トップドロー機能と、ドローカードの大画面スポットライト演出。
- 相手ポケモンに対する操作メニュー（ダメカン・特殊状態・バトル場への呼び出し＝ボスの指令等）を実装。
- 勝敗決定時の勝利エフェクト（紙吹雪パーティクル・クラッカー放射・ゴールドトロフィー）のド派手演出。

### 9.4 UI/UX操作統一・連打・テンポラリ選択・シャッフル演出 (v9.0)

1. **ダメカン連打対応設計**:
   - `modifyDamage(location, index, delta, keepMenu = false)` / `modifyOpponentDamage(location, index, delta, keepMenu = false)` を拡張。
   - ダメカン操作サブメニューのボタン押下時は `keepMenu = true` とし、`#ctx` を閉じずに保持。
   - `renderAll()` により盤面のHP/ダメカン表示を更新すると同時に、メニュー上部の「現在: ○○」表示をリアルタイム更新。
   - サブメニューヘッダーの「✖」ボタンおよび下部の「✖ 完了（閉じる）」ボタンにより明示的に閉じられる設計。

2. **手札右クリックメニューの対象名ホバー展開**:
   - 「ポケモンにつける対象」「重ねて進化させる対象」ボタンに `data-fullname` 属性および `title` 属性を付与。
   - CSS擬似要素 `.ctx-sub-target[data-fullname]:hover::after` により、マウスオーバー時に完全なカード名・HP情報（例: `ベンチ1: かがやくゲッコウガ (HP130)`）が浮き出るカスタムツールチップを表示。
   - ボタン自体のテキストもホバー時に展開し、狭小カラムによる省略表示（`...`）を解消。

3. **テンポラリエリア個別選択 ＆ 移動制御**:
   - `state.selectedTempIndices`（`Set`）を導入。テンポラリカードをクリックすることで選択/選択解除（`.selected`によるゴールド枠 ＆ `✔ 選択中`バッジ）。
   - `extractTempCards()` 関数により、選択カードがある場合は選択分のみを抽出、未選択時は全カードを一括抽出。
   - `moveTempToHand`, `moveTempToTop`, `moveTempToBottom`, `moveTempToTrash` が選択抽出に対応。
   - 各アクションボタンの表示テキストを選択状態に応じて「手札に加える (選択N枚)」/「手札に加える (すべて)」と動的連動。

4. **全フィールドの操作系統一（Click / DblClick / ContextMenu）**:
   - 手札、自分バトル場、自分ベンチ、相手バトル場、相手ベンチで共通の操作インターフェースを確立：
     - **左クリック（Click）**: カード選択（青色発光枠 `.field-selected` の付与/解除）。
     - **ダブルクリック（DblClick）**: カード詳細モーダル拡大（`openCardZoom`）。
     - **右クリック（ContextMenu）**: 操作メニュー（`showPokemonMenu` / `showOpponentPokemonMenu`）。
   - タッチデバイス・スマホ判定時はタップ操作でメニューを展開し、モバイル環境の操作性を担保。

5. **ド派手な山札シャッフル演出 (Grand 3D Shuffle)**:
   - `playDeckShuffleEffect(isOpponent)` を大改修。
   - 山札位置から複数枚のカードパックが空中へ舞い上がり、左右に分割（`pack-left`, `pack-right`）。
   - 3Dパースペクティブ（`perspective: 1200px`）のもと、左右の束が激しく交差・リッフル回転して混ざり合うアニメーション。
   - 合体時の黄金フラッシュバースト（`fx-shuffle-flash`）および立体ポップアップバッジ（`🔀 SHUFFLE!!`）を画面上に展開。WebRTC同期により対戦相手の画面でも同等の演出を再生。

### 9.5 バトル場不在時の出撃選出フェーズ・操作ロック・敗北判定設計 (v10.0)

1. **ターン開始時におけるバトル場検証フロー**:
   - `P2P` 経由のターン交代メッセージ（`msg.t === "turn_change"`）受信後、または一人回しモードでのターン終了（`endTurn`）後のターンバナー演出完了時、`checkTurnStartActiveCondition(onReady)` を呼び出し。
   - `state.myActive` が存在する場合は通常通り `executeTurnStartDraw()`（ターン開始トップドロー）を実行。

2. **出撃選出フェーズ（ベンチにポケモンが存在する場合）**:
   - `state.mustPromoteToActive = true` を設定。
   - `showPromoteActiveModal(benchIndices, onComplete)` により、背景クリックや外枠クリックで閉じないモーダル（`dismissible: false`、`dataset.noBackdropClose = "true"`）を表示。
   - ベンチにいる全ポケモンカード（画像、HP、ダメージ、エネルギー数、どうぐ）と「⚔️ バトル場に出す」ボタンを一覧表示。
   - **完全操作ロック機構**:
     - `document.addEventListener("click", ..., true)` および `contextmenu`（キャプチャリングフェーズ）により、モーダル外（ロビー退室ボタン等を除く）の全クリック・右クリックを完全ブロックし、警告トーストを表示。
     - ターン終了ボタンは `state.mustPromoteToActive` 時「出撃待ち」表記となり `disabled` 化。
     - 山札ドロー、手札コンテキストメニュー、場のポケモンメニュー、空バトル場へのドロップ・クリックも全てガード。
   - プレイヤーが「⚔️ バトル場に出す」を押下すると、`promoteBenchToActive(benchIndex)` が実行され、`swapActiveBench` でバトル場へ配置、P2P同期、モーダルクローズ、`mustPromoteToActive = false` 解除を行い、コールバック経由で `executeTurnStartDraw()`（ターン開始トップドロー）が安全に発火。

3. **敗北判定（バトル場不在かつベンチにもポケモンがいない場合）**:
   - `benchIndices.length === 0` を検知した場合、即座に `handleNoPokemonDefeat()` を実行。
   - 対戦ログに「場にポケモンがいなくなったため敗北」を記録。
   - P2P対戦モードでは相手へ `P2P.send({ t: "victory", winnerName: state.oppName, reason: "..." })` を送信。
   - 自画面では対戦決着/敗北オーバーレイ画面（`playGrandVictoryEffect`）を表示し、相手画面では完全な勝利エフェクト（トロフィー・紙吹雪）を自動再生。

---

## 10. 非機能要件・セキュリティ設計

1. **完全オフライン対応 & ゼロビルド**:
   - WebpackやVite等のビルドツールを必要とせず、`src/index.html` をブラウザで直接開くだけで即座に動作。
   - 外部サーバーへの依存はP2Pシグナリング用のPeerJS CDNのみで、通信確立後は完全にブラウザ間直接通信。
2. **P2P通信セキュリティ**:
   - WebRTC DataChannel は DTLS (Datagram Transport Layer Security) によりエンドツーエンドで強力に暗号化。
3. **localStorage 容量管理**:
   - 自作プレイマット画像はアップロード時にBase64 DataURL化を実施。ブラウザのストレージクォータ（約5MB〜10MB）を逸脱しないよう数MB以内の画像を推奨し、例外時はアラートで安全にハンドリング。
4. **クロスデバイス互換性**:
   - PC（Chrome, Edge, Safari, Firefox）およびスマホ・タブレット（iOS Safari, Android Chrome）に対応。
   - タッチイベントとHTML5 Drag & Drop を併用したハイブリッドD&Dエンジンにより一貫した操作感を提供。

---

## 11. 設計変更履歴

| 版数 | 日付 | 改定内容 | 承認 |
| :--- | :--- | :--- | :--- |
| v1.0 | 2026-10-09 | 初版作成（P2P対戦、手動盤面操作、公式デッキコード読込） | プロジェクトチーム |
| v2.0 | 2026-10-09 | 複数選択・矩形ドラッグ、エネルギーバッジD&D、ポケモンのどうぐタブ、スタジアムD&D、CSV完全試合再現機能を追加 | プロジェクトチーム |
| v3.0 | 2026-10-09 | プレイマット2分割表示・自作登録、一人回し機能（2デッキ登録＆ターン終了時上下自動スワップ）、ロビースクロール修正を追加 | プロジェクトチーム |
| v4.0 | 2026-10-09 | スマホ用タッチドラッグ＆ドロップエンジン、手札タップ時ボトムシート自動展開＆カード専用アクションメニューを追加 | プロジェクトチーム |
| v5.0 | 2026-10-09 | `src/` ディレクトリへの機能別モジュール分割（15モジュール構成）、PeerJSによる実P2Pオンライン通信実装、CSVスキーマ拡張（全11列）、スタジアム競合解決（Last Write Wins）を追加 | プロジェクトチーム |
| v5.1 | 2026-10-09 | デッキ解析エンジン（`deck-parser.js`）実装。公式デッキコード・公式テキスト貼付・5種プリセット選択・対戦開始時の実デッキ反映に対応 | プロジェクトチーム |
| v5.2 | 2026-10-09 | 公式デッキコード直接取得の強化（調査メモに基づくふなむしAPI/公式HTML直結取得・CORS完全対応・カード画像全60枚自動取得＆盤面/手札/拡大モーダルでの実カード画像描画・ロビープレビューギャラリー追加） | プロジェクトチーム |
| v6.0 | 2026-10-09 | 対戦準備フェーズ新設（コイントスによる先攻後攻決定・初期手札7枚/バトル場空展開・たね配置・マリガン不正防止・裏面秘匿・オープン演出）およびP2P接続同期/スクリプト読込順序の不具合改修 | プロジェクトチーム |
| v7.0 | 2026-10-13 | 特殊状態管理（どく/やけど/まひ/こんらん/ねむり）とCSSパーティクルエフェクト、ベンチ枠拡張（5枠⇔8枠切り替え＆超過時トラッシュモーダル）、2列コンテキストメニュー＆サブメニュー化、相手ポケモン操作対応、先攻/後攻ターン表記＆スライド演出、強制トップドロー演出、ド派手勝利演出、およびバトル場配置バグ改修（handActive/placeSelectedHandToActive/空バトル場枠クリック） | プロジェクトチーム |
| v8.0 | 2026-10-14 | 1手順巻き戻し（Undo）機能、特性使用済みマーク表示＆ターン終了時リセット、進化時確認ポップアップ、コンテキストメニュー下見切れ対策（自動上向き展開＆スクロール保護）、手札右クリック専用メニュー（「使用する」および制限なしバトル場/ベンチ配置）、マリガン確認カードの画像描画バグ改修、マリガン確認画面の誤消失・進行不能防止（背景クリック保護＆待機バナー再表示ボタン） | プロジェクトチーム |
| v9.0 | 2026-10-14 | ダメカン連打対応（メニュー開いたまま維持＆完了ボタン）、手札右クリックメニューの付与対象名ホバーツールチップ表示、テンポラリエリアのカード個別選択と移動操作、全フィールドの操作系統一（左クリック=選択、ダブルクリック=拡大、右クリック=メニュー）、ド派手な山札シャッフル演出（空中3Dリッフル＆フラッシュ） | プロジェクトチーム |
| v10.0 | 2026-10-14 | ターン開始時のバトル場不在チェック（ベンチ出撃選出フェーズ、キャプチャリングによる完全操作ロック、出撃完了後のトップドロー再開、およびベンチ不在時の公式敗北判定・勝敗通知・画面演出） | プロジェクトチーム |
