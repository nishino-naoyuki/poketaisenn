/* 【通信】PeerJS(WebRTC)によるP2Pオンライン対戦モジュール
 *
 * 接続仕様:
 *   - Peer ID形式: room-XXXXXX (6桁のランダム数字)
 *   - シグナリング: PeerJS Cloud
 *   - 経路探索: Google公開STUNサーバー (stun.l.google.com:19302, stun1.l.google.com:19302)
 *   - 接続定員: 最大2名 (オーナー1名 + 参加者1名、3人目の接続要求は拒否)
 *
 * 今後の拡張事項 (セキュリティ・認証):
 *   - 6桁のルーム番号(100000〜999999)は総当たりや推測の可能性があるため、
 *     将来的にはオーナー側での「参加承認(Approve/Reject)ダイアログ」や
 *     合言葉(パスフレーズ)による追加認証をハンドシェイク時に導入可能な構造としている。
 */

const peerConfig = {
  config: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ]
  }
};

const P2P_STATES = Object.freeze({
  UNCONNECTED: "未接続",
  CREATING_ROOM: "ルーム作成中",
  WAITING_FOR_PEER: "参加者待機中",
  CONNECTING: "接続中",
  CONNECTED: "P2P接続確立",
  CONNECTION_FAILED: "接続失敗",
  DISCONNECTED: "切断"
});

