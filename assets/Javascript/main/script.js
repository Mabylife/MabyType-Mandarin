import { char2phonetic } from "../../pre_made_datas/char2phonetic.js";
import { mQuotes } from "../../pre_made_datas/mQuotes.js";

// const init
const input = document.getElementById("input");
const text = document.getElementById("text");
const nextBut = document.getElementById("nextBut");
const replayBut = document.getElementById("replayBut");
const settingBut = document.getElementById("settingBut");
const settingCon = document.getElementById("settingCon");
const loadingScreen = document.getElementById("loadingScreen");
const historyCon = document.getElementById("historyCon");
const historyBut = document.getElementById("historyBut");
const historyTable = document.getElementById("historyTable");
const hudTimer = document.getElementById("hudTimer");
// localStorage
let textType;
let how2Finish;
let isAutoCorrectOn; // 是否啟用宇宙霹靂無敵貼心之自動選字 (optional)
let isAutoDeleteUnderlineOn; // 是否啟用宇宙霹靂無敵貼心之自動刪除底線 (unable to disable for now)
let historyRecords = [];
// let init
let lastElapsedSeconds = -1;
let textIndex = 5; // 預設一次生 5 個 quote
let isStarted = false;
let isFinished = false;
let windowWidth;
let debounceTimer = null; // 用於防抖
let lastInputValue = "";
let isReplay = false;
let totalUsedTime;
let isSettingOpen = false;
let timerId = null;
// onclick
window.next = next;
window.replay = replay;
window.setting = setting;
window.displaySetting = displaySetting;
window.displayHistoryCon = displayHistoryCon;

function tmp2LocalStorage() {
  // 儲存數據
  localStorage.setItem("storage_autoCorrect", isAutoCorrectOn);
  localStorage.setItem("storage_autoDeleteUnderline", isAutoDeleteUnderlineOn);
  localStorage.setItem("storage_textType", textType);
  localStorage.setItem("storage_how2Finish", JSON.stringify(how2Finish));
  localStorage.setItem("historyRecords", JSON.stringify(historyRecords));
}

