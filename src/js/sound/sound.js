/**
 * sound.js
 * ポケカラボアリーナ (ポケアリ) 専用 Web Audio API 音響エンジン ＆ 音声合成システム
 * 
 * 外部音声ファイルの読み込み不要・完全オフライン動作・遅延ゼロ・超軽量。
 * プレイヤーの耳に心地よいリアルな紙・スリーブの摩擦音、カードプレイ打撃音、シャッフル音、
 * コイントス金属音、および技名自動読み上げボイス（Web Speech API）を提供します。
 */

const SoundEffects = (() => {
  let audioCtx = null;
  const STORAGE_KEY = "pokeca_sound_muted";
  let isMuted = localStorage.getItem(STORAGE_KEY) === "true";

  /** オーディオコンテキストの初期化（ブラウザの自動再生ポリシー対策） */
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // 初回ユーザーインタラクション時にコンテキストをウォームアップ
  const warmUp = () => {
    getAudioContext();
    window.removeEventListener("pointerdown", warmUp);
    window.removeEventListener("keydown", warmUp);
  };
  window.addEventListener("pointerdown", warmUp, { once: true });
  window.addEventListener("keydown", warmUp, { once: true });

  /**
   * ノイズバッファの生成（紙の擦れ・スリーブの摩擦音用）
   */
  function createNoiseBuffer(ctx, duration = 0.5) {
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * 1. 🃏 カード使用音（マットに「パシッ！」とプレイする小気味よい打撃音）
   */
  function playCardUse() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // ① 机・マットに叩きつける低域の打音（コッ）
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.06);

    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);

    // ② スリーブがマットに当たる高域のスナップ音（パシッ）
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.08);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2200, now);
    filter.Q.setValueAtTime(2.5, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.06);
  }

  /**
   * 2. 🗑️ トラッシュ送り音（「スッ…サッ」とカードが滑り込む軽快な摩擦音）
   */
  function playTrash() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.15);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.12);
    filter.Q.setValueAtTime(1.8, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.15);
  }

  /**
   * 3. 🔀 山札シャッフル音（カード同士が「パラララッ…サササッ」と重なるリフル音）
   */
  function playShuffle() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const baseTime = ctx.currentTime;
    const clicks = 10; // カードが重なる回数

    for (let i = 0; i < clicks; i++) {
      const clickTime = baseTime + i * 0.022 + (Math.random() * 0.008);
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 0.04);

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(2500 + Math.random() * 1200, clickTime);
      filter.Q.setValueAtTime(3.0, clickTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18 + Math.random() * 0.08, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.03);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(clickTime);
      noise.stop(clickTime + 0.04);
    }

    // 最後にサッとまとまる音
    const finishTime = baseTime + clicks * 0.024;
    const endNoise = ctx.createBufferSource();
    endNoise.buffer = createNoiseBuffer(ctx, 0.09);

    const endFilter = ctx.createBiquadFilter();
    endFilter.type = "lowpass";
    endFilter.frequency.setValueAtTime(1800, finishTime);

    const endGain = ctx.createGain();
    endGain.gain.setValueAtTime(0.2, finishTime);
    endGain.gain.exponentialRampToValueAtTime(0.001, finishTime + 0.08);

    endNoise.connect(endFilter);
    endFilter.connect(endGain);
    endGain.connect(ctx.destination);

    endNoise.start(finishTime);
    endNoise.stop(finishTime + 0.09);
  }

  /**
   * 4. 🎴 山札ドロー音（トップドロー含む：「シュッ！」とスリーブが擦れて引かれる音）
   */
  function playDraw() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.1);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(3800, now + 0.04);
    filter.frequency.exponentialRampToValueAtTime(1600, now + 0.09);
    filter.Q.setValueAtTime(2.2, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.1);
  }

  /**
   * 5. ✨ サイドカードめくり音（「ペラッ！✨」と3Dカードが回転してめくれる爽快音）
   */
  function playSideFlip() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // ① カードのめくれ摩擦音（フッ）
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.07);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2800, now);
    filter.Q.setValueAtTime(2.0, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.07);

    // ② キラッと輝く高音のチャイム（ド→ミ→ソの輝き）
    const freq = [1046.5, 1318.5, 1567.9]; // C6, E6, G6
    freq.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      const toneTime = now + idx * 0.035;

      osc.type = "sine";
      osc.frequency.setValueAtTime(f, toneTime);

      oscGain.gain.setValueAtTime(0.12, toneTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, toneTime + 0.18);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(toneTime);
      osc.stop(toneTime + 0.2);
    });
  }

  /**
   * 6. 🪙 コイントス音（「ピーンッ…チャリン！」という澄んだ金属音）
   */
  function playCoinToss() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // ① 親指で弾く金属ベル音（ピーンッ！）
    const freqs = [2200, 3400, 4800];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.15 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    });

    // ② 着地時のチャリン音（約1.05秒後）
    setTimeout(() => {
      if (isMuted) return;
      const ctx2 = getAudioContext();
      if (!ctx2) return;
      const t = ctx2.currentTime;

      [1800, 2600].forEach((f, idx) => {
        const osc = ctx2.createOscillator();
        const gain = ctx2.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 0.7, t + 0.08);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.connect(gain);
        gain.connect(ctx2.destination);
        osc.start(t);
        osc.stop(t + 0.15);
      });
    }, 1050);
  }

  /**
   * 7. ⚔️ 技宣言の「技名読み上げ」ボイス（Web Speech API）
   */
  function speakAttackName(attackName) {
    if (isMuted) return;
    if (!attackName || typeof attackName !== "string") return;
    const cleanName = attackName.trim();
    if (!cleanName) return;

    if (!("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel(); // 既存の読み上げを停止して即時発声
      const utter = new SpeechSynthesisUtterance(cleanName);
      utter.lang = "ja-JP";
      utter.rate = 1.05; // わずかにテンポ良く
      utter.pitch = 1.15; // 明るく聞き取りやすいピッチ
      utter.volume = 1.0;

      // 日本語の自然な音声（Google 日本語 または Kyoko等）を優先選択
      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find(v => v.lang === "ja-JP" || v.lang === "ja_JP");
      if (jaVoice) {
        utter.voice = jaVoice;
      }

      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn("SpeechSynthesis error:", e);
    }
  }

  /**
   * ミュート（消音）の切り替え
   */
  function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem(STORAGE_KEY, isMuted ? "true" : "false");
    updateMuteIcons();
    if (typeof showToast === "function") {
      showToast(isMuted ? "🔇 サウンドをOFFにしました" : "🔊 サウンドをONにしました");
    }
    return isMuted;
  }

  /** UIのミュートアイコンを更新 */
  function updateMuteIcons() {
    document.querySelectorAll(".btn-sound-toggle").forEach(btn => {
      btn.innerHTML = isMuted ? "🔇" : "🔊";
      btn.title = isMuted ? "サウンド: OFF (クリックでON)" : "サウンド: ON (クリックでOFF)";
    });
  }

  return {
    playCardUse,
    playTrash,
    playShuffle,
    playDraw,
    playSideFlip,
    playCoinToss,
    speakAttackName,
    toggleMute,
    isMuted: () => isMuted,
    updateMuteIcons,
  };
})();

// グローバルスコープへ公開
window.SoundEffects = SoundEffects;
