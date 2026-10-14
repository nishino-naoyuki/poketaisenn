/* 【UI】山札モーダル・カード一覧・ログ・トースト */

// =============================================================================
// モーダル表示群
// =============================================================================
let deckModalSelected = new Set();

function showDeckModal() {
  deckModalSelected.clear();
  addLog(`山札の中身を確認しています`, {
    badge: "🔍 山札確認",
    skipLocalPopup: true
  });
  renderDeckModalContent();
}

function renderDeckModalContent() {
  const selCount = deckModalSelected.size;
  const title = `山札を見る (残り ${state.myDeck.length} 枚)${selCount > 0 ? ` — <span style="color:#ffd84a;">${selCount}枚選択中</span>` : ''}`;
  let bodyHtml = `
    <div style="font-size:11px; color:#94a3b8; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
      <span>※カードをクリック（タップ）して選択し、下部のボタンで操作してください（ダブルクリックまたは🔍で拡大）</span>
      ${selCount > 0 ? `<button class="btn" style="padding:2px 8px; font-size:10px;" onclick="clearDeckModalSelection()">選択解除</button>` : ''}
    </div>
    <div class="card-grid deck-select-grid">
  `;
  state.myDeck.forEach((c, idx) => {
    registerCard(c);
    const isSel = deckModalSelected.has(idx);
    const hasImg = !!c.imageUrl;
    const imgStyle = hasImg ? `style="background-image: url('${c.imageUrl}');"` : '';
    bodyHtml += `
      <div class="card ${c.color} ${hasImg ? 'has-img' : ''} ${isSel ? 'selected' : ''}" 
           ${imgStyle}
           onclick="toggleDeckModalCard(event, ${idx})"
           ondblclick="event.stopPropagation(); window.openCardZoomByUid('${c.uid}')" 
           title="クリックで選択 / ダブルクリックで拡大">
        <div class="card-top">
          <span class="name">${c.name}</span>
          <button class="deck-zoom-icon" onclick="event.stopPropagation(); window.openCardZoomByUid('${c.uid}')" title="カードを拡大表示">🔍</button>
        </div>
        ${isSel ? `<div class="deck-sel-badge">✓ 選択中</div>` : ''}
        <div class="card-btm"><span>${c.sub || c.category || ''}</span></div>
      </div>
    `;
  });
  bodyHtml += `</div>`;

  const disabledAttr = selCount === 0 ? 'disabled' : '';
  const footHtml = `
    <div class="deck-modal-foot-wrap">
      <div class="deck-modal-actions">
        <button class="btn green" ${disabledAttr} onclick="pickSelectedFromDeck('hand_reveal')">📢 相手に見せて手札に加える</button>
        <button class="btn blue" ${disabledAttr} onclick="pickSelectedFromDeck('hand_secret')">🤫 相手に見せずに手札に加える</button>
        <button class="btn gold" ${disabledAttr} onclick="pickSelectedFromDeck('bench_reveal')">🪑 相手に見せてベンチに出す</button>
        <button class="btn red" ${disabledAttr} onclick="pickSelectedFromDeck('trash')">🗑️ トラッシュ</button>
      </div>
      <div class="deck-modal-close-row">
        <span class="deck-sel-status">${selCount > 0 ? `${selCount}枚選択中` : 'カードを選択してください'}</span>
        <div style="display:flex; gap:6px;">
          <button class="btn purple" onclick="shuffleMyDeck(); closeModal();">シャッフルして閉じる</button>
          <button class="btn" onclick="closeModal()">閉じる</button>
        </div>
      </div>
    </div>
  `;

  showModal(title, bodyHtml, footHtml);
}

window.clearDeckModalSelection = function() {
  deckModalSelected.clear();
  renderDeckModalContent();
};

window.toggleDeckModalCard = function(e, idx) {
  if (e.target.closest("button")) return;
  if (deckModalSelected.has(idx)) {
    deckModalSelected.delete(idx);
  } else {
    deckModalSelected.add(idx);
  }
  renderDeckModalContent();
};