function localStorage2Tmp() {
  // 讀取數據，若本地沒有則用預設值
  isAutoCorrectOn = localStorage.getItem("storage_autoCorrect") !== null ? JSON.parse(localStorage.getItem("storage_autoCorrect")) : true;
  isAutoDeleteUnderlineOn = localStorage.getItem("storage_autoDeleteUnderline") !== null ? JSON.parse(localStorage.getItem("storage_autoDeleteUnderline")) : true;
  textType = localStorage.getItem("storage_textType") !== null ? localStorage.getItem("storage_textType") : "quote";
  how2Finish = localStorage.getItem("storage_how2Finish") !== null ? JSON.parse(localStorage.getItem("storage_how2Finish")) : ["onTime", 30];
  historyRecords = localStorage.getItem("historyRecords") !== null ? JSON.parse(localStorage.getItem("historyRecords")) : [];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function checkAnswer() {
  let inputValue = (input.value.match(/[\u4e00-\u9fff，。]/g) || []).join("").trim();

  if (lastInputValue !== null && inputValue === lastInputValue) return; // 防止重複檢查
  if (inputValue.length === 0 && input.value.length !== 0) return; // 防止檢查拼音中文字

  lastInputValue = inputValue;

  if (!isStarted && inputValue !== "") start(); // 如果還沒開始遊戲，且有輸入文字，則開始遊戲

  if (isAutoDeleteUnderlineOn) {
    input.blur();
  }

  const spans = text.querySelectorAll("span");

  for (let i = 0; i < spans.length; i++) {
    const inputPhonetics = char2phonetic[inputValue.charAt(i)] || [];
    const textPhonetics = char2phonetic[spans[i].textContent] || [];
    if (inputPhonetics.some((p) => textPhonetics.includes(p))) {
      spans[i].classList.remove("correct", "incorrect");
      spans[i].classList.add("correct");

      if (isAutoCorrectOn && input.value.charAt(i) !== spans[i].textContent && inputValue.charAt(i) !== "，" && inputValue.charAt(i) !== "。") {
        input.value = input.value.substring(0, i) + spans[i].textContent + input.value.substring(i + 1);
      }
    } else if (inputValue.charAt(i) === "") {
      spans[i].classList.remove("correct", "incorrect");
    } else {
      spans[i].classList.remove("correct", "incorrect");
      spans[i].classList.add("incorrect");
    }
  }

  if (isAutoDeleteUnderlineOn) {
    input.focus();
  }

  requestAnimationFrame(() => {
    scrollTheWholeShit();
  });

  const typedChar = document.querySelectorAll(".correct, .incorrect").length;
  if (typedChar > spans.length * 0.6) {
    setTimeout(() => {
      addText();
    }, 0);
  }
}

function addText() {
  if (textType === "quote") {
    for (let i = 0; i < textIndex; i++) {
      const newQuote = mQuotes[randomNumber(0, mQuotes.length - 1)];
      const wrapped = newQuote
        .split("")
        .map((c) => `<span class="char">${c}</span>`)
        .join("");
      text.innerHTML += wrapped;
    }
  }
  text.style.width = windowWidth / 2 + "px"; // 設定文字寬度為視窗寬度
}

function scrollTheWholeShit() {
  requestAnimationFrame(() => {
    const typedChar = document.querySelectorAll(".correct, .incorrect").length;
    const charElement = document.querySelector(".char");
    const perScrollWidth = charElement ? charElement.getBoundingClientRect().width : 0;
    const scrollWidth = typedChar * perScrollWidth;

    requestAnimationFrame(() => {
      text.style.transform = `translateY(calc(-50% - 55px)) translateX(-${scrollWidth}px)`;
      text.style.width = windowWidth / 2 + scrollWidth + "px";
      input.style.transform = `translateY(calc(-50% - 55px)) translateX(-${scrollWidth}px)`;
      // 防止初始寬度過小
      const textWidth = Math.max(text.getBoundingClientRect().width, 400);
      input.style.width = textWidth + 25 + "px";
      // transition 只設一次
      if (text.style.transition === "") {
        text.style.transition = "transform 0.15s ease-in-out";
        input.style.transition = "transform 0.15s ease-in-out, opacity 0.15s ease-in-out";
      }
    });
  });
}

function start() {
  isStarted = true;
  if (how2Finish[0] === "onTime") {
    startSecondsTimer(how2Finish[1], finish);
  }
  document.documentElement.classList.add("inGame");
}

function startSecondsTimer(s, callback) {
  const startTime = performance.now();
  check();
  function check() {
    const now = performance.now();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    // 每到一個整數秒數的時候 更新hud
    if (elapsedSeconds !== lastElapsedSeconds) {
      hudTimer.textContent = s - elapsedSeconds;
      lastElapsedSeconds = elapsedSeconds;
    }
    if (now - startTime >= s * 1000) {
      totalUsedTime = (now - startTime) / 1000;
      callback();
      timerId = null;
    } else {
      timerId = requestAnimationFrame(check);
    }
  }
}

function stopSecondsTimer() {
  if (timerId !== null) {
    cancelAnimationFrame(timerId);
    timerId = null;
  }
}

function finish() {
  document.documentElement.classList.remove("inGame");
  isFinished = true;
  input.blur();
  input.style.opacity = "0.2";
  deleteNoneMandarinChars();
  getResult();
}

function deleteNoneMandarinChars() {
  // 清空 input，只保留中文字
  input.value = input.value.replace(/[^\u4e00-\u9fff，。]/g, "");
}

function startNewGameReset(ifAddText) {
  historyCon.classList.remove("open");
  document.getElementById("resultCon").classList.remove("visible");
  document.documentElement.classList.remove("inGame");
  input.style.opacity = "1";
  text.style.opacity = "1";
  stopSecondsTimer();
  isStarted = false;
  isFinished = false;
  input.focus();
  input.value = "";
  document.querySelectorAll(".correct, .incorrect").forEach((el) => {
    el.classList.remove("correct", "incorrect");
  });
  if (ifAddText) {
    text.innerHTML = "";
    addText();
  }
  requestAnimationFrame(() => {
    scrollTheWholeShit();
  });
}

function resizeUpdate() {
  windowWidth = window.innerWidth; // 更新視窗寬度
  document.body.style.width = windowWidth + "px"; // 更新 body 寬度
  text.style.width = windowWidth / 2 + "px"; // 更新文字寬度
  requestAnimationFrame(() => {
    scrollTheWholeShit();
  });
}

function next() {
  isReplay = false;
  setTimeout(() => {
    nextBut.classList.remove("active");
  }, 300);
  nextBut.classList.add("active");
  startNewGameReset(true);
}

function replay() {
  isReplay = true;
  setTimeout(() => {
    replayBut.classList.remove("active");
  }, 300);
  replayBut.classList.add("active");
  startNewGameReset(false);
}

function getResult() {
  const incorrectChars = document.querySelectorAll(".incorrect");
  const correctChars = document.querySelectorAll(".correct");
  const totalChars = incorrectChars.length + correctChars.length;
  const accuracy = Number(correctChars.length / totalChars) * 100;
  const wpm = Math.round(Number((totalChars / totalUsedTime) * 60));
  const wpmNet = Math.round(Number((correctChars.length / totalUsedTime) * 60));
  const resultCon = document.getElementById("resultCon");

  // rating
  let ratingChar = "";
  if (wpm < 15 || accuracy < 90) {
    ratingChar = "F";
  } else if (wpm >= 180) {
    ratingChar = "SSS";
  } else if (wpm >= 140) {
    ratingChar = "SS";
  } else if (wpm >= 90) {
    ratingChar = "S";
  } else if (wpm >= 75) {
    ratingChar = "A+";
  } else if (wpm >= 60) {
    ratingChar = "A–";
  } else if (wpm >= 45) {
    ratingChar = "B+";
  } else if (wpm >= 30) {
    ratingChar = "B–";
  } else if (wpm >= 25) {
    ratingChar = "C+";
  } else if (wpm >= 15) {
    ratingChar = "C–";
  }

  // update the values in html
  document.getElementById("wpmResult").textContent = `${wpm} / ${wpmNet}`;
  document.getElementById("ratingResult").textContent = ratingChar;
  document.getElementById("accuracyResult").textContent = `${accuracy % 1 === 0 ? accuracy.toFixed(0) : accuracy.toFixed(1)}%`;
  if (isReplay) {
    document.getElementById("modeResult").textContent = `名言 / ${how2Finish[1]} 秒 / 重玩`;
  } else {
    document.getElementById("modeResult").textContent = `名言 / ${how2Finish[1]} 秒`;
  }

  // display
  resultCon.classList.add("visible");
  text.style.opacity = "0";
  input.style.opacity = "0";

  // store to localStorage
  if (!isReplay && accuracy >= 90) {
    const record = {
      wpm: Math.round(wpm),
      wpmNet: Math.round(wpmNet),
      ratingChar: ratingChar,
      mode: `名言 / ${how2Finish[1]} 秒`,
      time: getCurrentTimeString(),
    };

    // 新增紀錄
    historyRecords.push(record);

    // 儲存回 localStorage
    localStorage.setItem("historyRecords", JSON.stringify(historyRecords));
  }
  console.log("歷史紀錄:", historyRecords);
}

function getCurrentTimeString() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${yy}/${mm}/${dd}/${hh}:${min}`;
}

function setting(setting, value) {
  if (setting === "time") {
    how2Finish[1] = value;
  } else if (setting === "textType") {
    textType = value;
  } else if (setting === "autoDeleteUnderline") {
    isAutoDeleteUnderlineOn = value;
  } else if (setting === "autoCorrect") {
    isAutoCorrectOn = value;
  }
  applySettingsOnUI();
  tmp2LocalStorage(); // 儲存設定到 localStorage
}

function applySettingsOnUI() {
  // Time setting
  const timeButtons = document.getElementById("timeSetting").querySelectorAll("button");
  timeButtons.forEach((btn) => btn.classList.remove("selected"));
  if (how2Finish[0] === "onTime") {
    if (how2Finish[1] === 30) {
      timeButtons[0].classList.add("selected");
    } else if (how2Finish[1] === 60) {
      timeButtons[1].classList.add("selected");
    } else {
      timeButtons[2].classList.add("selected");
      document.getElementById("timeSetting").querySelector("input").value = how2Finish[1];
    }
  }

  // Text type setting
  const textTypeButtons = document.getElementById("textTypeSetting").querySelectorAll("button");
  textTypeButtons.forEach((btn) => btn.classList.remove("selected"));
  if (textType === "quote") {
    textTypeButtons[0].classList.add("selected");
  }

  // Auto delete underline setting
  const autoDeleteUnderlineButtons = document.getElementById("autoDeleteUnderlineSetting").querySelectorAll("button");
  autoDeleteUnderlineButtons.forEach((btn) => btn.classList.remove("selected"));
  if (isAutoDeleteUnderlineOn) {
    autoDeleteUnderlineButtons[0].classList.add("selected");
  } else {
    autoDeleteUnderlineButtons[1].classList.add("selected");
  }

  // Auto correct setting
  const autoCorrectButtons = document.getElementById("autoCorrectSetting").querySelectorAll("button");
  autoCorrectButtons.forEach((btn) => btn.classList.remove("selected"));
  if (isAutoCorrectOn) {
    autoCorrectButtons[0].classList.add("selected");
  } else {
    autoCorrectButtons[1].classList.add("selected");
  }
}

function displaySetting() {
  setTimeout(() => {
    settingBut.classList.remove("active");
  }, 300);
  settingBut.classList.add("active");
  applySettingsOnUI();
  if (isSettingOpen) {
    // 如果設定已經開啟
    settingCon.classList.remove("open");
    input.style.opacity = "1";
    text.style.opacity = "1";
    isSettingOpen = false;
    document.getElementById("settingBut").querySelector("img").src = "assets/image/icons/setting.svg";
    document.getElementById("settingBut").classList.remove("settingOn");
    next();
    document.documentElement.classList.remove("settingOpening");
  } else {
    document.documentElement.classList.add("settingOpening");
    document.getElementById("settingBut").classList.add("settingOn");
    document.getElementById("settingBut").querySelector("img").src = "assets/image/icons/xcircle.svg";
    input.blur(); // 失去焦點
    settingCon.classList.add("open");
    input.style.opacity = "0";
    text.style.opacity = "0";
    isSettingOpen = true;
  }
}

function displayHistoryCon() {
  applySettingsOnUI();
  if (historyCon.classList.contains("open")) {
    // 如果練習紀錄已經開啟
    historyCon.classList.remove("open");
    historyTable.innerHTML = ""; // 清空歷史紀錄表格
    historyBut.textContent = "練習紀錄";
  } else {
    data2HistoryTable(); // 將歷史紀錄數據轉換為表格
    historyCon.classList.add("open");
    historyBut.textContent = "關閉練習紀錄";
  }
}

function data2HistoryTable() {
  // 找出最高的 wpm 及其對應的 wpmNet
  let highestWpm = 0;
  let highestWpmNet = 0;
  let highestIndex = [];
  let highestWpmStr;

  historyRecords.forEach((record, i) => {
    record.highest = false; // 初始化最高紀錄標記
    if (record.wpm > highestWpm || (record.wpm === highestWpm && record.wpmNet > highestWpmNet)) {
      highestWpm = record.wpm;
      highestWpmNet = record.wpmNet;
      highestIndex = [i];
    } else if (record.wpm === highestWpm && record.wpmNet === highestWpmNet) {
      highestIndex.push(i);
    }
  });

  // 如果沒有紀錄，則顯示無
  if (highestWpm === 0) {
    highestWpmStr = "無";
  } else {
    highestIndex.forEach((i) => {
      historyRecords[i].highest = true; // 標記為最高紀錄
    });
    highestWpmStr = `${highestWpm} / ${highestWpmNet}`;
  }

  document.getElementById("highestWpm").textContent = highestWpmStr;

  historyTable.innerHTML = ""; // 清空歷史紀錄表格
  if (historyRecords.length === 0) {
    historyTable.innerHTML = "<tr><td colspan='4'>沒有練習紀錄</td></tr>";
    return;
  }

  // 添加表頭
  const headerRow = document.createElement("tr");
  const theader = document.createElement("thead");
  headerRow.innerHTML = "<th>編號</th><th>WPM</th><th>評級</th><th>模式</th><th>時間</th>";
  theader.appendChild(headerRow);
  historyTable.appendChild(theader);

  // 添加每條紀錄
  historyRecords
    .slice()
    .reverse()
    .forEach((record, i) => {
      const row = document.createElement("tr");
      const index = historyRecords.length - i;
      row.innerHTML = `<td>${index}</td><td>${record.wpm} / ${record.wpmNet}</td><td>${record.ratingChar}</td><td>${record.mode}</td><td>${record.time}</td>`;
      if (record.highest === true) {
        row.classList.add("highest");
      }
      historyTable.appendChild(row);
    });
}

// EventListeners

document.addEventListener("keydown", (e) => {
  if (e.key === "Tab" && !isSettingOpen) {
    e.preventDefault(); // 阻止 Tab 鍵的預設行為
    next();
  }
  if (e.altKey && e.key.toLowerCase() === "r" && !isSettingOpen) {
    e.preventDefault(); // 阻止 Alt + R 的預設行為
    replay();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  document.fonts.ready.then(() => {
    localStorage2Tmp(); // 讀取本地存儲的設定
    startNewGameReset(true);
    resizeUpdate();
    window.addEventListener("resize", resizeUpdate);
    setTimeout(() => {
      loadingScreen.classList.add("hidden");
    }, 2000);
  });
});

input.addEventListener("focus", () => {
  if (isFinished) {
    input.blur();
  }
});

input.addEventListener("input", () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    checkAnswer();
  }, 0);
});

input.addEventListener("paste", (event) => {
  event.preventDefault(); // 阻止所有 paste 行為
  alert("唉呦小調皮，還想貼上");
});
