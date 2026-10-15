/**
 * PokéCa Lab Arena - P2P Voice Chat Module (WebRTC Audio)
 * WebRTC MediaStream & PeerJS Call API を用いた完全サーバーレス・超低遅延ボイスチャット
 */

const VoiceChat = {
  // ---- 通話開始リクエスト（発信側） ----
  async startCall() {
    if (state.isSoloMode) {
      if (typeof showToast === "function") showToast("一人回しモードではボイス通話は利用できません");
      return;
    }
    if (!P2P.connected || !P2P.conn) {
      if (typeof showToast === "function") showToast("対戦相手とP2P接続されていません");
      return;
    }
    if (state.voiceCall && state.voiceCall.active) {
      if (typeof showToast === "function") showToast("既にボイス通話中です");
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (typeof showModal === "function") {
        showModal(
          "⚠️ マイク機能を利用できません",
          `<div style="text-align:center; padding:16px 10px; color:#cbd5e1;">
            <p style="margin-bottom:8px;">お使いのブラウザまたは接続環境（非HTTPS等）ではマイクがサポートされていません。</p>
            <p style="font-size:12px; color:#94a3b8;">※ HTTPS環境またはlocalhostでアクセスしてください。</p>
          </div>`,
          `<button class="btn" onclick="closeModal()">閉じる</button>`
        );
      }
      return;
    }

    try {
      // マイク取得（オプトイン許可）
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      state.voiceCall.localStream = stream;
      state.voiceCall.status = "calling";
      state.voiceCall.isMuted = false;

      // 相手へP2Pリクエスト送信
      P2P.send({
        t: "voice_call_request",
        callerName: state.myName || "プレイヤーA"
      });

      // 発信中モーダル表示
      this._showCallingModal();

    } catch (err) {
      console.warn("[VoiceChat] getUserMedia error:", err);
      let errMsg = "マイクへのアクセスが拒否されたか、マイク機器が見つかりませんでした。";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errMsg = "ブラウザのマイク権限が許可されていません。ブラウザのアドレスバー横の鍵アイコンからマイクの利用を許可してください。";
      }
      if (typeof showToast === "function") showToast(`⚠️ ${errMsg}`);
      this.resetVoiceCallState();
    }
  },

  // ---- 発信中モーダル ----
  _showCallingModal() {
    const oppName = state.oppName || "対戦相手";
    const bodyHtml = `
      <div style="text-align:center; padding:20px 10px; color:#f8fafc;">
        <div class="voice-calling-anim" style="font-size:48px; margin-bottom:12px;">📞</div>
        <p style="font-size:16px; font-weight:800; color:#38bdf8; margin-bottom:6px;">
          ${escapeHtml(oppName)} さんを呼び出しています...
        </p>
        <p style="font-size:12px; color:#94a3b8; margin:0;">
          相手が「通話を受ける」を押すのをお待ちください♪
        </p>
      </div>
    `;
    const footHtml = `
      <div style="display:flex; justify-content:center; gap:8px;">
        <button class="btn red" onclick="VoiceChat.cancelCall()">呼び出しをキャンセル</button>
      </div>
    `;
    if (typeof showModal === "function") {
      showModal("🎙️ ボイス通話の呼び出し中", bodyHtml, footHtml);
    }
  },

  cancelCall() {
    if (typeof closeModal === "function") closeModal();
    if (P2P.connected) {
      P2P.send({ t: "voice_call_cancel" });
    }
    if (typeof showToast === "function") showToast("通話の呼び出しをキャンセルしました");
    this.resetVoiceCallState();
  },

  // ---- 着信リクエスト受信（着信側） ----
  handleIncomingCallRequest(callerName) {
    if (state.voiceCall && state.voiceCall.active) {
      // 既に通話中の場合は多重着信拒否
      P2P.send({ t: "voice_call_reject", reason: "busy" });
      return;
    }

    state.voiceCall.status = "incoming";
    state.voiceCall.callerName = callerName || state.oppName || "対戦相手";

    // 着信バイブ
    if (navigator.vibrate) {
      try { navigator.vibrate([100, 100, 100, 100, 200]); } catch (e) {}
    }

    const bodyHtml = `
      <div style="text-align:center; padding:18px 10px; color:#f8fafc;">
        <div class="voice-incoming-anim" style="font-size:52px; margin-bottom:12px;">📲</div>
        <p style="font-size:17px; font-weight:800; color:#f472b6; margin-bottom:6px;">
          <b>${escapeHtml(state.voiceCall.callerName)}</b> さんから<br>ボイス通話のリクエストが届きました♪
        </p>
        <p style="font-size:12px; color:#cbd5e1; margin-top:8px; line-height:1.5;">
          直接声で会話しながら快適に対戦できます。<br>
          <span style="color:#fbbf24; font-size:11px;">※ ハウリング防止のためイヤホンのご使用を推奨します</span>
        </p>
      </div>
    `;

    const footHtml = `
      <div style="display:flex; justify-content:center; gap:12px; width:100%;">
        <button class="btn" style="padding:10px 18px; font-size:13px;" onclick="VoiceChat.rejectCall()">✕ いまは無理</button>
        <button class="btn green" style="padding:10px 24px; font-size:14px; font-weight:800;" onclick="VoiceChat.acceptCall()">🟢 通話を受ける</button>
      </div>
    `;

    if (typeof showModal === "function") {
      showModal("🎙️ ボイス通話の着信", bodyHtml, footHtml);
    }
  },

  // ---- 通話を受ける（着信側） ----
  async acceptCall() {
    if (typeof closeModal === "function") closeModal();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      state.voiceCall.localStream = stream;
      state.voiceCall.status = "incoming_accepted";
      state.voiceCall.isMuted = false;

      // 相手に通話受託を通知（相手側が peer.call() を発行する）
      P2P.send({ t: "voice_call_accept" });

      if (typeof showToast === "function") {
        showToast("通話に接続しています...");
      }
    } catch (err) {
      console.warn("[VoiceChat] acceptCall getUserMedia failed:", err);
      if (typeof showToast === "function") {
        showToast("⚠️ マイクへのアクセスが許可されなかったため通話をキャンセルしました");
      }
      this.rejectCall();
    }
  },

  // ---- 通話を断る ----
  rejectCall() {
    if (typeof closeModal === "function") closeModal();
    if (P2P.connected) {
      P2P.send({ t: "voice_call_reject", reason: "declined" });
    }
    this.resetVoiceCallState();
  },

  // ---- 相手が受託した（発信側） ----
  handleCallAccepted() {
    if (typeof closeModal === "function") closeModal();

    if (!P2P.peer || !P2P.conn || !state.voiceCall.localStream) {
      console.warn("[VoiceChat] Cannot start call: missing peer/conn/stream");
      this.resetVoiceCallState();
      return;
    }

    try {
      const targetPeerId = P2P.conn.peer;
      const call = P2P.peer.call(targetPeerId, state.voiceCall.localStream);

      state.voiceCall.mediaConnection = call;

      call.on("stream", (remoteStream) => {
        this._onRemoteStream(remoteStream);
      });

      call.on("close", () => {
        this.endCall(false);
      });

      call.on("error", (err) => {
        console.warn("[VoiceChat MediaConnection error]", err);
        this.endCall(false);
      });

      this._onConnected();
    } catch (err) {
      console.error("[VoiceChat] peer.call failed:", err);
      if (typeof showToast === "function") showToast("通話接続に失敗しました");
      this.resetVoiceCallState();
    }
  },

  // ---- 着信側での peer.on("call") 処理 ----
  handlePeerIncomingCall(incomingCall) {
    state.voiceCall.mediaConnection = incomingCall;

    const answerWithStream = (stream) => {
      incomingCall.answer(stream);

      incomingCall.on("stream", (remoteStream) => {
        this._onRemoteStream(remoteStream);
      });

      incomingCall.on("close", () => {
        this.endCall(false);
      });

      incomingCall.on("error", (err) => {
        console.warn("[VoiceChat MediaConnection error]", err);
        this.endCall(false);
      });

      this._onConnected();
    };

    if (state.voiceCall.localStream) {
      answerWithStream(state.voiceCall.localStream);
    } else {
      navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false
      }).then((stream) => {
        state.voiceCall.localStream = stream;
        answerWithStream(stream);
      }).catch((err) => {
        console.warn("[VoiceChat] incoming call getUserMedia error:", err);
        incomingCall.close();
        this.resetVoiceCallState();
      });
    }
  },

  // ---- リモート音声ストリームの再生 ----
  _onRemoteStream(remoteStream) {
    state.voiceCall.remoteStream = remoteStream;

    let audioEl = document.getElementById("remote-voice-audio");
    if (!audioEl) {
      audioEl = document.createElement("audio");
      audioEl.id = "remote-voice-audio";
      audioEl.autoplay = true;
      audioEl.playsInline = true;
      audioEl.style.display = "none";
      document.body.appendChild(audioEl);
    }

    try {
      audioEl.srcObject = remoteStream;
      const playPromise = audioEl.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.log("[VoiceChat] autoplay blocked, will play on user interaction:", err);
        });
      }
    } catch (err) {
      console.error("[VoiceChat] audio attach failed:", err);
    }
  },

  // ---- 通話接続完了 ----
  _onConnected() {
    state.voiceCall.status = "connected";
    state.voiceCall.active = true;
    state.voiceCall.durationSec = 0;

    if (state.voiceCall.durationTimer) {
      clearInterval(state.voiceCall.durationTimer);
    }
    state.voiceCall.durationTimer = setInterval(() => {
      state.voiceCall.durationSec++;
      this._updateDurationUI();
    }, 1000);

    this.showVoiceCallBar();

    const oppName = state.oppName || "対戦相手";
    if (typeof addLog === "function") {
      addLog(state.myName, "voice", `🎙️ [ボイス通話] ${state.myName} と ${oppName} の通話が接続されました`);
    }
    if (typeof showToast === "function") {
      showToast("🟢 ボイス通話が接続されました♪");
    }

    // チャットモーダル内にも通話ステータスを反映
    this.updateChatVoiceButton();
  },

  // ---- ミュート切替 ----
  toggleMute() {
    if (!state.voiceCall.localStream) return;
    const tracks = state.voiceCall.localStream.getAudioTracks();
    if (!tracks || tracks.length === 0) return;

    state.voiceCall.isMuted = !state.voiceCall.isMuted;
    tracks.forEach(track => {
      track.enabled = !state.voiceCall.isMuted;
    });

    const muteBtn = document.getElementById("voice-bar-mute-btn");
    if (muteBtn) {
      if (state.voiceCall.isMuted) {
        muteBtn.innerHTML = `<span>🔇</span><span>ミュート中</span>`;
        muteBtn.classList.add("muted");
      } else {
        muteBtn.innerHTML = `<span>🎙️</span><span>ミュート</span>`;
        muteBtn.classList.remove("muted");
      }
    }

    if (typeof showToast === "function") {
      showToast(state.voiceCall.isMuted ? "🔇 マイクをミュートしました" : "🎙️ マイクのミュートを解除しました");
    }
  },

  // ---- 通話終了 ----
  endCall(notify = true) {
    if (notify && P2P.connected && state.voiceCall.active) {
      P2P.send({ t: "voice_call_end" });
    }

    if (state.voiceCall.active) {
      if (typeof addLog === "function") {
        addLog(state.myName, "voice", `🎙️ [ボイス通話] 通話が終了しました（通話時間: ${this.formatDuration(state.voiceCall.durationSec)}）`);
      }
      if (typeof showToast === "function") {
        showToast("📞 ボイス通話を終了しました");
      }
    }

    this.hideVoiceCallBar();
    this.resetVoiceCallState();
    this.updateChatVoiceButton();
  },

  // ---- 状態リセット＆トラック解放 ----
  resetVoiceCallState() {
    if (state.voiceCall.durationTimer) {
      clearInterval(state.voiceCall.durationTimer);
      state.voiceCall.durationTimer = null;
    }

    if (state.voiceCall.localStream) {
      try {
        state.voiceCall.localStream.getTracks().forEach(t => t.stop());
      } catch (e) {}
      state.voiceCall.localStream = null;
    }

    if (state.voiceCall.mediaConnection) {
      try {
        state.voiceCall.mediaConnection.close();
      } catch (e) {}
      state.voiceCall.mediaConnection = null;
    }

    const audioEl = document.getElementById("remote-voice-audio");
    if (audioEl) {
      try {
        audioEl.pause();
        audioEl.srcObject = null;
      } catch (e) {}
    }

    state.voiceCall.active = false;
    state.voiceCall.status = "idle";
    state.voiceCall.isMuted = false;
    state.voiceCall.remoteStream = null;
    state.voiceCall.durationSec = 0;

    this.hideVoiceCallBar();
    this.updateChatVoiceButton();
  },

  // ---- 画面上端の通話バー表示 ----
  showVoiceCallBar() {
    let bar = document.getElementById("voice-call-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "voice-call-bar";
      bar.className = "voice-call-bar";
      document.body.appendChild(bar);
    }

    const oppName = state.oppName || "対戦相手";

    bar.innerHTML = `
      <div class="voice-bar-left">
        <div class="voice-pulse-avatar">
          <span class="voice-avatar-icon">🎧</span>
          <span class="voice-pulse-ring"></span>
        </div>
        <div class="voice-info">
          <div class="voice-peer-name">${escapeHtml(oppName)} と通話中</div>
          <div class="voice-timer" id="voice-bar-timer">00:00</div>
        </div>
      </div>
      <div class="voice-bar-actions">
        <button class="voice-btn voice-mute-btn" id="voice-bar-mute-btn" onclick="VoiceChat.toggleMute()" title="マイクの消音切替">
          <span>🎙️</span>
          <span>ミュート</span>
        </button>
        <button class="voice-btn voice-end-btn" onclick="VoiceChat.endCall(true)" title="通話を終了">
          <span>🔴</span>
          <span>終了</span>
        </button>
      </div>
    `;

    bar.classList.remove("hidden");
    bar.classList.add("show");
  },

  hideVoiceCallBar() {
    const bar = document.getElementById("voice-call-bar");
    if (bar) {
      bar.classList.remove("show");
      bar.classList.add("hidden");
    }
  },

  _updateDurationUI() {
    const timerEl = document.getElementById("voice-bar-timer");
    if (timerEl) {
      timerEl.textContent = this.formatDuration(state.voiceCall.durationSec);
    }
  },

  formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  // ---- ポケチャットモーダル内の通話ボタン表示更新 ----
  updateChatVoiceButton() {
    const btn = document.getElementById("cute-chat-voice-btn");
    if (!btn) return;

    if (state.voiceCall && state.voiceCall.active) {
      btn.innerHTML = `<span>🔴 通話中</span>`;
      btn.className = "cute-chat-voice-btn active";
      btn.onclick = () => VoiceChat.endCall(true);
      btn.title = "ボイス通話を終了";
    } else {
      btn.innerHTML = `<span>🎙️ 通話</span>`;
      btn.className = "cute-chat-voice-btn";
      btn.onclick = () => VoiceChat.startCall();
      btn.title = "ボイス通話を開始";
    }
  }
};

window.VoiceChat = VoiceChat;
