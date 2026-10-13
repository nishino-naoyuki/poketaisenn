/* 【UI】手札の範囲選択 */

// =============================================================================
// 手札複数選択 ＆ 範囲選択（ドラッグ＆ドロップ）ヘルパー
// =============================================================================
function getSelectedHandIndices() {
  if (!state.selectedHandIndices || state.selectedHandIndices.size === 0) return [];
  return Array.from(state.selectedHandIndices)
    .filter(i => i >= 0 && i < state.myHand.length)
    .sort((a, b) => b - a); // 降順ソート（splice削除時に安全）
}

function getSelectedHandCards() {
  if (!state.selectedHandIndices || state.selectedHandIndices.size === 0) return [];
  const asc = Array.from(state.selectedHandIndices)
    .filter(i => i >= 0 && i < state.myHand.length)
    .sort((a, b) => a - b);
  return asc.map(i => ({ index: i, card: state.myHand[i] }));
}

const marqueeState = {
  isMouseDown: false,
  isSelecting: false,
  startX: 0,
  startY: 0,
  justFinished: false
};

function initMarqueeSelection() {
  const handArea = document.querySelector(".hand-area");
  const selectionBox = document.getElementById("selection-box");
  if (!handArea || !selectionBox) return;

  const onStart = (e) => {
    // ボタンや操作UI上のクリックは範囲選択を開始しない
    if (e.target.closest("button") || e.target.closest(".hand-btns") || e.target.closest(".sp-menu-btn")) {
      return;
    }
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // カード上のクリックの場合、Shift/Ctrlが押されているか、あるいはカード外の背景なら範囲選択を優先
    const onCard = !!e.target.closest("#hand .card");
    if (onCard && !e.shiftKey && !e.ctrlKey) {
      return;
    }

    marqueeState.isMouseDown = true;
    marqueeState.isSelecting = false;
    marqueeState.startX = clientX;
    marqueeState.startY = clientY;
  };

  const onMove = (e) => {
    if (!marqueeState.isMouseDown) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - marqueeState.startX;
    const dy = clientY - marqueeState.startY;

    if (!marqueeState.isSelecting && Math.hypot(dx, dy) > 8) {
      marqueeState.isSelecting = true;
      selectionBox.classList.remove("hidden");
    }

    if (marqueeState.isSelecting) {
      const x1 = Math.min(marqueeState.startX, clientX);
      const y1 = Math.min(marqueeState.startY, clientY);
      const width = Math.abs(clientX - marqueeState.startX);
      const height = Math.abs(clientY - marqueeState.startY);

      selectionBox.style.left = `${x1}px`;
      selectionBox.style.top = `${y1}px`;
      selectionBox.style.width = `${width}px`;
      selectionBox.style.height = `${height}px`;

      // 範囲内のカードを視覚的にハイライト
      const boxRect = { left: x1, top: y1, right: x1 + width, bottom: y1 + height };
      const cardEls = document.querySelectorAll("#hand .card");
      cardEls.forEach(cardEl => {
        const r = cardEl.getBoundingClientRect();
        const intersects = !(r.right < boxRect.left || r.left > boxRect.right || r.bottom < boxRect.top || r.top > boxRect.bottom);
        if (intersects) {
          cardEl.classList.add("range-hover");
        } else {
          cardEl.classList.remove("range-hover");
        }
      });
    }
  };

  const onEnd = (e) => {
    if (!marqueeState.isMouseDown) return;

    if (marqueeState.isSelecting) {
      const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
      const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
      const x1 = Math.min(marqueeState.startX, clientX);
      const y1 = Math.min(marqueeState.startY, clientY);
      const width = Math.abs(clientX - marqueeState.startX);
      const height = Math.abs(clientY - marqueeState.startY);
      const boxRect = { left: x1, top: y1, right: x1 + width, bottom: y1 + height };

      // Shift/Ctrlキーが押されていない場合は既存の選択をクリア
      if (!e.shiftKey && !e.ctrlKey) {
        state.selectedHandIndices.clear();
      }

      let selectedCount = 0;
      const cardEls = document.querySelectorAll("#hand .card");
      cardEls.forEach(cardEl => {
        cardEl.classList.remove("range-hover");
        const r = cardEl.getBoundingClientRect();
        const intersects = !(r.right < boxRect.left || r.left > boxRect.right || r.bottom < boxRect.top || r.top > boxRect.bottom);
        if (intersects) {
          const idx = parseInt(cardEl.dataset.index, 10);
          if (!isNaN(idx)) {
            state.selectedHandIndices.add(idx);
            selectedCount++;
          }
        }
      });

      selectionBox.classList.add("hidden");
      marqueeState.justFinished = true;
      setTimeout(() => { marqueeState.justFinished = false; }, 150);

      if (selectedCount > 0) {
        showToast(`${selectedCount}枚のカードを範囲選択しました`);
      }
      renderHand();
      updateSheetUI();
    }

    marqueeState.isMouseDown = false;
    marqueeState.isSelecting = false;
  };

  handArea.addEventListener("mousedown", onStart);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onEnd);

  // タッチデバイス対応
  handArea.addEventListener("touchstart", onStart, { passive: true });
  window.addEventListener("touchmove", onMove, { passive: true });
  window.addEventListener("touchend", onEnd);
}


