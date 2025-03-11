'use strict'

const gridContainer = document.getElementById("gridContainer");
    const addSeatButton = document.getElementById("addSeatButton");
    const removeSeatButton = document.getElementById("removeSeatButton");
    const shuffleButton = document.getElementById("shuffleButton");
    const completionMessage = document.getElementById("completionMessage");
    const countdownOverlay = document.getElementById("countdownOverlay");
    
    // 入力内容に日本語の文字（ひらがな、カタカナ、漢字）が含まれているか判定する関数
    function containsJapanese(text) {
      return /[\u3040-\u30FF\u4E00-\u9FFF]/.test(text);
    }
    
    // 入力値に応じてフォントを更新する関数
    function updateInputFont(input) {
      const text = input.value;
      if (containsJapanese(text)) {
        input.style.fontFamily = "'DotGothic16', sans-serif";
      } else {
        input.style.fontFamily = "'Press Start 2P', monospace";
      }
    }
    
    // 各セル作成時に input にイベントリスナーを追加
    function attachInputListener(input) {
      input.addEventListener("input", () => {
        updateInputFont(input);
      });
      // 初期設定
      updateInputFont(input);
    }
    
    // gridContainer 内の全セルの位置からコンテナサイズを更新
    function updateContainerSize() {
      const seats = Array.from(document.querySelectorAll(".seat"));
      let maxRight = 0, maxBottom = 0;
      const containerRect = gridContainer.getBoundingClientRect();
      seats.forEach(seat => {
        const rect = seat.getBoundingClientRect();
        const right = rect.left - containerRect.left + rect.width;
        const bottom = rect.top - containerRect.top + rect.height;
        if (right > maxRight) maxRight = right;
        if (bottom > maxBottom) maxBottom = bottom;
      });
      gridContainer.style.width = Math.max(800, maxRight + 20) + "px";
      gridContainer.style.height = Math.max(600, maxBottom + 20) + "px";
    }
    
    // セル作成関数 (x, y は gridContainer 内の座標)
    // ※ 初回の位置を data 属性に保存（その後ドラッグした位置で更新）
    function createSeat(x, y, name = "") {
      const seat = document.createElement("div");
      seat.classList.add("seat");
      const posX = (x !== undefined ? x : 20);
      const posY = (y !== undefined ? y : 20);
      seat.style.left = posX + "px";
      seat.style.top = posY + "px";
      // 初期位置を保存（ドラッグ後に更新される）
      seat.dataset.defaultLeft = posX;
      seat.dataset.defaultTop  = posY;
      
      const input = document.createElement("input");
      input.type = "text";
      input.value = name;
      input.addEventListener("mousedown", e => e.stopPropagation());
      // 入力値に応じてフォントを更新するためのリスナーを追加
      attachInputListener(input);
      seat.appendChild(input);
      
      // ドラッグ＆ドロップ処理
      seat.addEventListener("mousedown", function(e) {
        if(e.target.tagName === "INPUT") return;
        const startX = e.clientX;
        const startY = e.clientY;
        const rect = seat.getBoundingClientRect();
        const containerRect = gridContainer.getBoundingClientRect();
        const origX = rect.left - containerRect.left;
        const origY = rect.top - containerRect.top;
        function onMouseMove(ev) {
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;
          seat.style.left = (origX + dx) + "px";
          seat.style.top = (origY + dy) + "px";
          updateContainerSize();
        }
        function onMouseUp() {
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
          // ドラッグ後の位置でデフォルト位置を更新する
          seat.dataset.defaultLeft = parseFloat(seat.style.left);
          seat.dataset.defaultTop  = parseFloat(seat.style.top);
          updateContainerSize();
        }
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });
      
      gridContainer.appendChild(seat);
      updateContainerSize();
    }
    
    // ＋ボタン：新規セルを gridContainer 内のランダムな位置に追加
    addSeatButton.addEventListener("click", function() {
      const rect = gridContainer.getBoundingClientRect();
      const x = Math.random() * (rect.width - 120);
      const y = Math.random() * (rect.height - 120);
      createSeat(x, y, "");
    });
    
    // －ボタン：最後に追加されたセルを削除
    removeSeatButton.addEventListener("click", function() {
      const seats = Array.from(document.querySelectorAll(".seat"));
      if(seats.length === 0) return;
      const lastSeat = seats[seats.length - 1];
      gridContainer.removeChild(lastSeat);
      updateContainerSize();
    });
    
    // カウントダウン開始関数（callback はカウントダウン終了後に実行）
    function startCountdown(callback) {
      let count = 3;
      countdownOverlay.textContent = count;
      countdownOverlay.style.display = "block";
      const interval = setInterval(() => {
        count--;
        if(count > 0) {
          countdownOverlay.textContent = count;
        } else {
          clearInterval(interval);
          countdownOverlay.style.display = "none";
          callback();
        }
      }, 1000);
    }
    
    // 席替え処理本体
    function performShuffle() {
      const seats = Array.from(document.querySelectorAll(".seat"));
      // 初期位置は各セルの data 属性から取得
      const positions = seats.map(seat => ({
        left: parseFloat(seat.dataset.defaultLeft),
        top: parseFloat(seat.dataset.defaultTop)
      }));
      // 位置リストをシャッフル
      const newPositions = shuffleArray([...positions]);
      const duration = 600; // アニメーション時間（ms）
      seats.forEach((seat, index) => {
        const startX = parseFloat(seat.style.left);
        const startY = parseFloat(seat.style.top);
        const target = newPositions[index];
        animateCell(seat, startX, startY, target.left, target.top, duration);
      });
      // アニメーション終了後に「完了‼」メッセージを表示
      setTimeout(() => {
        completionMessage.style.display = "block";
        setTimeout(() => {
          completionMessage.style.display = "none";
          shuffleButton.disabled = false;
        }, 1500);
      }, duration + 50);
    }
    
    // 席替えボタン：カウントダウン開始→席替え処理実行
    shuffleButton.addEventListener("click", function() {
      shuffleButton.disabled = true;
      startCountdown(() => {
        performShuffle();
      });
    });
    
    // アニメーション関数：duration 内に left/top を線形補間して更新
    function animateCell(cell, startX, startY, endX, endY, duration) {
      const startTime = performance.now();
      function animate(now) {
        const elapsed = now - startTime;
        const ratio = Math.min(elapsed / duration, 1);
        const currentX = startX + (endX - startX) * ratio;
        const currentY = startY + (endY - startY) * ratio;
        cell.style.left = currentX + "px";
        cell.style.top = currentY + "px";
        if (ratio < 1) {
          requestAnimationFrame(animate);
        } else {
          cell.style.left = endX + "px";
          cell.style.top = endY + "px";
        }
      }
      requestAnimationFrame(animate);
    }
    
    // Fisher–Yates シャッフル
    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
    
    // 初期状態として例として6個のセルを配置
    for (let i = 0; i < 6; i++) {
      const x = 20 + i * 110;
      const y = 20;
      createSeat(x, y, "生徒" + (i+1));
    }
    updateContainerSize();