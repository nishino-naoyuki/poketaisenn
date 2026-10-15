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
          voiceName: "ja-JP-Neural2-B",
          speakingRate: 1.15,
          pitch: 2.0,
          volumeGainDb: 2.0
        };

    // フォームに値を流し込み
    const inputKey = document.getElementById("tts-api-key");
    const selectVoice = document.getElementById("tts-voice-select");
    const sliderRate = document.getElementById("slider-tts-rate");
    const sliderPitch = document.getElementById("slider-tts-pitch");
    const sliderVol = document.getElementById("slider-tts-vol");

    if (inputKey) inputKey.value = settings.apiKey || "";
    if (selectVoice) selectVoice.value = settings.voiceName || "ja-JP-Neural2-B";
    if (sliderRate) sliderRate.value = settings.speakingRate || 1.15;
    if (sliderPitch) sliderPitch.value = settings.pitch || 2.0;
    if (sliderVol) sliderVol.value = settings.volumeGainDb || 2.0;

    // スライダ値ラベル更新
    window.updateTtsSliderLabels();

    const statusEl = document.getElementById("tts-test-status");
    if (statusEl) {
      statusEl.className = "tts-test-status";
      statusEl.textContent = settings.apiKey
        ? "Google Cloud TTS が有効です（末尾に「！！」を付加して発声）"
        : "※APIキー未設定時は端末標準音声（無料）で発声します";
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

    return {
      apiKey: (inputKey ? inputKey.value : "").trim(),
      voiceName: selectVoice ? selectVoice.value : "ja-JP-Neural2-B",
      speakingRate: sliderRate ? parseFloat(sliderRate.value) : 1.15,
      pitch: sliderPitch ? parseFloat(sliderPitch.value) : 2.0,
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
          if (res.success) {
            statusEl.className = "tts-test-status success";
            statusEl.textContent = `✅ 再生成功: [${res.engine}] 「${sampleText}！！」`;
          } else {
            statusEl.className = "tts-test-status warn";
            statusEl.textContent = `⚠️ APIエラーのためフォールバックで再生: ${res.error}`;
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
      showToast(settings.apiKey ? "🎙️ Google Cloud TTS 設定を保存しました" : "🎙️ 音声設定（端末標準）を保存しました");
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
