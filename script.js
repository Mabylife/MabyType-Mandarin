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
let how2Finish = ["onTime", 5]; // 預設 30 秒後結束
let isStarted = false;
let isFinished = false;
let windowWidth; // 獲取視窗寬度
let debounceTimer = null; // 用於防抖
let isAutoCorrectOn = true; // 是否啟用宇宙霹靂無敵貼心之自動選字 (optional)
let lastInputValue = "";
const isAutoDeleteUnderlineOn = true; // 是否啟用宇宙霹靂無敵貼心之自動刪除底線 (unable to disable for now)
window.next = next;
window.replay = replay;
window.setting = setting;

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
  let inputValue = (input.value.match(/[\u4e00-\u9fff，。]/g) || [])
    .join("")
    .trim();

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
        input.value =
          input.value.substring(0, i) +
          spans[i].textContent +
          input.value.substring(i + 1);
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
    const perScrollWidth = charElement
      ? charElement.getBoundingClientRect().width
      : 0;
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
        input.style.transition =
          "transform 0.15s ease-in-out, opacity 0.15s ease-in-out";
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
  isFinished = true;
  console.log("Finish");
  input.blur();
  input.classList.add("finished");
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
  input.classList.remove("finished");
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
  setTimeout(() => {
    nextBut.classList.remove("active");
  }, 300);
  nextBut.classList.add("active");
  startNewGameReset(true);
}

function replay() {
  setTimeout(() => {
    replayBut.classList.remove("active");
  }, 300);
  replayBut.classList.add("active");
  startNewGameReset(false);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault(); // 阻止 Tab 鍵的預設行為
    next();
  }
  if (e.altKey && e.key.toLowerCase() === "r") {
    e.preventDefault(); // 阻止 Alt + R 的預設行為
    replay();
  }
});

let totalUsedTime;

function getResult() {
  const incorrectChars = document.querySelectorAll(".incorrect");
  const correctChars = document.querySelectorAll(".correct");
  const totalChars = incorrectChars.length + correctChars.length;
  const accuracy = (correctChars.length / totalChars) * 100;
  const wpm = Math.round((totalChars / totalUsedTime) * 60); // 每分鐘打字數，四捨五入到整數
  console.log(`總字數: ${totalChars}`);
  console.log(`正確字數: ${correctChars.length}`);
  console.log(`錯誤字數: ${incorrectChars.length}`);
  console.log(`正確率: ${accuracy.toFixed(2)}%`);
  if (how2Finish[0] === "onTime") {
    console.log(`用時: ${how2Finish[1]} 秒`);
  }
  console.log(`每分鐘打字數: ${wpm}`);
}

function setting() {
  if (isSettingOpen) { // 如果設定已經開啟
    settingCon.classList.remove("open");
    input.style.visibility = "visible";
    text.style.visibility = "visible";
    isSettingOpen = false;
    input.focus(); // 重新聚焦到輸入框
  } else {
    input.blur(); // 失去焦點
    settingCon.classList.add("open");
    input.style.visibility = "hidden";
    text.style.visibility = "hidden";
    isSettingOpen = true;
  }
}
