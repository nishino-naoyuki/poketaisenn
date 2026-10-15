/**
 * sound.js
 * ポケカラボアリーナ (ポケアリ) 専用 音響エンジン ＆ 音声合成システム
 * 
 * - 実音MP3効果音（ターン開始、カードプレイ・配置・装着）
 * - Web Audio API による物理打撃音（ダメカン殴打音、トラッシュ音、シャッフル音、ドロー音、サイドめくり音、コイントス音）
 * - Web Speech API による熱血・感情豊かな技名自動読み上げボイス
 */

const SoundEffects = (() => {
  let audioCtx = null;
  const STORAGE_KEY = "pokeca_sound_muted";
  let isMuted = localStorage.getItem(STORAGE_KEY) === "true";

  // 実音MP3のプリロード用プール
  const audioPool = {
    turnStart: new Audio("audio/turnstart.mp3"),
    card1: new Audio("audio/card1.mp3"),
  };

  // 音量初期設定
  audioPool.turnStart.volume = 0.8;
  audioPool.card1.volume = 0.85;

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

  // 初回ユーザーインタラクション時にコンテキストとAudioをウォームアップ
  const warmUp = () => {
    getAudioContext();
    // プリロード
    audioPool.turnStart.load();
    audioPool.card1.load();
    window.removeEventListener("pointerdown", warmUp);
    window.removeEventListener("keydown", warmUp);
  };
  window.addEventListener("pointerdown", warmUp, { once: true });
  window.addEventListener("keydown", warmUp, { once: true });

  /** 音声ファイル（MP3）のクローン再生（連続再生対応） */
  function playAudioFile(audioObj, volume = 0.85) {
    if (isMuted) return;
    try {
      const clone = audioObj.cloneNode();
      clone.volume = volume;
      const p = clone.play();
      if (p && p.catch) {
        p.catch(() => {});
      }
    } catch (e) {
      console.warn("Audio play error:", e);
    }
  }

  /** ノイズバッファの生成 */
  function createNoiseBuffer(ctx, duration = 0.5) {
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // =========================================================================
  // 公開サウンドAPI
  // =========================================================================

  /**
   * 1. ⚔️ ターンの始まりの「XXXのターン」のとき（turnstart.mp3）
   */
  function playTurnStart() {
    playAudioFile(audioPool.turnStart, 0.8);
  }

  /**
   * 2. 🃏 カードが使用エリアに行ったとき（card1.mp3）
   */
  function playCardUse() {
    playAudioFile(audioPool.card1, 0.9);
  }

  /**
   * 3. 🐾 ポケモンをベンチ・バトル場に出したとき（card1.mp3）
   */
  function playPokemonPlace() {
    playAudioFile(audioPool.card1, 0.85);
  }

  /**
   * 4. ⚡ ポケモンにエネルギーや道具を付けたとき（card1.mp3）
   */
  function playAttach() {
    playAudioFile(audioPool.card1, 0.85);
  }

  /**
   * 5. 💥 ダメカンを載せるとき（殴るようなビシッ！という重い打撃音）
   */
  function playDamagePunch() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // ① 重いボディへの衝撃音（ドシッ！低域キック）
    const kick = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kick.type = "sine";
    kick.frequency.setValueAtTime(240, now);
    kick.frequency.exponentialRampToValueAtTime(38, now + 0.12);

    kickGain.gain.setValueAtTime(0.5, now);
    kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    kick.connect(kickGain);
    kickGain.connect(ctx.destination);
    kick.start(now);
    kick.stop(now + 0.15);

    // ② 鋭いパンチ打撃・拳のヒット音（ビシッ！高域クラッシュノイズ）
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.08);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1600, now);
    filter.Q.setValueAtTime(1.8, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.08);
  }

  /**
   * 6. 🗑️ カードがトラッシュに行ったとき（手札トラッシュ・自動トラッシュ・山札トラッシュ）
   */
  function playTrash() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.14);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.11);
    filter.Q.setValueAtTime(1.8, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.14);
  }

  /**
   * 7. 🔀 山札シャッフル音（「パラララッ…サササッ」）
   */
  function playShuffle() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const baseTime = ctx.currentTime;
    const clicks = 10;

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
  }

  /**
   * 8. 🎴 山札ドロー音（トップドロー含む：「シュッ！」）
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
   * 9. ✨ サイドカードめくり音（「ペラッ！✨」）
   */
  function playSideFlip() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
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

    const freq = [1046.5, 1318.5, 1567.9];
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
   * 10. 🪙 コイントス音（「ピーンッ…チャリン！」）
   */
  function playCoinToss() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
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
   * 11. ⚔️ 技宣言の「感情を込めた熱血読み上げ」ボイス（Web Speech API）
   */
  function speakAttackName(attackName) {
    if (isMuted) return;
    if (!attackName || typeof attackName !== "string") return;
    const cleanName = attackName.trim();
    if (!cleanName) return;

    if (!("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();

      // 感情と気迫を込めるため、アニメ風の力強いコールフレーズに演出！
      // 例: 「ファントムダイブッ！！」「いけっ、〇〇！！」
      const emotionalText = `いけっ！${cleanName}ッ！！`;

      const utter = new SpeechSynthesisUtterance(emotionalText);
      utter.lang = "ja-JP";
      utter.rate = 1.12;  // 疾走感のあるスピード
      utter.pitch = 1.25; // 気迫とエネルギーのある明るい高めのピッチ
      utter.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      // 日本語の自然な音声（Google 日本語、Microsoft Keita / Nanami、Kyoko）を優先
      const jaVoice = voices.find(v => 
        (v.lang === "ja-JP" || v.lang === "ja_JP") && 
        (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Keita") || v.name.includes("Nanami"))
      ) || voices.find(v => v.lang === "ja-JP" || v.lang === "ja_JP");

      if (jaVoice) {
        utter.voice = jaVoice;
      }

      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn("SpeechSynthesis error:", e);
    }
  }

  /** ミュート（消音）の切り替え */
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
    playTurnStart,
    playCardUse,
    playPokemonPlace,
    playAttach,
    playDamagePunch,
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
