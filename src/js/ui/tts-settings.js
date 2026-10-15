/**
 * tts-settings.js
 * 技名読み上げ・音声設定（Google Cloud TTS）ポップアップUI制御
 */

(function() {
  /**
   * モーダルを開き、保存済み設定をフォームに反映
   */
  window.openTtsSettingsModal = function() {
    const modal = document.getElementById("tts-settings-modal");
    if (!modal) return;

    const settings = (typeof SoundEffects !== "undefined" && SoundEffects.getTtsSettings)
      ? SoundEffects.getTtsSettings()
      : {
          apiKey: "",
          voiceName: "ja-JP-Chirp3-HD-Fenrir",
          speakingRate: 1.0,
          pitch: 0.0,
          volumeGainDb: 2.0
        };

    // フォームに値を流し込み
    const inputKey = document.getElementById("tts-api-key");
    const selectVoice = document.getElementById("tts-voice-select");
    const sliderRate = document.getElementById("slider-tts-rate");
    const sliderPitch = document.getElementById("slider-tts-pitch");
    const sliderVol = document.getElementById("slider-tts-vol");

    if (inputKey) inputKey.value = settings.apiKey || "";
    if (selectVoice) selectVoice.value = settings.voiceName || "ja-JP-Chirp3-HD-Fenrir";
    if (sliderRate) sliderRate.value = settings.speakingRate || 1.0;
    if (sliderPitch) sliderPitch.value = settings.pitch !== undefined ? settings.pitch : 0.0;
    if (sliderVol) sliderVol.value = settings.volumeGainDb || 2.0;

    // スライダ値ラベル更新
    window.updateTtsSliderLabels();

    const statusEl = document.getElementById("tts-test-status");
    if (statusEl) {
      statusEl.className = "tts-test-status";
      statusEl.textContent = "▶ テスト再生ボタンで実際の声質を確認できます";
    }

    modal.classList.remove("hidden");
  };

  /**
   * モーダルを閉じる
   */
  window.closeTtsSettingsModal = function(e) {
    if (e && e.target !== e.currentTarget) return;
    const modal = document.getElementById("tts-settings-modal");
    if (modal) modal.classList.add("hidden");
  };

  /**
   * APIキーの可視性トグル（👁️）
   */
  window.toggleTtsKeyVisibility = function() {
    const input = document.getElementById("tts-api-key");
    const btn = document.getElementById("btn-toggle-key-visibility");
    if (!input) return;

    if (input.type === "password") {
      input.type = "text";
      if (btn) btn.textContent = "🙈";
    } else {
      input.type = "password";
      if (btn) btn.textContent = "👁️";
    }
  };

  /**
   * スライダーの数値ラベルを更新
   */
  window.updateTtsSliderLabels = function() {
    const sliderRate = document.getElementById("slider-tts-rate");
    const sliderPitch = document.getElementById("slider-tts-pitch");
    const sliderVol = document.getElementById("slider-tts-vol");

    const valRate = document.getElementById("val-tts-rate");
    const valPitch = document.getElementById("val-tts-pitch");
    const valVol = document.getElementById("val-tts-vol");

    if (sliderRate && valRate) {
      valRate.textContent = `${parseFloat(sliderRate.value).toFixed(2)}x`;
    }
    if (sliderPitch && valPitch) {
      const p = parseFloat(sliderPitch.value);
      valPitch.textContent = `${p >= 0 ? '+' : ''}${p.toFixed(1)}st`;
    }
    if (sliderVol && valVol) {
      const v = parseFloat(sliderVol.value);
      valVol.textContent = `${v >= 0 ? '+' : ''}${v.toFixed(1)}dB`;
    }
  };

  /**
   * 現在のモーダル入力値を取得
   */
  function getCurrentModalSettings() {
    const inputKey = document.getElementById("tts-api-key");
    const selectVoice = document.getElementById("tts-voice-select");
    const sliderRate = document.getElementById("slider-tts-rate");
    const sliderPitch = document.getElementById("slider-tts-pitch");
    const sliderVol = document.getElementById("slider-tts-vol");

    const saved = (typeof SoundEffects !== "undefined" && SoundEffects.getTtsSettings)
      ? SoundEffects.getTtsSettings()
      : {};

    return {
      apiKey: inputKey ? inputKey.value.trim() : (saved.apiKey || ""),
      voiceName: selectVoice ? selectVoice.value : "ja-JP-Chirp3-HD-Fenrir",
      speakingRate: sliderRate ? parseFloat(sliderRate.value) : 1.0,
      pitch: sliderPitch ? parseFloat(sliderPitch.value) : 0.0,
      volumeGainDb: sliderVol ? parseFloat(sliderVol.value) : 2.0
    };
  }

  /**
   * テスト発声を実行
   */
  window.runTtsTestSpeak = async function() {
    const testInput = document.getElementById("tts-test-text");
    const sampleText = (testInput && testInput.value.trim()) || "ファントムダイブ";
    const statusEl = document.getElementById("tts-test-status");
    const btnTest = document.getElementById("btn-tts-test");

    const currentSettings = getCurrentModalSettings();

    if (statusEl) {
      statusEl.className = "tts-test-status active";
      statusEl.textContent = `「${sampleText}！！」を合成再生中...`;
    }
    if (btnTest) btnTest.disabled = true;

    try {
      if (typeof SoundEffects !== "undefined" && SoundEffects.testSpeak) {
        const res = await SoundEffects.testSpeak(sampleText, currentSettings);
        if (statusEl) {
          if (res.success && res.engine === "Google Cloud TTS") {
            statusEl.className = "tts-test-status success";
            statusEl.textContent = `✅ [Google Cloud TTS: ${res.voiceName || 'Neural2'}] 再生成功: 「${sampleText}！！」`;
          } else if (res.engine && res.engine.includes("フォールバック")) {
            statusEl.className = "tts-test-status error";
            statusEl.textContent = `⚠️ [端末標準音声へフォールバック] 再生: 「${sampleText}！！」 (${res.error || 'エラー'})`;
          } else {
            statusEl.className = "tts-test-status success";
            statusEl.textContent = `✅ [端末標準音声] 再生成功: 「${sampleText}！！」`;
          }
        }
      }
    } catch (err) {
      if (statusEl) {
        statusEl.className = "tts-test-status error";
        statusEl.textContent = `❌ 再生失敗: ${err.message}`;
      }
    } finally {
      if (btnTest) btnTest.disabled = false;
    }
  };

  /**
   * 設定を保存してモーダルを閉じる
   */
  window.saveTtsSettingsFromModal = function() {
    const settings = getCurrentModalSettings();

    if (typeof SoundEffects !== "undefined" && SoundEffects.saveTtsSettings) {
      SoundEffects.saveTtsSettings(settings);
    }

    if (typeof showToast === "function") {
      showToast("🎙️ Google Cloud TTS 設定を保存しました");
    }

    window.closeTtsSettingsModal();
  };

  /**
   * 初期値にリセット
   */
  window.resetTtsSettingsToDefault = function() {
    if (!confirm("読み上げ設定を初期値に戻しますか？")) return;

    if (typeof SoundEffects !== "undefined" && SoundEffects.resetTtsSettings) {
      SoundEffects.resetTtsSettings();
    }

    window.openTtsSettingsModal();

    if (typeof showToast === "function") {
      showToast("読み上げ設定を初期値にリセットしました");
    }
  };
})();
