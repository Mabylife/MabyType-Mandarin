import { char2phonetic } from "./pre_made_datas/char2phonetic.js";
import { mQuotes } from "./pre_made_datas/mQuotes.js";
console.log("script.js loaded");

const input = document.getElementById("input");
const text = document.getElementById("text");
const nextBut = document.getElementById("nextBut");
const replayBut = document.getElementById("replayBut");
const settingBut = document.getElementById("settingBut");
const settingCon = document.getElementById("settingCon");

let textType = "quote"; // 目前只支援 quote 類型
let textIndex = 5; // 預設顯示 5 個 quote
let how2Finish = ["onTime", 30]; // 預設 30 秒後結束
let isStarted = false;
let isFinished = false;
let windowWidth; // 獲取視窗寬度
let debounceTimer = null; // 用於防抖
let isAutoCorrectOn = true; // 是否啟用宇宙霹靂無敵貼心之自動選字 (optional)
let lastInputValue = "";
let isReplay = false; // 是否正在重玩
const isAutoDeleteUnderlineOn = true; // 是否啟用宇宙霹靂無敵貼心之自動刪除底線 (unable to disable for now)
window.next = next;
window.replay = replay;
window.setting = setting;
window.displaySetting = displaySetting;

let isSettingOpen = false;

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

input.addEventListener("input", () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    checkAnswer();
  }, 0);
});

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
  let needAutoComplete = false;

  for (let i = 0; i < spans.length; i++) {
    const inputPhonetics = char2phonetic[inputValue.charAt(i)] || [];
    const textPhonetics = char2phonetic[spans[i].textContent] || [];
    if (inputPhonetics.some((p) => textPhonetics.includes(p))) {
      spans[i].classList.remove("correct", "incorrect");
      spans[i].classList.add("correct");

      if (isAutoCorrectOn && input.value.charAt(i) !== spans[i].textContent) {
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
  console.log("Add text");
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
      text.style.transform = `translateY(-50%) translateX(-${scrollWidth}px)`;
      text.style.width = windowWidth / 2 + scrollWidth + "px";
      input.style.transform = `translateY(-50%) translateX(-${scrollWidth}px)`;
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
  console.log("Start");
  isStarted = true;
  if (how2Finish[0] === "onTime") {
    startSecondsTimer(how2Finish[1], finish);
  }
  document.documentElement.classList.add("inGame");
}

let timerId = null;
function startSecondsTimer(s, callback) {
  const startTime = performance.now();
  function check() {
    const now = performance.now();
    if (now - startTime >= s * 1000) {
      totalUsedTime = (now - startTime) / 1000;
      console.log(`實際總用時: ${totalUsedTime} 秒`);
      callback();
      timerId = null;
    } else {
      timerId = requestAnimationFrame(check);
    }
  }
  check();
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
  console.log("Finish");
  input.blur();
  input.style.opacity = "0.2";
  deleteNoneMandarinChars();
  getResult();
}

function deleteNoneMandarinChars() {
  // 清空 input，只保留中文字
  input.value = input.value.replace(/[^\u4e00-\u9fff，。]/g, "");
}

input.addEventListener("focus", () => {
  if (isFinished) {
    input.blur();
  }
});

function startNewGameReset(ifAddText) {
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

document.addEventListener("DOMContentLoaded", () => {
  startNewGameReset(true);
  windowWidth = window.innerWidth; // 更新視窗寬度
  document.body.style.width = windowWidth + "px"; // 更新 body 寬度
  text.style.width = windowWidth / 2 + "px"; // 更新文字寬度
  window.addEventListener("resize", () => {
    windowWidth = window.innerWidth; // 更新視窗寬度
    document.body.style.width = windowWidth + "px"; // 更新 body 寬度
    text.style.width = windowWidth / 2 + "px"; // 更新文字寬度
    requestAnimationFrame(() => {
      scrollTheWholeShit();
    });
  });
});

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

let totalUsedTime;

function getResult() {
  const incorrectChars = document.querySelectorAll(".incorrect");
  const correctChars = document.querySelectorAll(".correct");
  const totalChars = incorrectChars.length + correctChars.length;
  const accuracy = Number(correctChars.length / totalChars) * 100;
  const wpm = Number((totalChars / totalUsedTime) * 60);
  const wpmNet = Number((correctChars.length / totalUsedTime) * 60);
  const resultCon = document.getElementById("resultCon");

  // rating
  let ratingChar = "";
  if (wpm < 15 || accuracy < 90) {
    ratingChar = "F";
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
  document.getElementById("wpmResult").textContent = `${Math.round(wpm)} / ${Math.round(wpmNet)}`;
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
  applySettingsOnUI();
  if (isSettingOpen) {
    // 如果設定已經開啟
    settingCon.classList.remove("open");
    input.style.opacity = "1";
    text.style.opacity = "1";
    isSettingOpen = false;
    document.getElementById("settingBut").querySelector("img").src = "icons/setting.svg";
    document.getElementById("settingBut").classList.remove("settingOn");
    next();
    document.documentElement.classList.remove("settingOpening");
  } else {
    document.documentElement.classList.add("settingOpening");
    document.getElementById("settingBut").classList.add("settingOn");
    document.getElementById("settingBut").querySelector("img").src = "icons/xcircle.svg";
    input.blur(); // 失去焦點
    settingCon.classList.add("open");
    input.style.opacity = "0";
    text.style.opacity = "0";
    isSettingOpen = true;
  }
}