const P2P = {
  PREFIX: "room-",
  STATES: P2P_STATES,
  MAX_RETRY_COUNT: 5,
  CONNECT_TIMEOUT_MS: 15000,

  peer: null,
  conn: null,
  role: null,                 // "host" | "guest" | null
  roomCode: null,             // 6桁のルーム番号文字列
  connected: false,
  connectionState: P2P_STATES.UNCONNECTED,
  lastError: null,

  _timer: null,
  _connectTimeoutTimer: null,
  _retryCount: 0,
  _closingIntentionally: false,
  _lastStadiumUid: null,

  // ---- 公開API (既存プログラムからの状態判定・DataConnection取得用) ----
  isConnected() {
    return Boolean(this.connected && this.conn && this.conn.open);
  },

  getConnection() {
    return this.conn;
  },

  getState() {
    return this.connectionState;
  },

  generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  toPeerId(code) {
    const clean = String(code || "").trim();
    return clean.startsWith(this.PREFIX) ? clean : `${this.PREFIX}${clean}`;
  },

  // ---- 接続状態の管理・画面表示更新 ----
  _setState(newState, detailText = "", lamp = null) {
    this.connectionState = newState;

    if (!lamp) {
      switch (newState) {
        case P2P_STATES.CONNECTED:
          lamp = "green";
          break;
        case P2P_STATES.CREATING_ROOM:
        case P2P_STATES.WAITING_FOR_PEER:
        case P2P_STATES.CONNECTING:
          lamp = "yellow";
          break;
        case P2P_STATES.CONNECTION_FAILED:
        case P2P_STATES.DISCONNECTED:
          lamp = "red";
          break;
        default:
          lamp = "gray";
          break;
      }
    }

    const displayMessage = detailText ? `${newState}（${detailText}）` : newState;
    this._status(displayMessage, lamp);
    this._updateLobbyControls();
  },

  _escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },

  _status(text, lamp = "gray") {
    const el = document.getElementById("conn-status");
    const safeText = this._escapeHtml(text);
    if (el) {
      if (lamp === "green") {
        el.innerHTML = `<span class="status-lamp">🟢</span> ${safeText}`;
        el.style.color = "#059669";
        el.style.fontWeight = "bold";
      } else if (lamp === "yellow") {
        el.innerHTML = `<span class="status-lamp">🟡</span> ${safeText}`;
        el.style.color = "#d97706";
        el.style.fontWeight = "bold";
      } else if (lamp === "red") {
        el.innerHTML = `<span class="status-lamp">🔴</span> ${safeText}`;
        el.style.color = "#dc2626";
        el.style.fontWeight = "bold";
      } else {
        el.innerHTML = `<span class="status-lamp">⚪</span> ${safeText}`;
        el.style.color = "#64748b";
        el.style.fontWeight = "normal";
      }
    }
  },

  _updateLobbyControls() {
    const startBtn = document.getElementById("btn-start");
    if (startBtn) {
      if (this.connected) {
        startBtn.disabled = false;
        startBtn.textContent = "🟢 相手と接続しました！（対戦開始）";
        startBtn.classList.remove("gold");
        startBtn.classList.add("green");
      } else {
        startBtn.disabled = true;
        startBtn.classList.remove("green");
        startBtn.classList.add("gold");
        if (this.connectionState === P2P_STATES.CREATING_ROOM) {
          startBtn.textContent = "ルーム作成中...";
        } else if (this.connectionState === P2P_STATES.CONNECTING) {
          startBtn.textContent = "オーナーへ接続中...";
        } else {
          startBtn.textContent = "相手の接続待ち...";
        }
      }
    }

    const testPanel = document.getElementById("p2p-test-panel");
    if (testPanel) {
      if (this.connected) {
        testPanel.classList.remove("hidden");
      } else {
        testPanel.classList.add("hidden");
      }
    }
  },

  _clearTimeoutTimer() {
    if (this._connectTimeoutTimer) {
      clearTimeout(this._connectTimeoutTimer);
      this._connectTimeoutTimer = null;
    }
  },

  _startTimeoutTimer(onTimeout) {
    this._clearTimeoutTimer();
    this._connectTimeoutTimer = setTimeout(() => {
      this._connectTimeoutTimer = null;
      onTimeout();
    }, this.CONNECT_TIMEOUT_MS);
  },

  _destroy() {
    this._clearTimeoutTimer();
    this._closingIntentionally = true;
    if (window.VoiceChat) {
      VoiceChat.resetVoiceCallState();
    }
    try { if (this.conn) this.conn.close(); } catch (e) {}
    try { if (this.peer) this.peer.destroy(); } catch (e) {}
    this.peer = null;
    this.conn = null;
    this.connected = false;
    this._closingIntentionally = false;
  },

  available() {
    if (typeof Peer === "undefined") {
      this.lastError = "peerjs-not-loaded";
      this._setState(
        P2P_STATES.CONNECTION_FAILED,
        "通信ライブラリ(PeerJS)を読み込めませんでした。ネットワーク接続を確認してください"
      );
      return false;
    }
    return true;
  },

  _peerConfig() {
    return {
      debug: 1,
      config: peerConfig.config
    };
  },

  // ---- オーナー側: ルーム作成 ＆ 待機 ----
  createRoom() {
    this._retryCount = 0;
    const roomBox = document.getElementById("room-box");
    const roomNoEl = document.getElementById("room-no");
    if (roomBox) roomBox.classList.add("hidden");
    if (roomNoEl) roomNoEl.textContent = "";

    const code = this.generateRoomCode();
    return this.host(code);
  },

  host(code) {
    if (!this.available()) return false;
    this._destroy();
    this.role = "host";
    this.lastError = null;

    const cleanCode = String(code || this.generateRoomCode()).trim();
    this.roomCode = cleanCode;

    // 登録成功まではルーム番号ボックスを表示しない
    const roomBox = document.getElementById("room-box");
    if (roomBox) roomBox.classList.add("hidden");

    this._setState(P2P_STATES.CREATING_ROOM, "PeerJS Cloudへ登録しています...");

    const peerId = this.toPeerId(cleanCode);
    try {
      this.peer = new Peer(peerId, this._peerConfig());
    } catch (err) {
      this.lastError = err;
      this._setState(P2P_STATES.CONNECTION_FAILED, "Peerの初期化に失敗しました");
      return false;
    }

    // PeerJS Cloudへの登録タイムアウト監視
    this._startTimeoutTimer(() => {
      if (this.connectionState === P2P_STATES.CREATING_ROOM) {
        this._destroy();
        this._setState(
          P2P_STATES.CONNECTION_FAILED,
          "シグナリングサーバー(PeerJS Cloud)への接続がタイムアウトしました"
        );
      }
    });

    this.peer.on("open", (registeredId) => {
      this._clearTimeoutTimer();
      this._retryCount = 0;
      state.roomNo = cleanCode;

      // 登録が成功した場合にのみルーム番号を画面に表示する
      const roomNoEl = document.getElementById("room-no");
      const boxEl = document.getElementById("room-box");
      if (roomNoEl) roomNoEl.textContent = cleanCode;
      if (boxEl) boxEl.classList.remove("hidden");

      this._setState(P2P_STATES.WAITING_FOR_PEER, `ルーム番号: ${cleanCode} / Peer ID: ${registeredId}`);
      if (typeof showToast === "function") {
        showToast(`ルーム ${cleanCode} を作成しました`);
      }
    });

    this.peer.on("connection", (incomingConn) => {
      // 3人目の参加要求を拒否し、2人対戦の制限を維持する
      if (this.conn && (this.connected || this.connectionState === P2P_STATES.CONNECTING)) {
        console.warn("[P2P] 3人目の参加要求を拒否しました:", incomingConn.peer);
        this._appendTestLog(`⚠️ 3人目の参加要求(${incomingConn.peer})を拒否しました（定員2名）`);
        incomingConn.on("open", () => {
          try {
            incomingConn.send({
              t: "error",
              code: "room_full",
              message: "このルームは既に2人対戦中のため参加できません（定員2名）"
            });
          } catch (e) {}
          setTimeout(() => {
            try { incomingConn.close(); } catch (e) {}
          }, 150);
        });
        setTimeout(() => {
          try { incomingConn.close(); } catch (e) {}
        }, 3000);
        return;
      }

      this._setState(P2P_STATES.CONNECTING, "参加者とP2P接続を確立中...");
      this._startTimeoutTimer(() => {
        if (!this.connected && this.connectionState === P2P_STATES.CONNECTING) {
          try { incomingConn.close(); } catch (e) {}
          this.conn = null;
          this._setState(
            P2P_STATES.WAITING_FOR_PEER,
            `参加者の接続がタイムアウトしました。再度待機中 (ルーム番号: ${this.roomCode})`
          );
        }
      });
      this._bind(incomingConn);
    });

    this.peer.on("call", (incomingCall) => {
      if (window.VoiceChat) {
        VoiceChat.handlePeerIncomingCall(incomingCall);
      }
    });

    this.peer.on("disconnected", () => {
      if (!this.connected && !this._closingIntentionally) {
        this._setState(P2P_STATES.CONNECTION_FAILED, "PeerJS Cloudとの接続が切断されました");
      }
    });

    this.peer.on("error", (err) => {
      this._clearTimeoutTimer();
      this.lastError = err;
      const errType = err && err.type ? err.type : "unknown";
      console.warn("[P2P Host Error]", errType, err);

      // 番号がすでに登録されている場合は、新しい番号で再試行する
      if (errType === "unavailable-id") {
        if (this._retryCount < this.MAX_RETRY_COUNT) {
          this._retryCount++;
          const nextCode = this.generateRoomCode();
          console.log(`[P2P] ルーム番号重複のため再試行します (${this._retryCount}/${this.MAX_RETRY_COUNT}): ${nextCode}`);
          this.host(nextCode);
          return;
        }
        this._setState(
          P2P_STATES.CONNECTION_FAILED,
          "ルーム番号が重複しています。しばらく待ってからもう一度作成してください"
        );
        return;
      }

      this._handlePeerError(errType);
    });

    return true;
  },

  // ---- 参加者側: ルーム参加 ----
  join(code) {
    if (!this.available()) return false;

    const cleanCode = String(code || "").trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      this.lastError = "invalid-room-code";
      this._setState(P2P_STATES.CONNECTION_FAILED, "6桁の数字のルーム番号を入力してください");
      return false;
    }

    this._destroy();
    this.role = "guest";
    this.roomCode = cleanCode;
    this.lastError = null;
    state.roomNo = cleanCode;

    const targetPeerId = this.toPeerId(cleanCode);
    this._setState(P2P_STATES.CONNECTING, `ルーム ${cleanCode} (${targetPeerId}) へ接続中...`);

    try {
      this.peer = new Peer(this._peerConfig());
    } catch (err) {
      this.lastError = err;
      this._setState(P2P_STATES.CONNECTION_FAILED, "Peerの初期化に失敗しました");
      return false;
    }

    // 接続タイムアウト監視
    this._startTimeoutTimer(() => {
      if (!this.connected) {
        this._destroy();
        this._setState(
          P2P_STATES.CONNECTION_FAILED,
          "接続タイムアウト: オーナーからの応答がありません。ルーム番号や通信環境を確認してください"
        );
      }
    });

    this.peer.on("open", () => {
      if (!this.peer || this.peer.destroyed) return;
      const conn = this.peer.connect(targetPeerId, {
        reliable: true
      });
      this._bind(conn);
    });

    this.peer.on("call", (incomingCall) => {
      if (window.VoiceChat) {
        VoiceChat.handlePeerIncomingCall(incomingCall);
      }
    });

    this.peer.on("disconnected", () => {
      if (!this.connected && !this._closingIntentionally) {
        this._clearTimeoutTimer();
        this._setState(P2P_STATES.CONNECTION_FAILED, "PeerJS Cloudとの接続が切断されました");
      }
    });

    this.peer.on("error", (err) => {
      this._clearTimeoutTimer();
      this.lastError = err;
      const errType = err && err.type ? err.type : "unknown";
      console.warn("[P2P Guest Error]", errType, err);

      if (errType === "peer-unavailable") {
        this._destroy();
        this._setState(
          P2P_STATES.CONNECTION_FAILED,
          `存在しないルーム番号です（${cleanCode}）。番号を確認してください`
        );
        return;
      }

      this._handlePeerError(errType);
    });

    return true;
  },

  _handlePeerError(errType) {
    let detail = `通信エラー (${errType})`;
    if (errType === "network" || errType === "server-error" || errType === "socket-error" || errType === "socket-closed") {
      detail = "PeerJS Cloudへの接続に失敗しました。インターネット接続を確認してください";
    } else if (errType === "browser-incompatible") {
      detail = "お使いのブラウザはWebRTCに対応していません";
    } else if (errType === "ssl-unavailable") {
      detail = "SSL通信が利用できないためPeerJS Cloudへ接続できません";
    } else if (errType === "webrtc") {
      detail = "STUNによるP2P通信経路の探索またはWebRTC接続に失敗しました";
    }
    this._setState(P2P_STATES.CONNECTION_FAILED, detail);
  },

  // ---- DataConnection バインド・双方向通信・切断監視 ----
  _bind(conn) {
    this.conn = conn;

    // ICE Connection State の監視 (STUN経路探索失敗や切断の検知)
    const attachIceMonitor = () => {
      const pc = conn.peerConnection;
      if (!pc || pc._p2pMonitored) return;
      pc._p2pMonitored = true;
      pc.addEventListener("iceconnectionstatechange", () => {
        const iceState = pc.iceConnectionState;
        console.log("[P2P ICE State]", iceState);
        if (iceState === "failed") {
          this._clearTimeoutTimer();
          const wasConnected = this.connected;
          this.connected = false;
          if (wasConnected) {
            this._setState(P2P_STATES.DISCONNECTED, "P2P通信経路が失われました (ICE failed)");
          } else {
            this._setState(P2P_STATES.CONNECTION_FAILED, "STUNによるP2P通信経路の探索に失敗しました");
          }
          if (typeof renderAll === "function") renderAll();
        } else if (iceState === "closed" || iceState === "disconnected") {
          if (this.connected && !this._closingIntentionally) {
            this.connected = false;
            this._setState(P2P_STATES.DISCONNECTED, "相手とのP2P通信が切断されました");
            if (typeof renderAll === "function") renderAll();
          }
        }
      });
    };

    attachIceMonitor();

    conn.on("open", () => {
      attachIceMonitor();
      // 3人目として拒否されるケースに備え、少し待つかメッセージ受信も処理する
      // ただし仕様「接続成功はPeerJSのDataConnectionが open 状態になった時点で判定」に従い即座に判定
      this._clearTimeoutTimer();
      this.connected = true;
      this.lastError = null;
      this._setState(P2P_STATES.CONNECTED, `ルーム: ${this.roomCode}`);

      if (typeof showToast === "function") {
        showToast("P2P接続が確立しました！");
      }

      this._sendHello();
      // 双方向通信の検証用確認メッセージ(ping)を送信
      this.send({
        t: "conn_check",
        phase: "syn",
        from: this.role,
        ts: Date.now()
      });
      this.syncNow();
      this.updateWebRTCStatsUI();
      if (typeof renderAll === "function") renderAll();
    });

    conn.on("data", (msg) => this._onData(msg));

    conn.on("close", () => {
      this._clearTimeoutTimer();
      const wasConnected = this.connected;
      this.connected = false;
      this.conn = null;

      // 3人目拒否などのエラーが既にセットされている場合は上書きしない
      if (this.connectionState === P2P_STATES.CONNECTION_FAILED) {
        if (typeof renderAll === "function") renderAll();
        return;
      }

      if (wasConnected || !this._closingIntentionally) {
        this._setState(P2P_STATES.DISCONNECTED, "相手との接続が切断されました");
        if (typeof showToast === "function") {
          showToast("相手とのP2P接続が切断されました");
        }
      }
      if (typeof renderAll === "function") renderAll();
    });

    conn.on("error", (err) => {
      this._clearTimeoutTimer();
      console.warn("[P2P DataConnection Error]", err);
      const wasConnected = this.connected;
      this.connected = false;
      if (wasConnected) {
        this._setState(P2P_STATES.DISCONNECTED, "P2P通信エラーにより切断されました");
      } else {
        this._setState(P2P_STATES.CONNECTION_FAILED, "データ通信チャネルの確立に失敗しました");
      }
      if (typeof renderAll === "function") renderAll();
    });
  },

  // ---- 明示的な切断処理 ----
  disconnect() {
    if (this.connected && this.conn && this.conn.open) {
      try {
        this.conn.send({ t: "peer_disconnect", reason: "user_disconnect" });
      } catch (e) {}
    }
    this._destroy();
    const roomBox = document.getElementById("room-box");
    if (roomBox) roomBox.classList.add("hidden");
    this._setState(P2P_STATES.DISCONNECTED, "接続を切断しました");
    if (typeof showToast === "function") {
      showToast("P2P接続を切断しました");
    }
    if (typeof renderAll === "function") renderAll();
  },

  // ---- 双方向テストメッセージ送信 ----
  sendTestMessage(text) {
    if (!this.isConnected()) {
      if (typeof showToast === "function") showToast("P2P接続が確立されていません");
      return false;
    }
    const cleanText = String(text || "").trim() || "テストメッセージ (Ping)";
    const payload = {
      t: "test_message",
      sender: this.role === "host" ? "オーナー" : "参加者",
      name: (document.getElementById("in-name")?.value.trim()) || state.myName,
      text: cleanText,
      ts: Date.now()
    };
    this.send(payload);
    this._appendTestLog(`📤 送信: ${cleanText}`);
    return true;
  },

  _appendTestLog(line) {
    const logEl = document.getElementById("p2p-test-log");
    if (!logEl) return;
    const timeStr = new Date().toLocaleTimeString("ja-JP", { hour12: false });
    const item = document.createElement("div");
    item.className = "p2p-test-log-item";
    item.textContent = `[${timeStr}] ${line}`;
    logEl.appendChild(item);
    logEl.scrollTop = logEl.scrollHeight;
  },

  // ---- WebRTCの直接P2P通信経路情報取得 ----
  async getWebRTCStats() {
    const pc = this.conn && this.conn.peerConnection;
    if (!pc || typeof pc.getStats !== "function") return null;
    try {
      const stats = await pc.getStats();
      let activePair = null;
      const candidates = new Map();

      stats.forEach((report) => {
        if (report.type === "local-candidate" || report.type === "remote-candidate") {
          candidates.set(report.id, report);
        }
        if (report.type === "candidate-pair" && (report.state === "succeeded" || report.nominated)) {
          if (!activePair || report.nominated) {
            activePair = report;
          }
        }
      });

      if (!activePair) return { state: pc.iceConnectionState };
      const local = candidates.get(activePair.localCandidateId);
      const remote = candidates.get(activePair.remoteCandidateId);
      return {
        state: pc.iceConnectionState,
        localType: local ? local.candidateType : "unknown",
        remoteType: remote ? remote.candidateType : "unknown",
        protocol: local ? local.protocol : "unknown",
        isDirectP2P: local && remote ? (local.candidateType !== "relay" && remote.candidateType !== "relay") : true
      };
    } catch (e) {
      return null;
    }
  },

  async updateWebRTCStatsUI() {
    const infoEl = document.getElementById("p2p-webrtc-info");
    if (!infoEl) return;
    const info = await this.getWebRTCStats();
    if (!info) {
      infoEl.textContent = "経路情報: WebRTC DataChannel (取得待機中)";
      return;
    }
    if (info.localType && info.remoteType) {
      const directLabel = info.isDirectP2P ? "直接P2P通信" : "リレー通信";
      infoEl.textContent = `経路: ${directLabel} (Local: ${info.localType} ⇄ Remote: ${info.remoteType} / ${String(info.protocol || "udp").toUpperCase()})`;
    } else {
      infoEl.textContent = `経路状態: ICE ${info.state || "connected"}`;
    }
  },

  // ---- 送信 ----
  send(msg) {
    if (this.connected && this.conn && this.conn.open) {
      console.log("[P2P SEND]", msg?.t);
      this.conn.send(msg);
    }
  },

  _sendHello() {
    const nameEl = document.getElementById("in-name");
    const name = (nameEl && nameEl.value.trim()) || state.myName;
    const matSync = (typeof getMyPlaymatSyncData === "function")
      ? getMyPlaymatSyncData()
      : { matId: state.myMatId, matDataUrl: null };
    this.send({
      t: "hello",
      name,
      matId: matSync.matId,
      matDataUrl: matSync.matDataUrl,
      deck: state.myLoadedDeck || SAMPLE_DECK
    });
  },

  _canSync() {
    return this.connected && !state.isSoloMode && !(typeof replayState !== "undefined" && replayState.isActive);
  },

  publicSnapshot() {
    const uid = state.stadium ? state.stadium.uid : null;
    if (uid !== this._lastStadiumUid) {
      state.stadiumTs = Date.now();
      this._lastStadiumUid = uid;
    }
    return {
      t: "state",
      name: state.myName,
      matId: state.myMatId,
      sleeveId: state.mySleeveId,
      sleeveDataUrl: state.mySleeveDataUrl,
      handCount: state.myHand.length,
      deckCount: state.myDeck.length,
      prizes: state.myPrizes.length,
      trash: state.myTrash,
      lostCount: state.myLost.length,
      active: state.myActive,
      bench: state.myBench,
      playCard: state.playCard,
      stadium: state.stadium,
      stadiumTs: state.stadiumTs || 0,
      benchLimit: state.myBenchLimit || 5,
      turn: state.turn,
      turnStep: state.turnStep || 1
    };
  },

  /** 描画のたびに呼ばれる（連続呼び出しは間引く） */
  syncSoon() {
    if (!this._canSync()) return;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.syncNow(), 60);
  },

  syncNow() {
    if (!this._canSync()) return;
    this.send(this.publicSnapshot());
  },

  // ---- 受信 ----
  _onData(msg) {
    if (!msg || typeof msg !== "object") return;
    console.log("[P2P RECV]", msg.t);

    if (msg.t === "error" && msg.code === "room_full") {
      // 3人目の参加要求としてオーナーから拒否された場合
      this._clearTimeoutTimer();
      this.connected = false;
      this.lastError = "room_full";
      this._setState(
        P2P_STATES.CONNECTION_FAILED,
        msg.message || "このルームは既に2人対戦中のため参加できません"
      );
      try { if (this.conn) this.conn.close(); } catch (e) {}
      this.conn = null;
      if (typeof showToast === "function") {
        showToast("ルームが満員のため参加できませんでした");
      }
      return;
    }

    if (msg.t === "player_exit" || msg.t === "peer_disconnect") {
      this._clearTimeoutTimer();
      this.connected = false;
      this.conn = null;
      const pName = msg.playerName || state.oppName || "相手プレイヤー";
      const isExit = (msg.t === "player_exit");
      state.oppExited = true;

      this._setState(
        P2P_STATES.DISCONNECTED,
        isExit ? `${pName} さんが対戦から退室しました` : "相手が接続を切断しました"
      );

      const gameEl = document.getElementById("game");
      const inGame = gameEl && !gameEl.classList.contains("hidden");
      if (inGame) {
        addLog(`【退室】${pName} さんが対戦ルームから退室しました`, { isRemote: true });
        if (typeof showActionPopup === "function") {
          showActionPopup(pName, "対戦ルームから退室しました", [], "🚪 相手が退室");
        }
        if (typeof showModal === "function") {
          showModal(
            "🚪 対戦相手が退室しました",
            `<div style="text-align:center; padding:18px 10px; color:#f8fafc;">
              <div style="font-size:44px; margin-bottom:10px;">🚪</div>
              <p style="font-size:17px; font-weight:bold; color:#fca5a5; margin-bottom:8px;">
                <b>${escapeHtml(pName)}</b> さんが対戦から退室しました
              </p>
              <p style="font-size:13px; color:#cbd5e1; line-height:1.6;">
                このまま盤面や対戦ログを確認するか、ロビーに戻ることができます。
              </p>
            </div>`,
            `<div style="display:flex; gap:8px; justify-content:flex-end;">
              <button class="btn" onclick="closeModal()">このまま盤面を見る</button>
              <button class="btn red" onclick="closeModal(); document.getElementById('game').classList.add('hidden'); document.getElementById('lobby').classList.remove('hidden');">ロビーに戻る</button>
            </div>`
          );
        }
      } else if (typeof showToast === "function") {
        showToast(isExit ? `${pName} さんが退室しました` : "相手がP2P接続を切断しました");
      }

      if (typeof renderAll === "function") renderAll();
      return;
    }

    if (msg.t === "fx") {
      if (typeof playLocalBoardEffect === "function") {
        playLocalBoardEffect(msg, true);
      }
      return;
    }

    if (msg.t === "opp_remote_action") {
      if (typeof handleOpponentRemoteAction === "function") {
        handleOpponentRemoteAction(msg);
      }
      return;
    }

    if (msg.t === "victory") {
      const winnerName = msg.winnerName || state.oppName || "相手プレイヤー";
      addLog(`【決着】${winnerName} の勝利となりました！`, { isRemote: true });
      if (typeof playGrandVictoryEffect === "function") {
        playGrandVictoryEffect(winnerName, msg.reason || "勝利宣言", true);
      }
      return;
    }

    if (msg.t === "declare_attack") {
      const pName = msg.playerName || state.oppName || "相手プレイヤー";
      if (typeof showAttackCutin === "function") {
        showAttackCutin(pName, msg.pokemonName, msg.attackName);
      }
      return;
    }

    if (msg.t === "chat_message") {
      if (typeof handleIncomingChatMessage === "function") {
        handleIncomingChatMessage(msg);
      }
      return;
    }

    // ---- P2Pボイス通話電文 ----
    if (msg.t === "voice_call_request") {
      if (window.VoiceChat) {
        VoiceChat.handleIncomingCallRequest(msg.callerName);
      }
      return;
    }

    if (msg.t === "voice_call_accept") {
      if (window.VoiceChat) {
        VoiceChat.handleCallAccepted();
      }
      return;
    }

    if (msg.t === "voice_call_reject") {
      if (typeof closeModal === "function") closeModal();
      if (typeof showToast === "function") {
        showToast(msg.reason === "busy" ? "⚠️ 相手は通話中のため接続できませんでした" : "📞 相手が通話リクエストに応答しませんでした");
      }
      if (window.VoiceChat) {
        VoiceChat.resetVoiceCallState();
      }
      return;
    }

    if (msg.t === "voice_call_cancel") {
      if (typeof closeModal === "function") closeModal();
      if (typeof showToast === "function") {
        showToast("📞 相手が通話の呼び出しをキャンセルしました");
      }
      if (window.VoiceChat) {
        VoiceChat.resetVoiceCallState();
      }
      return;
    }

    if (msg.t === "voice_call_end") {
      if (window.VoiceChat) {
        VoiceChat.endCall(false);
      }
      return;
    }

    if (msg.t === "conn_check") {
      if (msg.phase === "syn") {
        this.send({
          t: "conn_check",
          phase: "ack",
          from: this.role,
          ts: Date.now()
        });
      } else if (msg.phase === "ack") {
        this._appendTestLog("✅ 双方向通信(SYN/ACK)を確認しました");
        this.updateWebRTCStatsUI();
      }
      return;
    }

    if (msg.t === "test_message") {
      const senderLabel = msg.name ? `${msg.sender || "相手"}(${msg.name})` : (msg.sender || "相手");
      this._appendTestLog(`📥 受信 [${senderLabel}]: ${msg.text}`);
      if (typeof showToast === "function") {
        showToast(`📩 受信: ${msg.text}`);
      }
      // 受信確認(ACK)を返す
      this.send({
        t: "test_message_ack",
        text: msg.text,
        ts: Date.now()
      });
      return;
    }

    if (msg.t === "test_message_ack") {
      this._appendTestLog(`✓ 相手がメッセージを受信しました（「${msg.text}」）`);
      return;
    }

    if (msg.t === "hello") {
      state.oppName = msg.name || "相手プレイヤー";
      state.oppMatId = msg.matId || state.oppMatId;
      state.oppExited = false;
      if ("matDataUrl" in msg) state.oppMatDataUrl = msg.matDataUrl || null;
      if (msg.sleeveId) state.oppSleeveId = msg.sleeveId;
      if ("sleeveDataUrl" in msg) state.oppSleeveDataUrl = msg.sleeveDataUrl || null;
      if (typeof renderSleeves === "function") renderSleeves();
      if (Array.isArray(msg.deck)) {
        state.oppLoadedDeck = msg.deck;
      }
      this._setState(P2P_STATES.CONNECTED, `相手: ${state.oppName} / ルーム: ${this.roomCode}`);
      this.updateWebRTCStatsUI();
      renderAll();
    } else if (msg.t === "start" || msg.t === "match_start") {
      // どちらかのプレイヤーが「対戦開始」を押した通知を受信
      state.oppName = msg.name || state.oppName;
      state.oppExited = false;
      if (msg.matId) state.oppMatId = msg.matId;
      if ("matDataUrl" in msg) state.oppMatDataUrl = msg.matDataUrl || null;
      if (msg.sleeveId) state.oppSleeveId = msg.sleeveId;
      if ("sleeveDataUrl" in msg) state.oppSleeveDataUrl = msg.sleeveDataUrl || null;
      if (typeof renderSleeves === "function") renderSleeves();
      if (Array.isArray(msg.deck)) {
        state.oppLoadedDeck = msg.deck;
      }
      if (typeof resetOpponentCards === "function") {
        resetOpponentCards();
      }

      const game = document.getElementById("game");
      if (game && game.classList.contains("hidden")) {
        const nameEl = document.getElementById("in-name");
        state.myName = (nameEl && nameEl.value.trim()) || "プレイヤーB";
        startBattleSetup();
        const matSync = (typeof getMyPlaymatSyncData === "function")
          ? getMyPlaymatSyncData()
          : { matId: state.myMatId, matDataUrl: null };
        // 相手側へも自分のデッキ・プレイマット・スリーブを確実に同期
        this.send({
          t: "deck_sync",
          name: state.myName,
          matId: matSync.matId,
          matDataUrl: matSync.matDataUrl,
          sleeveId: state.mySleeveId,
          sleeveDataUrl: state.mySleeveDataUrl,
          deck: state.myLoadedDeck || SAMPLE_DECK
        });
        this.syncNow();
      }
      renderAll();
    } else if (msg.t === "deck_sync") {
      state.oppName = msg.name || state.oppName;
      if (msg.matId) state.oppMatId = msg.matId;
      if ("matDataUrl" in msg) state.oppMatDataUrl = msg.matDataUrl || null;
      if (msg.sleeveId) state.oppSleeveId = msg.sleeveId;
      if ("sleeveDataUrl" in msg) state.oppSleeveDataUrl = msg.sleeveDataUrl || null;
      if (typeof renderSleeves === "function") renderSleeves();
      if (Array.isArray(msg.deck)) {
        state.oppLoadedDeck = msg.deck;
      }
      renderAll();
    } else if (msg.t === "playmat_sync") {
      if (msg.matId) state.oppMatId = msg.matId;
      state.oppMatDataUrl = msg.matDataUrl || null;
      if (typeof renderPlaymats === "function") renderPlaymats();
    } else if (msg.t === "sleeve_sync") {
      if (msg.sleeveId) state.oppSleeveId = msg.sleeveId;
      state.oppSleeveDataUrl = msg.sleeveDataUrl || null;
      if (typeof renderSleeves === "function") renderSleeves();
    } else if (msg.t === "action_log") {
      const pName = msg.playerName || state.oppName || "相手プレイヤー";
      const text = msg.text || "";
      const cards = Array.isArray(msg.cards) ? msg.cards : [];
      const badge = msg.badge || "📢 相手の行動";
      if (text) {
        addLog(`【${pName}】${text}`, { isRemote: true });
        if (typeof showActionPopup === "function") {
          showActionPopup(pName, text, cards, badge);
        }
      }
      renderAll();
    } else if (msg.t === "card_used") {
      const pre = (c) => c ? { ...c, uid: "opp:" + String(c.uid).replace(/^(opp:)+/, "") } : null;
      state.oppPlayCard = pre(msg.card);
      const pName = msg.playerName || state.oppName || "相手プレイヤー";
      if (msg.card) {
        addLog(`【使用】${pName} が「${msg.card.name}」を使用しました`, { isRemote: true });
        if (typeof showCardUsePopup === "function") {
          showCardUsePopup(pName, state.oppPlayCard);
        }
      }
      renderAll();
    } else if (msg.t === "deck_cards_revealed") {
      const pName = msg.playerName || state.oppName || "相手プレイヤー";
      const cards = Array.isArray(msg.cards) ? msg.cards : [];
      const names = cards.map(c => c.name).join(", ");
      const actionLabel = msg.actionLabel || "山札から手札に加えた";
      if (cards.length > 0) {
        addLog(`【公開】${pName} が「${names}」（${cards.length}枚）を${actionLabel}！`, { isRemote: true });
        if (typeof showCardRevealPopup === "function") {
          showCardRevealPopup(pName, cards, actionLabel);
        }
      }
      renderAll();
    } else if (msg.t === "deck_cards_secret_hand") {
      const pName = msg.playerName || state.oppName || "相手プレイヤー";
      const count = msg.count || 1;
      const text = `山札からカードを ${count}枚（相手に見せずに）手札に加えました`;
      addLog(`【${pName}】${text}`, { isRemote: true });
      if (typeof showActionPopup === "function") {
        showActionPopup(pName, text, [], "🤫 山札から手札へ（非公開）");
      }
      renderAll();
    } else if (msg.t === "coin_result") {
      // コイントス結果の受信（3Dコイントス演出を再生してから選択モーダルへ）
      state.coinResult = msg.coin;
      state.coinChooser = msg.chooser;
      const isHeads = (msg.coin === "heads");
      const resultText = isHeads ? "表（オモテ）" : "裏（ウラ）";
      addLog(`【対戦準備】ルームオーナーのコイントス: 【${resultText}】！ (${msg.chooser === 'host' ? 'ルームオーナー' : '相手（ゲスト）'}が先攻・後攻を選択)`, { isRemote: true });
      if (typeof playCoinTossEffect === "function") {
        playCoinTossEffect(isHeads, msg.name || state.oppName, () => {
          showToast(`コイントス: 【${resultText}】！`);
          if (typeof handleCoinResult === "function") {
            handleCoinResult(isHeads, msg.chooser);
          }
        });
      } else {
        showToast(`コイントス: 【${resultText}】！`);
        if (typeof handleCoinResult === "function") {
          handleCoinResult(isHeads, msg.chooser);
        }
      }
    } else if (msg.t === "order_chosen") {
      // 先攻・後攻決定通知の受信
      if (typeof closeModal === "function") closeModal();
      const isMeFirst = (msg.firstPlayerRole === this.role);
      state.firstPlayer = isMeFirst ? "me" : "opp";
      state.setupStep = "place";
      const myOrderName = isMeFirst ? "先攻" : "後攻";
      addLog(`【対戦準備】相手の選択により、あなたは【${myOrderName}】になりました。`, { isRemote: true });
      if (typeof showActionPopup === "function") {
        showActionPopup(
          state.oppName || "相手プレイヤー",
          `先攻・後攻を選択！ あなたは【${myOrderName}】です`,
          [],
          "🎲 先攻・後攻決定"
        );
      }
      showToast(`あなたは【${myOrderName}】です！ たねポケモンをバトル場に出してください`);
      renderAll();
    } else if (msg.t === "mulligan_declare") {
      // 手順1: 相手の「たねポケモンなし（マリガン）」宣言を受信（まだ手札は見せない）
      state.oppMulliganDeclared = true;
      const pName = msg.name || state.oppName || "相手プレイヤー";
      addLog(`【対戦準備】相手（${pName}）が「たねポケモンなし（マリガン）」を宣言しました（あなたの準備完了後に手札が公開されます）`, { isRemote: true });
      if (typeof showActionPopup === "function") {
        showActionPopup(pName, "「たねポケモンなし（マリガン）」を宣言しました", [], "⚠️ マリガン宣言");
      }
      showToast(`⚠️ 相手が「たねなし」を宣言しました。先にバトル場・サイドを準備完了してください`);
      // もし自分も同時に「たねなし宣言」で相手待ちだった場合は、お互いに手札を同時公開する
      if (state.myMulliganStep === "waiting_opp_ready" && typeof sendMulliganRevealToOpponent === "function") {
        sendMulliganRevealToOpponent();
      } else if (state.mySetupReady) {
        // すでにこちらが準備完了済みだった場合は再通知して相手の手札公開を促す
        this.send({ t: "setup_ready", name: state.myName });
        renderAll();
      } else {
        renderAll();
      }
    } else if (msg.t === "mulligan_reveal") {
      // 手順3: 相手から公開されたマリガン手札7枚を受信 → 確認モーダルを表示
      state.oppMulliganDeclared = false;
      state.oppMulliganCount = msg.count || (state.oppMulliganCount + 1);
      addLog(`【対戦準備】相手（${msg.name || state.oppName}）がマリガン確認のため手札7枚を公開しました（${state.oppMulliganCount}回目）`, { isRemote: true });
      if (typeof enqueueOpponentMulliganReveal === "function") {
        enqueueOpponentMulliganReveal({
          count: state.oppMulliganCount,
          name: msg.name || state.oppName,
          hand: Array.isArray(msg.hand) ? msg.hand : []
        });
      }
      renderAll();
    } else if (msg.t === "mulligan_ack") {
      // 手順4: 相手がこちらの公開手札を確認OKした通知を受信 → 60枚でシャッフル＆7枚引き直し
      addLog(`【対戦準備】相手（${msg.name || state.oppName}）が手札を確認しました。山札に戻して7枚引き直します`, { isRemote: true });
      if (typeof performMulliganRedraw === "function") {
        performMulliganRedraw();
      }
    } else if (msg.t === "mulligan_reject") {
      // 手順4b: 相手がこちらの公開手札にたねポケモンを発見しマリガンを却下（認めない）した通知を受信
      const pName = msg.name || state.oppName || "相手プレイヤー";
      const reason = msg.reason || "手札にたねポケモンが存在するため、マリガンは認められませんでした。";
      addLog(`【対戦準備】相手（${pName}）からマリガンが却下されました: ${reason}`, { isRemote: true });
      if (typeof handleMulliganRejected === "function") {
        handleMulliganRejected(reason, pName);
      }
    } else if (msg.t === "mulligan") {
      // 旧互換用
      state.oppMulliganCount = msg.count || (state.oppMulliganCount + 1);
      addLog(`【対戦準備】相手（${msg.name || state.oppName}）がマリガンを行いました（${state.oppMulliganCount}回目）`, { isRemote: true });
      showToast(`相手が手札を引き直しました (マリガン ${state.oppMulliganCount}回目)`);
      renderAll();
    } else if (msg.t === "setup_ready") {
      // 手順2: 相手の準備完了通知の受信
      state.oppSetupReady = true;
      const pName = msg.name || state.oppName || "相手プレイヤー";
      addLog(`【対戦準備】相手（${pName}）が対戦準備（バトル場・サイドセット）を完了しました`, { isRemote: true });
      // もし自分が「たねなし宣言」をして相手の準備完了を待っていた場合、ここで手札7枚を相手に公開する（手順3へ）
      if (state.myMulliganStep === "waiting_opp_ready" && typeof sendMulliganRevealToOpponent === "function") {
        showToast("相手が準備完了しました！あなたの手札7枚を相手に公開します");
        sendMulliganRevealToOpponent();
      } else if (state.mySetupReady && typeof handlePreMatchMulliganPenalty === "function") {
        handlePreMatchMulliganPenalty();
      } else if (state.mySetupReady && typeof finishSetupPhaseAndStartBattle === "function") {
        finishSetupPhaseAndStartBattle();
      } else {
        if (typeof showActionPopup === "function") {
          showActionPopup(pName, "バトル場とサイド6枚のセットを完了しました！", [], "✅ 対戦準備完了");
        }
        showToast("相手が対戦準備を完了しました！");
        renderAll();
      }
    } else if (msg.t === "mulligan_penalty_done") {
      if (typeof closeModal === "function") closeModal();
      if (msg.drawn && msg.count > 0) {
        addLog(`【対戦準備】相手（${msg.name || state.oppName}）がマリガンペナルティによりカードを${msg.count}枚引きました`, {
          isRemote: true,
          badge: "🎴 ペナルティドロー"
        });
        showToast(`相手がマリガンペナルティで${msg.count}枚引きました`);
      } else {
        addLog(`【対戦準備】相手（${msg.name || state.oppName}）はマリガンペナルティの追加ドローを行いませんでした`, {
          isRemote: true,
          badge: "▶️ ドロー辞退"
        });
      }
      renderAll();
      if (typeof finishSetupPhaseAndStartBattle === "function") {
        finishSetupPhaseAndStartBattle();
      }
    } else if (msg.t === "turn_change") {
      state.turnStep = msg.turnStep || ((state.turnStep || 1) + 1);
      const newTurnInfo = (typeof getTurnInfo === "function")
        ? getTurnInfo(state.turnStep)
        : { label: `ターン ${state.turn}`, isMyTurn: false, activePlayerName: state.oppName };
      state.turn = newTurnInfo.round;
      if (typeof resetAllAbilitiesUsed === "function") {
        resetAllAbilitiesUsed();
      }

      addLog(`【ターン交代】次は【${newTurnInfo.activePlayerName}】の番です（${newTurnInfo.label}）`, { isRemote: true });
      renderAll();

      if (typeof playTurnChangeBanner === "function") {
        playTurnChangeBanner(newTurnInfo, () => {
          if (newTurnInfo.isMyTurn) {
            if (typeof checkTurnStartActiveCondition === "function") {
              checkTurnStartActiveCondition(() => {
                if (typeof executeTurnStartDraw === "function") {
                  executeTurnStartDraw();
                }
              });
            } else if (typeof executeTurnStartDraw === "function") {
              executeTurnStartDraw();
            }
          }
        });
      }
    } else if (msg.t === "match_open") {
      // オープン・対戦開始通知の受信
      state.isSetupPhase = false;
      state.setupStep = "done";
      state.mySetupReady = true;
      state.oppSetupReady = true;
      state.myMulliganStep = null;
      state.oppMulliganDeclared = false;
      state.turnStep = 1;
      state.turn = 1;

      showToast("🎉 せーの、オープン！ バトル開始！");
      const mulliganNote = state.oppMulliganCount > 0 ? `（※相手のマリガン ${state.oppMulliganCount}回分、必要に応じて山札から引いてください）` : "";
      const initialTurnInfo = (typeof getTurnInfo === "function")
        ? getTurnInfo(1)
        : { label: "先攻1ターン目", isMyTurn: (state.firstPlayer !== "opp"), activePlayerName: (state.firstPlayer === "opp" ? state.oppName : state.myName) };

      addLog(`お互いのバトル場を公開し、対戦を開始しました！ (${initialTurnInfo.label}: 【${initialTurnInfo.activePlayerName}】の番) ${mulliganNote}`, { isRemote: true });
      renderAll();

      if (typeof playTurnChangeBanner === "function") {
        playTurnChangeBanner(initialTurnInfo, () => {
          if (initialTurnInfo.isMyTurn && typeof executeTurnStartDraw === "function") {
            executeTurnStartDraw();
          }
        });
      }
    } else if (msg.t === "state") {
      this._applySnapshot(msg);
    }
  },

  _applySnapshot(s) {
    this._lastSnap = s;
    const pre = (c) => c ? { ...c, uid: "opp:" + String(c.uid).replace(/^(opp:)+/, "") } : c;
    const prePk = (p) => p ? {
      ...p,
      card: pre(p.card),
      energies: (p.energies || []).map(pre),
      tool: pre(p.tool)
    } : null;

    state.oppName = s.name || state.oppName;
    state.oppMatId = s.matId || state.oppMatId;
    if (s.sleeveId) state.oppSleeveId = s.sleeveId;
    if ("sleeveDataUrl" in s) state.oppSleeveDataUrl = s.sleeveDataUrl || null;
    if (typeof renderSleeves === "function") renderSleeves();
    state.oppHandCount = s.handCount | 0;
    state.oppDeckCount = s.deckCount | 0;
    state.oppPrizes = s.prizes | 0;
    state.oppTrash = (s.trash || []).map(pre);
    state.oppLostCount = s.lostCount | 0;
    state.oppActive = prePk(s.active);
    state.oppBenchLimit = s.benchLimit || 5;
    state.oppBench = [0, 1, 2, 3, 4, 5, 6, 7].map(i => prePk((s.bench || [])[i] || null));
    state.oppPlayCard = s.playCard ? pre(s.playCard) : null;

    if ((s.stadiumTs | 0) > (state.stadiumTs | 0)) {
      if (state.stadium) {
        const old = state.stadium;
        const oldIsMine = (!old.owner || old.owner === "me") && (!old.uid || !String(old.uid).startsWith("opp:"));
        if (oldIsMine) {
          state.myTrash.push(old);
          addLog(`相手がスタジアムを出したため、自分のスタジアム「${old.name}」がトラッシュされました`, {
            cards: [old],
            badge: "🗑️ スタジアム破棄"
          });
          if (typeof SoundEffects !== "undefined") SoundEffects.playTrash();
        }
      }
      state.stadium = s.stadium ? { ...pre(s.stadium), owner: "opp" } : null;
      state.stadiumTs = s.stadiumTs;
      this._lastStadiumUid = state.stadium ? state.stadium.uid : null;
    }
    if ((s.turnStep | 0) > (state.turnStep | 0)) {
      state.turnStep = s.turnStep | 0;
      state.turn = Math.floor(((state.turnStep | 0) + 1) / 2);
    } else if ((s.turn | 0) > state.turn) {
      state.turn = s.turn | 0;
    }

    const game = document.getElementById("game");
    if (game && !game.classList.contains("hidden")) {
      if (typeof renderAll === "function") {
        renderAll();
      } else {
        document.getElementById("g-opp-name").textContent = state.oppName;
        renderOpponent();
        renderPlayArea();
        renderStadium();
        renderPlaymats();
      }
    }
  },

  /** 対戦開始時: デモ用ダミー相手を消して通信相手の情報を待つ */
  resetOpponentForOnlineMatch() {
    state.oppHandCount = 0;
    state.oppDeckCount = 0;
    state.oppPrizes = 0;
    state.oppTrash = [];
    state.oppLostCount = 0;
    state.oppActive = null;
    state.oppBench = [null, null, null, null, null, null, null, null];
    state.oppBenchLimit = 5;
    state.oppPlayCard = null;
  }
};
