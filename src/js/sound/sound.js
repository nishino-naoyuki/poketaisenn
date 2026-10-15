/**
 * sound.js
 * ポケカラボアリーナ (ポケアリ) 専用 音響エンジン ＆ 音声合成システム
 * 
 * - 実音MP3効果音（ターン開始、カードプレイ・配置・装着、ボタンクリック音）
 * - Web Audio API による重厚サウンド（ダメカン殴打音、気絶音、特殊状態5種、トラッシュ音、シャッフル音、ドロー音、サイドめくり音、コイントス音、勝利ファンファーレ）
 * - Web Speech API ＋ 必殺技チャージSEによる超熱血・感情豊かな技名読み上げボイス
 */

const SoundEffects = (() => {
  let audioCtx = null;
  const STORAGE_KEY = "pokeca_sound_muted";
  let isMuted = localStorage.getItem(STORAGE_KEY) === "true";

  // 実音MP3のプリロード用プール
  const audioPool = {
    turnStart: new Audio("audio/turnstart.mp3"),
    card1: new Audio("audio/card1.mp3"),
    pushbutton: new Audio("audio/pushbutton.mp3")
  };

  // 音量初期設定
  audioPool.turnStart.volume = 0.8;
  audioPool.card1.volume = 0.85;
  audioPool.pushbutton.volume = 0.75;

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
    audioPool.pushbutton.load();
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
  // 実音MP3効果音
  // =========================================================================

  /**
   * 1. 🔔 ターン開始ジングル（turnstart.mp3）
   */
  function playTurnStart() {
    playAudioFile(audioPool.turnStart, 0.85);
  }

  /**
   * 2. 🃏 カード使用音（card1.mp3）
   */
  function playCardUse() {
    playAudioFile(audioPool.card1, 0.85);
  }

  /**
   * 3. 🐾 ポケモンを場に出した音（card1.mp3）
   */
  function playPokemonPlace() {
    playAudioFile(audioPool.card1, 0.9);
  }

  /**
   * 4. ⚡ エネルギー・どうぐ装着音（card1.mp3）
   */
  function playAttach() {
    playAudioFile(audioPool.card1, 0.85);
  }

  /**
   * 5. 🔘 ボタンクリック音（pushbutton.mp3）
   */
  let lastButtonClickTime = 0;
  function playButtonClick() {
    if (isMuted) return;
    const now = Date.now();
    // 35ms以内の過剰な連打発火をスロットル
    if (now - lastButtonClickTime < 35) return;
    lastButtonClickTime = now;
    playAudioFile(audioPool.pushbutton, 0.65);
  }

  // =========================================================================
  // Web Audio API による合成効果音
  // =========================================================================

  /**
   * 6. 💥 ダメカンを置く重撃パンチ打撃音（「ドシッ！ビシッ！」）
   */
  function playDamagePunch() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 低音インパクトキック
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.12);

    subGain.gain.setValueAtTime(0.7, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.14);

    // バンドパスクラッシュノイズ（ビシッ！）
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.15);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.08);
    filter.Q.setValueAtTime(3.2, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.65, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.1);
  }

  /**
   * 7. 💀 ポケモン気絶・ノックアウト音（重厚な沈没・崩壊エフェクト）
   */
  function playKnockout() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // ① 重い衝撃低音
    const boomOsc = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boomOsc.type = "triangle";
    boomOsc.frequency.setValueAtTime(160, now);
    boomOsc.frequency.exponentialRampToValueAtTime(25, now + 0.35);

    boomGain.gain.setValueAtTime(0.6, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    boomOsc.connect(boomGain);
    boomGain.connect(ctx.destination);
    boomOsc.start(now);
    boomOsc.stop(now + 0.4);

    // ② ノイズクラッシュ崩壊音
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.4);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.3);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.4);

    // ③ 切ない下降トーンアルペジオ
    [
      { f: 370, d: 0.05 }, // F#4
      { f: 311, d: 0.12 }, // D#4
      { f: 261, d: 0.20 }, // C4
      { f: 196, d: 0.30 }  // G3
    ].forEach(note => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(note.f, now + note.d);
      osc.frequency.exponentialRampToValueAtTime(note.f * 0.85, now + note.d + 0.15);

      const f2 = ctx.createBiquadFilter();
      f2.type = "lowpass";
      f2.frequency.setValueAtTime(600, now + note.d);

      g.gain.setValueAtTime(0.18, now + note.d);
      g.gain.exponentialRampToValueAtTime(0.001, now + note.d + 0.2);

      osc.connect(f2);
      f2.connect(g);
      g.connect(ctx.destination);
      osc.start(now + note.d);
      osc.stop(now + note.d + 0.22);
    });
  }

  /**
   * 8. 🧪 特殊状態付与音（5種類それぞれ異なる音色）
   * @param {string} condType - "poison" | "burn" | "asleep" | "paralyzed" | "confused"
   */
  function playCondition(condType) {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    switch (condType) {
      case "poison": {
        // どく: 「ボコッ…ジュクジュク…」泡立ち・液体変調音
        [0, 0.06, 0.13, 0.21].forEach((delay, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          const startF = 260 + idx * 80;
          osc.frequency.setValueAtTime(startF, now + delay);
          osc.frequency.exponentialRampToValueAtTime(startF * 1.6, now + delay + 0.05);

          gain.gain.setValueAtTime(0.28, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.07);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.08);
        });
        break;
      }
      case "burn": {
        // やけど: 「ジュワッ！パチパチッ」シズル熱気＆火の粉音
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer(ctx, 0.28);
        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(3200, now);
        filter.frequency.linearRampToValueAtTime(1800, now + 0.15);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 0.28);

        // スパーククリック
        [0.04, 0.11, 0.18].forEach(d => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(4200, now + d);
          g.gain.setValueAtTime(0.2, now + d);
          g.gain.exponentialRampToValueAtTime(0.001, now + d + 0.02);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(now + d);
          osc.stop(now + d + 0.03);
        });
        break;
      }
      case "asleep": {
        // ねむり: 「ポワ〜ン…ポロロン…」深く沈む優しいドロップ音
        [
          { f: 659.25, d: 0.00 }, // E5
          { f: 523.25, d: 0.09 }, // C5
          { f: 440.00, d: 0.19 }, // A4
          { f: 349.23, d: 0.30 }  // F4
        ].forEach(note => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(note.f, now + note.d);
          osc.frequency.exponentialRampToValueAtTime(note.f * 0.92, now + note.d + 0.25);

          gain.gain.setValueAtTime(0.22, now + note.d);
          gain.gain.exponentialRampToValueAtTime(0.001, now + note.d + 0.28);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + note.d);
          osc.stop(now + note.d + 0.3);
        });
        break;
      }
      case "paralyzed": {
        // マヒ: 「ビリリッ！バチバチッ！」鋭い電撃・放電音
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(80, now);

        // 激しいトレモロ
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = "sawtooth";
        lfo.frequency.setValueAtTime(65, now);
        lfoGain.gain.setValueAtTime(0.3, now);

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(2400, now);
        filter.Q.setValueAtTime(4.0, now);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        lfo.start(now);
        osc.start(now);
        lfo.stop(now + 0.3);
        osc.stop(now + 0.3);
        break;
      }
      case "confused": {
        // こんらん: 「ピヨピヨピヨ…クルクル…」頭上を回る揺らぎ音
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(880, now);

        // FM変調ピッチ揺れ（LFO）
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(14, now);
        lfoGain.gain.setValueAtTime(240, now);

        lfo.connect(osc.frequency);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        lfo.start(now);
        osc.start(now);
        lfo.stop(now + 0.42);
        osc.stop(now + 0.42);
        break;
      }
    }
  }

  /**
   * 9. 🗑️ トラッシュ音（カードが捨て場へ滑り込む音）
   */
  function playTrash() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.16);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.14);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.16);
  }

  /**
   * 10. 🔀 山札シャッフル音
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
   * 11. 🎴 山札ドロー音
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
   * 12. 🏆 サイドカードめくり音
   */
  function playSideFlip() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.12);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(4200, now + 0.06);
    filter.Q.setValueAtTime(2.8, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.12);

    // キラリとした高音
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(2400, now + 0.02);
    osc.frequency.exponentialRampToValueAtTime(4800, now + 0.15);

    oscGain.gain.setValueAtTime(0.12, now + 0.02);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now + 0.02);
    osc.stop(now + 0.22);
  }

  /**
   * 13. 🪙 コイントス音
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
   * 14. 🎺 勝利ファンファーレ（華やかで力強いブラスコード進行）
   */
  function playVictoryFanfare() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 華やかなファンファーレメロディ:
    // ド5(523Hz) -> ミ5(659Hz) -> ソ5(784Hz) -> ド6(1046Hz, 長め) -> ソ5(784Hz) -> ド6(1046Hz, 盛大に伸ばす)
    const notes = [
      { f: 523.25, time: 0.00, dur: 0.18 }, // C5
      { f: 659.25, time: 0.20, dur: 0.18 }, // E5
      { f: 783.99, time: 0.40, dur: 0.24 }, // G5
      { f: 1046.5, time: 0.66, dur: 0.40 }, // C6
      { f: 783.99, time: 1.10, dur: 0.18 }, // G5
      { f: 1046.5, time: 1.30, dur: 1.10 }  // C6 (クライマックス長音)
    ];

    notes.forEach(note => {
      const startTime = now + note.time;

      // ブラス風デュアルオシレーター（主音 Sawtooth ＋ 5度上/オクターブ Triangle）
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(note.f, startTime);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(note.f * 1.5, startTime);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1800, startTime);
      filter.frequency.exponentialRampToValueAtTime(3600, startTime + 0.06);
      filter.frequency.exponentialRampToValueAtTime(1400, startTime + note.dur);

      gain.gain.setValueAtTime(0.0, startTime);
      gain.gain.linearRampToValueAtTime(0.35, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.dur);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + note.dur + 0.05);
      osc2.stop(startTime + note.dur + 0.05);
    });
  }

  /**
   * 15. ⚡ 必殺技チャージSE（エネルギー集中・発射効果音）
   */
  function playChargeAttackSE() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 急速ピッチ上昇シンセ（シュババッ！キィィーン！）
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.28);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(2800, now + 0.28);
    filter.Q.setValueAtTime(3.5, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);

    // 直後に炸裂フラッシュ音
    setTimeout(() => {
      if (isMuted) return;
      const ctx2 = getAudioContext();
      if (!ctx2) return;
      const t = ctx2.currentTime;
      const boom = ctx2.createOscillator();
      const bg = ctx2.createGain();
      boom.type = "sine";
      boom.frequency.setValueAtTime(180, t);
      boom.frequency.exponentialRampToValueAtTime(45, t + 0.2);
      bg.gain.setValueAtTime(0.5, t);
      bg.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      boom.connect(bg);
      bg.connect(ctx2.destination);
      boom.start(t);
      boom.stop(t + 0.25);
    }, 240);
  }

  // =========================================================================
  // 超熱血・感情豊かな技名自動読み上げボイス（Web Speech API）
  // =========================================================================

  /**
   * 16. ⚔️ 技宣言の「魂を込めた熱血アニメボイス」
   */
  function speakAttackName(attackName) {
    if (isMuted) return;
    if (!attackName || typeof attackName !== "string") return;
    const cleanName = attackName.trim();
    if (!cleanName) return;

    // 先行して必殺技チャージ＆炸裂SEを鳴らす！
    playChargeAttackSE();

    if (!("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();

      // 感情と気迫を最高潮にするアニメ風の叫びフレーズバリエーション！
      const phrases = [
        `いけぇぇッ！！${cleanName}ーーーーッ！！！`,
        `喰らえッ！${cleanName}ッッ！！！`,
        `決めろッ！渾身の${cleanName}ーーーーッ！！！`,
        `全力の一撃ィッ！！${cleanName}ッッ！！！`
      ];
      const selectedPhrase = phrases[Math.floor(Math.random() * phrases.length)];

      const utter = new SpeechSynthesisUtterance(selectedPhrase);
      utter.lang = "ja-JP";
      utter.rate = 1.15;  // 疾走感と迫力のある熱血スピード
      utter.pitch = 1.30; // 気迫とエネルギーに満ちた高揚ピッチ
      utter.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      // 日本語の表現力豊かなボイス（Google 日本語、Microsoft Natural、Keita、Nanami、Ichiro）を最優先
      const jaVoice = voices.find(v => 
        (v.lang === "ja-JP" || v.lang === "ja_JP") && 
        (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Keita") || v.name.includes("Nanami") || v.name.includes("Ichiro"))
      ) || voices.find(v => v.lang === "ja-JP" || v.lang === "ja_JP");

      if (jaVoice) {
        utter.voice = jaVoice;
      }

      // チャージSEの炸裂タイミング（約220ms後）に合わせて発声を開始
      setTimeout(() => {
        if (!isMuted) {
          window.speechSynthesis.speak(utter);
        }
      }, 220);
    } catch (e) {
      console.warn("SpeechSynthesis error:", e);
    }
  }

  // =========================================================================
  // ミュート・UI連動
  // =========================================================================

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

  // グローバルクリックリスナー: UIボタンをクリックした際に自動で心地よいクリック音を再生
  window.addEventListener("click", (e) => {
    const clickable = e.target.closest("button, .btn, .tab, .mode-tab-btn, .ctx-cond-btn");
    if (clickable) {
      // サウンドトグルボタン以外でクリック音を鳴らす
      if (!clickable.classList.contains("btn-sound-toggle")) {
        playButtonClick();
      }
    }
  }, { capture: true, passive: true });

  return {
    playTurnStart,
    playCardUse,
    playPokemonPlace,
    playAttach,
    playButtonClick,
    playDamagePunch,
    playKnockout,
    playCondition,
    playTrash,
    playShuffle,
    playDraw,
    playSideFlip,
    playCoinToss,
    playVictoryFanfare,
    playChargeAttackSE,
    speakAttackName,
    toggleMute,
    updateMuteIcons,
    get isMuted() { return isMuted; }
  };
})();

if (typeof window !== "undefined") {
  window.SoundEffects = SoundEffects;
}