window.pickSelectedFromDeck = function(destination) {
  if (deckModalSelected.size === 0) {
    return alert("山札からカードをクリック（タップ）して選択してください");
  }

  // ベンチに出す場合の事前バリデーション（山札から抜く前にチェック）
  const indicesAsc = Array.from(deckModalSelected).sort((a, b) => a - b);
  if (destination === "bench_reveal") {
    const nonPokemon = indicesAsc.map(i => state.myDeck[i]).find(c => c && c.type !== "pokemon");
    if (nonPokemon) {
      return alert(`「${nonPokemon.name}」はポケモンではないためベンチに出せません。`);
    }
    const emptySlots = [];
    for (let i = 0; i < 5; i++) {
      if (!state.myBench[i]) emptySlots.push(i);
    }
    if (indicesAsc.length > emptySlots.length) {
      return alert(`ベンチの空き枠が足りません（選択: ${indicesAsc.length}枚 / 空き枠: ${emptySlots.length}枠）。`);
    }
  }

  // インデックス降順で山札から取り出し、元の順序に戻す
  const indicesDesc = Array.from(deckModalSelected).sort((a, b) => b - a);
  const moved = [];
  indicesDesc.forEach(idx => {
    const c = state.myDeck.splice(idx, 1)[0];
    if (c) moved.push(c);
  });
  moved.reverse();
  deckModalSelected.clear();

  const names = moved.map(c => c.name).join(", ");
  closeModal();

  if (destination === "hand_reveal") {
    moved.forEach(c => state.myHand.push(c));
    addLog(`山札から${moved.length}枚（${names}）を相手に見せて手札に加えました`, { suppressSync: true });
    showToast(`見せて手札へ: ${names}`);
    if (typeof showCardRevealPopup === "function") {
      showCardRevealPopup(state.myName, moved, "相手に見せて手札に加えた");
    }
    if (typeof P2P !== "undefined" && P2P.connected) {
      P2P.send({
        t: "deck_cards_revealed",
        playerName: state.myName,
        cards: moved,
        actionLabel: "山札から手札に加えた"
      });
    }
  } else if (destination === "hand_secret") {
    moved.forEach(c => state.myHand.push(c));
    addLog(`山札から${moved.length}枚を相手に見せずに手札に加えました（${names}）`, { suppressSync: true });
    showToast(`見せずに手札へ: ${moved.length}枚`);
    if (typeof showActionPopup === "function") {
      showActionPopup(state.myName, `山札からカードを ${moved.length}枚（見せずに）手札に加えました`, [], "🤫 山札から非公開取得");
    }
    if (typeof P2P !== "undefined" && P2P.connected) {
      P2P.send({
        t: "deck_cards_secret_hand",
        playerName: state.myName,
        count: moved.length
      });
    }
  } else if (destination === "bench_reveal") {
    const emptySlots = [];
    for (let i = 0; i < 5; i++) {
      if (!state.myBench[i]) emptySlots.push(i);
    }
    moved.forEach((c, i) => {
      const slotIdx = emptySlots[i];
      if (slotIdx !== undefined) {
        state.myBench[slotIdx] = createFieldPokemon(c, 0, [], null);
      }
    });
    addLog(`山札から${moved.length}匹（${names}）を相手に見せてベンチに出しました`, { suppressSync: true });
    showToast(`ベンチへ: ${names}`);
    if (typeof showCardRevealPopup === "function") {
      showCardRevealPopup(state.myName, moved, "山札からベンチに出した");
    }
    if (typeof P2P !== "undefined" && P2P.connected) {
      P2P.send({
        t: "deck_cards_revealed",
        playerName: state.myName,
        cards: moved,
        actionLabel: "山札からベンチに出した"
      });
    }
  } else if (destination === "trash") {
    moved.forEach(c => state.myTrash.push(c));
    addLog(`山札から${moved.length}枚（${names}）をトラッシュしました`, { suppressSync: true });
    showToast(`トラッシュ: ${names}`);
    if (typeof showCardRevealPopup === "function") {
      showCardRevealPopup(state.myName, moved, "山札からトラッシュした");
    }
    if (typeof P2P !== "undefined" && P2P.connected) {
      P2P.send({
        t: "deck_cards_revealed",
        playerName: state.myName,
        cards: moved,
        actionLabel: "山札からトラッシュした"
      });
    }
  }

  renderAll();
};

