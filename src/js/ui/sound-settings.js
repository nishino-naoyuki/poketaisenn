/**
 * sound-settings.js
 * 効果音・ボリューム設定ポップアップUI制御
 */

(function() {
  /**
   * サウンド設定モーダルを開く
   */
  window.openSoundSettingsModal = function() {
    const modal = document.getElementById("sound-settings-modal");
    if (!modal) return;

    if (typeof SoundEffects !== "undefined") {
      const vol = (typeof SoundEffects.getVolume === "function") ? SoundEffects.getVolume() : 80;
      const slider = document.getElementById("sound-modal-slider");
      if (slider) slider.value = vol;
      if (typeof SoundEffects.updateVolumeUI === "function") {
        SoundEffects.updateVolumeUI();
      }
    }

    modal.classList.remove("hidden");
  };

  /**
   * サウンド設定モーダルを閉じる
   */
  window.closeSoundSettingsModal = function(e) {
    if (e && e.target !== e.currentTarget) return;
    const modal = document.getElementById("sound-settings-modal");
    if (modal) modal.classList.add("hidden");
  };

  /**
   * 音量スライダー操作時のハンドラ
   */
  window.onSoundVolumeSliderChange = function(val) {
    if (typeof SoundEffects !== "undefined" && SoundEffects.setVolume) {
      SoundEffects.setVolume(val, false);
    }
  };

  /**
   * 音量プリセットボタンをクリックした時
   */
  window.setSoundVolumePreset = function(percent) {
    if (typeof SoundEffects !== "undefined" && SoundEffects.setVolume) {
      SoundEffects.setVolume(percent, true);
    }
  };

  /**
   * ミュートチェックボックスを切り替えた時
   */
  window.onSoundMuteCheckboxToggle = function(checked) {
    if (typeof SoundEffects === "undefined") return;
    if (checked && !SoundEffects.isMuted) {
      SoundEffects.toggleMute();
    } else if (!checked && SoundEffects.isMuted) {
      SoundEffects.toggleMute();
    }
  };

  /**
   * 試聴テスト再生ボタン
   */
  window.runSoundTestPlay = function() {
    if (typeof SoundEffects !== "undefined" && SoundEffects.playTestSound) {
      SoundEffects.playTestSound();
    }
  };

  // Esc キーでモーダルを閉じる
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modal = document.getElementById("sound-settings-modal");
      if (modal && !modal.classList.contains("hidden")) {
        modal.classList.add("hidden");
      }
    }
  });
})();