function showCardListModal(titleText, cardList) {
  const isOpponentList = titleText.includes("相手");
  let bodyHtml = `<div class="card-grid">`;
  cardList.forEach((c, idx) => {
    registerCard(c);
    const hasImg = !!c.imageUrl;
    const imgStyle = hasImg ? `style="background-image: url('${c.imageUrl}');"` : '';
    bodyHtml += `
      <div class="card ${c.color} ${hasImg ? 'has-img' : ''}" 
           ${imgStyle}
           ondblclick="event.stopPropagation(); window.openCardZoomByUid('${c.uid}')" 
           title="ダブルクリックで拡大">
        <div class="card-top"><span class="name">${c.name}</span></div>
        <div class="card-btm"><span>${c.sub || c.category || ''}</span></div>
        ${!isOpponentList ? `
        <div style="margin-top:4px;">
          <button class="btn green" style="padding:2px 4px; font-size:9px; width:100%;" onclick="pickFromList('${titleText}', ${idx})">手札に加える</button>
        </div>` : ''}
      </div>
    `;
  });
  bodyHtml += `</div>`;

  showModal(`${titleText} (${cardList.length} 枚)`, bodyHtml, `<button class="btn" onclick="closeModal()">閉じる</button>`);
}

window.pickFromList = function(listType, idx) {
  let list = listType.includes("ロスト") ? state.myLost : state.myTrash;
  if (idx < 0 || idx >= list.length) return;
  const card = list.splice(idx, 1)[0];
  state.myHand.push(card);
  closeModal();
  addLog(`${listType} から「${card.name}」を手札に戻しました`, {
    cards: [card],
    badge: `🖐️ ${listType}から手札へ`
  });
  showToast(`手札へ: ${card.name}`);
  renderAll();
};


function showLogModal() {
  const bodyHtml = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:8px;">
      <span style="font-size:12px; color:#94a3b8;">現在の試合の進行履歴（全 ${state.logs.length} 件）</span>
      <div style="display:flex; gap:6px;">
        <button class="btn btn-primary" style="padding:4px 10px; font-size:11px;" data-action="exportCsv">📥 CSVファイルに出力</button>
        <button class="btn btn-secondary" style="padding:4px 10px; font-size:11px;" data-action="triggerCsvImport">📂 CSV読込で再現</button>
      </div>
    </div>
    <div style="background:#0b0f19; padding:10px; border-radius:6px; font-size:12px; line-height:1.8; max-height:360px; overflow-y:auto; border:1px solid #1e293b;">
      ${state.logs.map(l => `<div>• ${l}</div>`).reverse().join("") || "ログはありません"}
    </div>
  `;
  showModal("対戦ログ / 試合出力・再現", bodyHtml, `<button class="btn" onclick="closeModal()">閉じる</button>`);
}

function showModal(title, body, foot, options = {}) {
  const modalEl = document.getElementById("modal");
  document.getElementById("modal-title").innerHTML = title;
  document.getElementById("modal-body").innerHTML = body;
  document.getElementById("modal-foot").innerHTML = foot;
  if (options && options.dismissible === false) {
    modalEl.dataset.noBackdropClose = "true";
  } else {
    delete modalEl.dataset.noBackdropClose;
  }
  modalEl.classList.remove("hidden");
}

function closeModal() {
  const modalEl = document.getElementById("modal");
  delete modalEl.dataset.noBackdropClose;
  modalEl.classList.add("hidden");
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2000);
}

// デッキプレビュー描画 (ロビー画面用)

